/*
 * Learner access keys and the learner session cookie.
 *
 * The key is generated once, shown to nobody, and only its hash is stored, so a
 * database read cannot be turned into a working session. The cookie carries the
 * learner and the key together, which is why every response that issues one must
 * never also put the key in a JSON body.
 */

import { sha256Hex } from "@/lib/digest";

export function makeAccessKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

export async function hashAccessKey(accessKey: string): Promise<string> {
  return sha256Hex(accessKey);
}

/* Six months, HttpOnly, Secure, SameSite Lax, path wide. */
export function sessionCookie(learnerId: string, accessKey: string): string {
  return `kidycode_session=${encodeURIComponent(`${learnerId}.${accessKey}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=15552000`;
}

export const clearedSessionCookie = "kidycode_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
