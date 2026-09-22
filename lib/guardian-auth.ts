import { getDatabase } from "@/lib/server-database";
import {
  GUARDIAN_SIGN_IN_PATH,
  readGuardianIdentity,
  type GuardianIdentity,
} from "@/lib/guardian-identity";

/*
 * Server-only guardian authentication.
 *
 * Every guardian route calls establishGuardian first. It returns null when the
 * platform has not signed the visitor in, which is the only way a route reaches
 * its 401 answer, so no route can be written that forgets to check.
 *
 * The identity is always read from the platform request headers. It is never
 * read from a body, a query string or a cookie.
 */

export type GuardianAccount = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string;
};

/* Creates the guardian the first time they arrive, and records the sign-in on
 * every later visit. A missing name header never erases a stored name. */
export async function establishGuardian(
  request: Request,
  now = new Date().toISOString(),
): Promise<{ account: GuardianAccount; identity: GuardianIdentity } | null> {
  const identity = readGuardianIdentity(request);
  if (!identity) return null;

  const database = getDatabase();
  await database
    .prepare(`INSERT INTO guardian_accounts
      (id, platform_user_id, email, display_name, created_at, last_sign_in_at, failed_claim_attempts, last_claim_attempt_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, NULL)
      ON CONFLICT (platform_user_id) DO UPDATE SET
        email = excluded.email,
        display_name = COALESCE(excluded.display_name, guardian_accounts.display_name),
        last_sign_in_at = excluded.last_sign_in_at`)
    .bind(
      crypto.randomUUID(),
      identity.platformUserId,
      identity.email,
      identity.displayName,
      now,
      now,
    )
    .run();

  const row = await database
    .prepare(`SELECT id, email, display_name AS displayName, created_at AS createdAt, last_sign_in_at AS lastSignInAt
      FROM guardian_accounts WHERE platform_user_id = ?`)
    .bind(identity.platformUserId)
    .first<GuardianAccount>();
  if (!row) return null;
  return { account: row, identity };
}

/* A guardian endpoint answers 401 for anyone the platform has not signed in, and
 * names the platform path so the interface can offer a real way back in. */
export function guardianUnauthorized(): Response {
  return Response.json(
    { error: "Sign in with ChatGPT to use a grown-up account.", signInPath: GUARDIAN_SIGN_IN_PATH },
    { status: 401 },
  );
}
