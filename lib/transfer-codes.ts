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
 * Moving a profile to another device has to rotate the learner's access key, and
 * that rotation must happen exactly once and only for the request that actually
 * won the code. Everything below is arranged around that single fact:
 *
 *   1. The claim is a conditional update, so only one caller can move a code from
 *      unused to used.
 *   2. The rotation, the invalidation of other codes and the applied mark run in
 *      one transaction (a D1 batch), each gated on the device token that won the
 *      claim. A caller that lost the race cannot rotate anything, because no row
 *      carries its token.
 *
 * If the process were to stop between the claim and the rotation, the code is
 * spent and the access key is unchanged. That is the safe direction: nobody gains
 * access and the learner simply creates another code.
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

async function clearAttempts(database: D1Database, scope: string): Promise<void> {
  await database.prepare("DELETE FROM transfer_claim_limits WHERE scope = ?").bind(scope).run();
}

/* A new code cancels any unused code this learner already had, so only the newest
 * code can ever be claimed. `createdBy` records whether the learner made it or a
 * linked grown-up made it on their behalf. */
export async function createTransferCode(
  database: D1Database,
  learnerId: string,
  createdBy: "learner" | "guardian",
  now: string,
): Promise<{ code: string; expiresAt: string }> {
  await database
    .prepare(`UPDATE learner_transfer_codes SET invalidated_at = ?
      WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL`)
    .bind(now, learnerId)
    .run();

  const code = generateConnectCode();
  const digest = await hashConnectCode(code);
  const expiresAt = new Date(new Date(now).getTime() + TRANSFER_TTL_MINUTES * 60_000).toISOString();
  await database
    .prepare(`INSERT INTO learner_transfer_codes
      (id, learner_id, code_digest, created_by, created_at, expires_at, used_at, used_by_device, applied_at, invalidated_at, failed_attempts)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 0)`)
    .bind(crypto.randomUUID(), learnerId, digest, createdBy, now, expiresAt)
    .run();
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

  const device = crypto.randomUUID();
  const newAccessKey = makeAccessKey();
  const newAccessHash = await hashAccessKey(newAccessKey);

  /* One transaction: win the code, spend every other unused code, and rotate the
   * access key. The rotation only matches when this device token won the claim,
   * so a loser in a race cannot reach it. */
  const results = await database.batch([
    database
      .prepare(`UPDATE learner_transfer_codes SET used_at = ?, used_by_device = ?
        WHERE id = ? AND used_at IS NULL AND invalidated_at IS NULL AND expires_at > ?`)
      .bind(now, device, code.id, now),
    database
      .prepare(`UPDATE learner_transfer_codes SET invalidated_at = ?
        WHERE learner_id = ? AND id <> ? AND used_at IS NULL AND invalidated_at IS NULL`)
      .bind(now, code.learnerId, code.id),
    database
      .prepare(`UPDATE learner_profiles SET access_hash = ?
        WHERE id = (SELECT learner_id FROM learner_transfer_codes WHERE id = ? AND used_by_device = ?)`)
      .bind(newAccessHash, code.id, device),
    database
      .prepare("UPDATE learner_transfer_codes SET applied_at = ? WHERE id = ? AND used_by_device = ?")
      .bind(now, code.id, device),
  ]);

  const claimed = changedRows(results?.[0]);
  const rotated = changedRows(results?.[2]);
  if (claimed !== 1) return { status: "raced" };
  if (rotated !== 1) return { status: "raced" };

  const learner = await database
    .prepare("SELECT id, nickname, course_id AS courseId FROM learner_profiles WHERE id = ?")
    .bind(code.learnerId)
    .first<{ id: string; nickname: string; courseId: string }>();
  if (!learner) return { status: "not-found" };

  await clearAttempts(database, scope);
  return { status: "transferred", learnerId: learner.id, courseId: learner.courseId, nickname: learner.nickname, newAccessKey };
}
