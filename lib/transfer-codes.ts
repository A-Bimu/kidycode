import { hashAccessKey, makeAccessKey } from "@/lib/access-keys";
import { sha256Hex } from "@/lib/digest";
import {
  CLAIM_WINDOW_MINUTES,
  MAX_CLAIM_ATTEMPTS_PER_WINDOW,
  MAX_CODE_FAILED_ATTEMPTS,
  generateConnectCode,
  groupConnectCode,
  hashConnectCode,
  isCodeExpired,
} from "@/lib/one-time-codes";

/*
 * Learner transfer codes.
 *
 * Moving a profile to another device rotates the learner's access key, and that
 * rotation must happen exactly once, only for the request that won the code, and
 * only for a learner we already know how to return to. Everything here is
 * arranged around those three facts:
 *
 *   1. The claim is one conditional update, so only one caller can move a code
 *      from unused to used.
 *   2. Every other mutation in that transaction is gated on the device token that
 *      won the claim. A caller whose claim matched no row therefore changes no
 *      access key, no sibling code, no applied state and no attempt counter. This
 *      is what stops a stale request from destroying the learner's newer code
 *      during a claim versus replacement race.
 *   3. The learner is read before the key changes, and nothing is awaited after
 *      the rotation. A failure can therefore never leave the previous device
 *      signed out with no new cookie to hand back.
 *
 * Replacement is a single transaction too: the code, its digest and its row id
 * are all generated first, so invalidation and insertion cannot be separated by a
 * competing request.
 */

export const TRANSFER_TTL_MINUTES = 10;

/* The row count is the only thing that matters from these statements: it is how a
 * caller learns whether it won the claim. */
function changedRows(result: unknown): number {
  const value = (result as { meta?: { changes?: number } } | undefined)?.meta?.changes;
  return typeof value === "number" ? value : 0;
}

export type TransferCodeRow = {
  id: string;
  learnerId: string;
  expiresAt: string;
  usedAt: string | null;
  invalidatedAt: string | null;
  failedAttempts: number;
};

export type TransferOutcome =
  | { status: "transferred"; learnerId: string; courseId: string; nickname: string }
  | { status: "not-found" | "used" | "invalidated" | "expired" | "locked" | "raced" | "rate-limited" };

function windowStart(now: string): string {
  return new Date(new Date(now).getTime() - CLAIM_WINDOW_MINUTES * 60_000).toISOString();
}

/* Codes are bound per source address so guesses that match no digest are still
 * bounded. The address itself is never stored, only a digest of it. */
export async function sourceScope(address: string): Promise<string> {
  return (await sha256Hex(`transfer:${address}`)).slice(0, 24);
}

export async function attemptsExceeded(database: D1Database, scope: string, now: string): Promise<boolean> {
  const row = await database
    .prepare("SELECT attempts, window_at AS windowAt FROM transfer_claim_limits WHERE scope = ?")
    .bind(scope)
    .first<{ attempts: number; windowAt: string | null }>();
  if (!row || row.attempts < MAX_CLAIM_ATTEMPTS_PER_WINDOW) return false;
  return Boolean(row.windowAt) && row.windowAt! >= windowStart(now);
}

async function noteAttempt(database: D1Database, scope: string, now: string): Promise<void> {
  await database
    .prepare(`INSERT INTO transfer_claim_limits (scope, attempts, window_at) VALUES (?, 1, ?)
      ON CONFLICT (scope) DO UPDATE SET
        attempts = CASE WHEN transfer_claim_limits.window_at IS NULL OR transfer_claim_limits.window_at < ? THEN 1
          ELSE MIN(transfer_claim_limits.attempts + 1, 99) END,
        window_at = excluded.window_at`)
    .bind(scope, now, windowStart(now))
    .run();
}

/* A new code cancels any unused code this learner already had, so only the newest
 * code can ever be claimed. `createdBy` records whether the learner made it or a
 * linked grown-up made it on their behalf.
 *
 * The code, its digest and its id are generated before the transaction, so the
 * transaction is a single pair of writes. Two requests arriving at the same moment
 * cannot both leave an active code behind: the second transaction runs after the
 * first has committed, and its invalidation catches the code the first inserted. */
export async function createTransferCode(
  database: D1Database,
  learnerId: string,
  createdBy: "learner" | "guardian",
  now: string,
): Promise<{ code: string; expiresAt: string }> {
  const code = generateConnectCode();
  const digest = await hashConnectCode(code);
  const id = crypto.randomUUID();
  const expiresAt = new Date(new Date(now).getTime() + TRANSFER_TTL_MINUTES * 60_000).toISOString();

  await database.batch([
    database
      .prepare(`UPDATE learner_transfer_codes SET invalidated_at = ?
        WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL`)
      .bind(now, learnerId),
    database
      .prepare(`INSERT INTO learner_transfer_codes
        (id, learner_id, code_digest, created_by, created_at, expires_at, used_at, used_by_device, applied_at, invalidated_at, failed_attempts)
        VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 0)`)
      .bind(id, learnerId, digest, createdBy, now, expiresAt),
  ]);

  return { code: groupConnectCode(code), expiresAt };
}

/* Cancelling leaves the row in place with a mark, so the code stops working and
 * the record of what happened is not lost. */
export async function cancelTransferCode(database: D1Database, learnerId: string, now: string): Promise<boolean> {
  const result = await database
    .prepare(`UPDATE learner_transfer_codes SET invalidated_at = ?
      WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL`)
    .bind(now, learnerId)
    .run();
  return changedRows(result) > 0;
}

export async function pendingTransferCode(
  database: D1Database,
  learnerId: string,
  now: string,
): Promise<{ expiresAt: string } | null> {
  const row = await database
    .prepare(`SELECT expires_at AS expiresAt FROM learner_transfer_codes
      WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL
      ORDER BY created_at DESC LIMIT 1`)
    .bind(learnerId)
    .first<{ expiresAt: string }>();
  if (!row) return null;
  return isCodeExpired(row.expiresAt, now) ? null : { expiresAt: row.expiresAt };
}

async function findTransferByDigest(database: D1Database, digest: string): Promise<TransferCodeRow | null> {
  return await database
    .prepare(`SELECT id, learner_id AS learnerId, expires_at AS expiresAt, used_at AS usedAt,
      invalidated_at AS invalidatedAt, failed_attempts AS failedAttempts
      FROM learner_transfer_codes WHERE code_digest = ?`)
    .bind(digest)
    .first<TransferCodeRow>() || null;
}

async function countCodeFailure(database: D1Database, codeId: string, now: string): Promise<void> {
  await database
    .prepare(`UPDATE learner_transfer_codes SET
      failed_attempts = MIN(failed_attempts + 1, ${MAX_CODE_FAILED_ATTEMPTS}),
      invalidated_at = CASE WHEN failed_attempts + 1 >= ${MAX_CODE_FAILED_ATTEMPTS} THEN ? ELSE invalidated_at END
      WHERE id = ?`)
    .bind(now, codeId)
    .run();
}

/* The new key is generated here and handed back to the caller only so the route
 * can put it in an HttpOnly cookie. It is never stored in the clear. */
export async function claimTransferCode(
  database: D1Database,
  normalised: string,
  scope: string,
  now: string,
): Promise<TransferOutcome & { newAccessKey?: string }> {
  if (await attemptsExceeded(database, scope, now)) return { status: "rate-limited" };

  const digest = await hashConnectCode(normalised);
  const code = await findTransferByDigest(database, digest);
  if (!code) {
    await noteAttempt(database, scope, now);
    return { status: "not-found" };
  }
  if (code.usedAt) {
    await countCodeFailure(database, code.id, now);
    await noteAttempt(database, scope, now);
    return { status: "used" };
  }
  if (code.invalidatedAt) {
    await countCodeFailure(database, code.id, now);
    await noteAttempt(database, scope, now);
    return { status: "invalidated" };
  }
  if (code.failedAttempts >= MAX_CODE_FAILED_ATTEMPTS) {
    await noteAttempt(database, scope, now);
    return { status: "locked" };
  }
  if (isCodeExpired(code.expiresAt, now)) {
    await countCodeFailure(database, code.id, now);
    await noteAttempt(database, scope, now);
    return { status: "expired" };
  }

  /* The learner is read before anything changes. There is deliberately no query
   * after this point, so a failure can never strand a learner between a spent code
   * and a rotated key. */
  const learner = await database
    .prepare("SELECT id, nickname, course_id AS courseId FROM learner_profiles WHERE id = ?")
    .bind(code.learnerId)
    .first<{ id: string; nickname: string; courseId: string }>();
  if (!learner) {
    await noteAttempt(database, scope, now);
    return { status: "not-found" };
  }

  const device = crypto.randomUUID();
  const newAccessKey = makeAccessKey();
  const newAccessHash = await hashAccessKey(newAccessKey);

  /* One transaction. The first statement is the claim itself. Every statement
   * after it carries the winning device token, either as a condition on the row it
   * writes or as a requirement that the claimed row carries that token, so a
   * request whose claim matched no row changes nothing at all. */
  const results = await database.batch([
    database
      .prepare(`UPDATE learner_transfer_codes SET used_at = ?, used_by_device = ?
        WHERE id = ? AND used_at IS NULL AND invalidated_at IS NULL AND expires_at > ?`)
      .bind(now, device, code.id, now),
    database
      .prepare(`UPDATE learner_transfer_codes SET invalidated_at = ?
        WHERE learner_id = ? AND id <> ? AND used_at IS NULL AND invalidated_at IS NULL
        AND EXISTS (SELECT 1 FROM learner_transfer_codes AS winner WHERE winner.id = ? AND winner.used_by_device = ?)`)
      .bind(now, code.learnerId, code.id, code.id, device),
    database
      .prepare(`UPDATE learner_profiles SET access_hash = ?
        WHERE id = (SELECT learner_id FROM learner_transfer_codes WHERE id = ? AND used_by_device = ?)`)
      .bind(newAccessHash, code.id, device),
    database
      .prepare("UPDATE learner_transfer_codes SET applied_at = ? WHERE id = ? AND used_by_device = ?")
      .bind(now, code.id, device),
    database
      .prepare(`DELETE FROM transfer_claim_limits WHERE scope = ?
        AND EXISTS (SELECT 1 FROM learner_transfer_codes WHERE id = ? AND used_by_device = ?)`)
      .bind(scope, code.id, device),
  ]);

  const claimed = changedRows(results?.[0]);
  const rotated = changedRows(results?.[2]);
  if (claimed !== 1 || rotated !== 1) return { status: "raced" };

  return { status: "transferred", learnerId: learner.id, courseId: learner.courseId, nickname: learner.nickname, newAccessKey };
}