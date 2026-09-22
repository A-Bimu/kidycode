import {
  MAX_CLAIM_ATTEMPTS_PER_WINDOW,
  MAX_CODE_FAILED_ATTEMPTS,
  CLAIM_WINDOW_MINUTES,
  codeExpiryFrom,
  generateConnectCode,
  groupConnectCode,
  hashConnectCode,
  isCodeExpired,
} from "@/lib/guardian-codes";

/*
 * Connection codes, guardian links and the reads each side is allowed.
 *
 * Every write here is scoped to an identified learner or an identified guardian.
 * A learner identifier is never accepted from a guardian request.
 */

export type ConnectCodeRow = {
  id: string;
  learnerId: string;
  expiresAt: string;
  usedAt: string | null;
  invalidatedAt: string | null;
  failedAttempts: number;
};

export type GuardianLinkRow = {
  linkRef: string;
  learnerId: string;
  status: string;
  connectedAt: string;
  learnerName: string;
  courseId: string;
};

export type LearnerConnectionRow = {
  linkRef: string;
  guardianName: string;
  guardianEmail: string;
  connectedAt: string;
};

export type ClaimOutcome =
  | { status: "linked"; linkRef: string; learnerId: string; learnerName: string }
  | { status: "not-found" | "used" | "invalidated" | "expired" | "locked" | "raced" | "rate-limited" };

/* A new code invalidates any unused code this learner already has, so only the
 * newest code can ever be claimed. */
export async function createConnectCode(
  database: D1Database,
  learnerId: string,
  now: string,
): Promise<{ code: string; expiresAt: string }> {
  await database
    .prepare(`UPDATE guardian_connect_codes SET invalidated_at = ?
      WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL`)
    .bind(now, learnerId)
    .run();

  const code = generateConnectCode();
  const digest = await hashConnectCode(code);
  const expiresAt = codeExpiryFrom(now);
  await database
    .prepare(`INSERT INTO guardian_connect_codes
      (id, learner_id, code_digest, created_at, expires_at, used_at, used_by_guardian_id, invalidated_at, failed_attempts)
      VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 0)`)
    .bind(crypto.randomUUID(), learnerId, digest, now, expiresAt)
    .run();
  return { code: groupConnectCode(code), expiresAt };
}

export async function pendingConnectCode(
  database: D1Database,
  learnerId: string,
  now: string,
): Promise<{ expiresAt: string } | null> {
  const row = await database
    .prepare(`SELECT expires_at AS expiresAt FROM guardian_connect_codes
      WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL
      ORDER BY created_at DESC LIMIT 1`)
    .bind(learnerId)
    .first<{ expiresAt: string }>();
  if (!row) return null;
  return isCodeExpired(row.expiresAt, now) ? null : { expiresAt: row.expiresAt };
}

async function findCodeByDigest(database: D1Database, digest: string): Promise<ConnectCodeRow | null> {
  return await database
    .prepare(`SELECT id, learner_id AS learnerId, expires_at AS expiresAt, used_at AS usedAt,
      invalidated_at AS invalidatedAt, failed_attempts AS failedAttempts
      FROM guardian_connect_codes WHERE code_digest = ?`)
    .bind(digest)
    .first<ConnectCodeRow>() || null;
}

/* A failure is counted against the code when the digest matched, and against the
 * guardian in every case, so neither a single code nor a single guardian can be
 * used to guess codes without limit. */
async function countFailure(database: D1Database, guardianId: string, codeId: string | null, now: string): Promise<void> {
  if (codeId) {
    await database
      .prepare(`UPDATE guardian_connect_codes SET
        failed_attempts = MIN(failed_attempts + 1, ${MAX_CODE_FAILED_ATTEMPTS}),
        invalidated_at = CASE WHEN failed_attempts + 1 >= ${MAX_CODE_FAILED_ATTEMPTS} THEN ? ELSE invalidated_at END
        WHERE id = ?`)
      .bind(now, codeId)
      .run();
  }
  await database
    .prepare(`UPDATE guardian_accounts SET
      failed_claim_attempts = CASE
        WHEN last_claim_attempt_at IS NULL OR last_claim_attempt_at < ? THEN 1
        ELSE MIN(failed_claim_attempts + 1, 99) END,
      last_claim_attempt_at = ?
      WHERE id = ?`)
    .bind(windowStart(now), now, guardianId)
    .run();
}

export async function claimFailuresExceeded(database: D1Database, guardianId: string, now: string): Promise<boolean> {
  const row = await database
    .prepare(`SELECT failed_claim_attempts AS attempts, last_claim_attempt_at AS lastAt
      FROM guardian_accounts WHERE id = ?`)
    .bind(guardianId)
    .first<{ attempts: number; lastAt: string | null }>();
  if (!row || row.attempts < MAX_CLAIM_ATTEMPTS_PER_WINDOW) return false;
  return Boolean(row.lastAt) && row.lastAt! >= windowStart(now);
}

function windowStart(now: string): string {
  return new Date(new Date(now).getTime() - CLAIM_WINDOW_MINUTES * 60_000).toISOString();
}

async function clearClaimFailures(database: D1Database, guardianId: string): Promise<void> {
  await database
    .prepare("UPDATE guardian_accounts SET failed_claim_attempts = 0, last_claim_attempt_at = NULL WHERE id = ?")
    .bind(guardianId)
    .run();
}

/*
 * Claiming is a single conditional update. Only one request can move a code from
 * unused to used, so two guardians racing on the same code cannot both link, and
 * the unique index on the guardian and learner pair means a link can never be
 * duplicated even if a claim were somehow repeated.
 */
export async function claimConnectCode(
  database: D1Database,
  guardianId: string,
  rawCode: string,
  normalised: string,
  now: string,
): Promise<ClaimOutcome> {
  void rawCode;
  if (await claimFailuresExceeded(database, guardianId, now)) return { status: "rate-limited" };

  const digest = await hashConnectCode(normalised);
  const code = await findCodeByDigest(database, digest);
  if (!code) {
    await countFailure(database, guardianId, null, now);
    return { status: "not-found" };
  }
  if (code.usedAt) {
    await countFailure(database, guardianId, code.id, now);
    return { status: "used" };
  }
  if (code.invalidatedAt) {
    await countFailure(database, guardianId, code.id, now);
    return { status: "invalidated" };
  }
  if (code.failedAttempts >= MAX_CODE_FAILED_ATTEMPTS) {
    await countFailure(database, guardianId, code.id, now);
    return { status: "locked" };
  }
  if (isCodeExpired(code.expiresAt, now)) {
    await countFailure(database, guardianId, code.id, now);
    return { status: "expired" };
  }

  const claimed = await database
    .prepare(`UPDATE guardian_connect_codes SET used_at = ?, used_by_guardian_id = ?
      WHERE id = ? AND used_at IS NULL AND invalidated_at IS NULL AND expires_at > ?`)
    .bind(now, guardianId, code.id, now)
    .run();
  if ((claimed.meta?.changes ?? 0) !== 1) {
    return { status: "raced" };
  }

  const learner = await database
    .prepare("SELECT id, nickname FROM learner_profiles WHERE id = ?")
    .bind(code.learnerId)
    .first<{ id: string; nickname: string }>();
  if (!learner) return { status: "not-found" };

  await database
    .prepare(`INSERT INTO guardian_links (id, link_ref, guardian_id, learner_id, status, initiated_by, connected_at, revoked_at)
      VALUES (?, ?, ?, ?, 'active', 'learner', ?, NULL)
      ON CONFLICT (guardian_id, learner_id) DO UPDATE SET
        status = 'active',
        connected_at = excluded.connected_at,
        revoked_at = NULL`)
    .bind(crypto.randomUUID(), `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, ""), guardianId, code.learnerId, now)
    .run();

  const link = await database
    .prepare("SELECT link_ref AS linkRef FROM guardian_links WHERE guardian_id = ? AND learner_id = ?")
    .bind(guardianId, code.learnerId)
    .first<{ linkRef: string }>();
  await clearClaimFailures(database, guardianId);
  return { status: "linked", linkRef: link?.linkRef || "", learnerId: learner.id, learnerName: learner.nickname };
}

/* The learner's side: only their own active links, and only the guardian details
 * a child needs to recognise who is connected. */
export async function listLearnerConnections(
  database: D1Database,
  learnerId: string,
): Promise<LearnerConnectionRow[]> {
  const rows = await database
    .prepare(`SELECT link_ref AS linkRef, guardian_name AS guardianName, guardian_email AS guardianEmail, connected_at AS connectedAt
      FROM (
        SELECT l.link_ref, COALESCE(g.display_name, g.email) AS guardian_name, g.email AS guardian_email, l.connected_at, l.revoked_at
        FROM guardian_links l JOIN guardian_accounts g ON g.id = l.guardian_id
        WHERE l.learner_id = ? AND l.status = 'active'
      )
      ORDER BY connected_at DESC`)
    .bind(learnerId)
    .all<LearnerConnectionRow>();
  return rows.results;
}

/* The guardian's side: their own active links, joined through the account id, so
 * a learner identifier never reaches the guardian. */
export async function listGuardianLinks(
  database: D1Database,
  guardianId: string,
): Promise<GuardianLinkRow[]> {
  const rows = await database
    .prepare(`SELECT l.link_ref AS linkRef, l.learner_id AS learnerId, l.status, l.connected_at AS connectedAt,
      p.nickname AS learnerName, p.course_id AS courseId
      FROM guardian_links l JOIN learner_profiles p ON p.id = l.learner_id
      WHERE l.guardian_id = ? AND l.status = 'active'
      ORDER BY l.connected_at DESC`)
    .bind(guardianId)
    .all<GuardianLinkRow>();
  return rows.results;
}

/* Authorisation for every guardian read: the link must belong to this guardian,
 * must still be active, and must resolve to a learner. */
export async function resolveGuardianLink(
  database: D1Database,
  guardianId: string,
  linkRef: string,
): Promise<GuardianLinkRow | null> {
  return await database
    .prepare(`SELECT l.link_ref AS linkRef, l.learner_id AS learnerId, l.status, l.connected_at AS connectedAt,
      p.nickname AS learnerName, p.course_id AS courseId
      FROM guardian_links l JOIN learner_profiles p ON p.id = l.learner_id
      WHERE l.guardian_id = ? AND l.link_ref = ? AND l.status = 'active'`)
    .bind(guardianId, linkRef)
    .first<GuardianLinkRow>() || null;
}

export async function revokeGuardianLink(
  database: D1Database,
  guardianId: string,
  linkRef: string,
  now: string,
): Promise<boolean> {
  const result = await database
    .prepare("UPDATE guardian_links SET status = 'revoked', revoked_at = ? WHERE guardian_id = ? AND link_ref = ? AND status = 'active'")
    .bind(now, guardianId, linkRef)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

export async function revokeLearnerConnection(
  database: D1Database,
  learnerId: string,
  linkRef: string,
  now: string,
): Promise<boolean> {
  const result = await database
    .prepare("UPDATE guardian_links SET status = 'revoked', revoked_at = ? WHERE learner_id = ? AND link_ref = ? AND status = 'active'")
    .bind(now, learnerId, linkRef)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}