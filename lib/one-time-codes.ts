/*
 * One-time codes.
 *
 * Shared by grown-up connection codes and learner transfer codes. A code is shown
 * once and only its digest is stored, so a database read can never reveal a usable
 * code. The alphabet avoids letters that are easy to confuse when a code is read
 * aloud or typed by hand.
 */

import { sha256Hex } from "@/lib/digest";

export const CODE_TTL_MINUTES = 10;
export const CODE_BYTES = 10;
export const CODE_LENGTH = 16;
export const CODE_GROUP_SIZE = 4;
export const MAX_CODE_FAILED_ATTEMPTS = 5;
export const MAX_CLAIM_ATTEMPTS_PER_WINDOW = 8;
export const CLAIM_WINDOW_MINUTES = 10;

/* Crockford base32: no I, L, O or U, so a misread character is recoverable. */
export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/* Ten random bytes carry eighty bits, which is far beyond guessing even without
 * the attempt limits below. Sixteen base32 symbols hold exactly eighty bits. */
const BITS_PER_SYMBOL = 5;

export function generateConnectCode(): string {
  const bytes = new Uint8Array(CODE_BYTES);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let value = 0;
  let code = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= BITS_PER_SYMBOL && code.length < CODE_LENGTH) {
      bits -= BITS_PER_SYMBOL;
      code += CODE_ALPHABET[(value >>> bits) & 31];
    }
  }
  return code;
}

/* Grouped for reading aloud, for example ABCD-EFGH-JKMN-PQRS. */
export function groupConnectCode(code: string): string {
  return code.match(new RegExp(`.{1,${CODE_GROUP_SIZE}}`, "g"))?.join("-") || code;
}

/* Accepts what a person actually types: lower case, spaces, missing or wrong
 * separators, and the letters that are easy to mix up. Returns null when the
 * value cannot be a code at all. */
export function normaliseConnectCode(input: string): string | null {
  if (typeof input !== "string" || input.length > 64) return null;
  const cleaned = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
  if (cleaned.length !== CODE_LENGTH) return null;
  for (const character of cleaned) {
    if (!CODE_ALPHABET.includes(character)) return null;
  }
  return cleaned;
}

/* Only the digest is ever stored. */
export async function hashConnectCode(code: string): Promise<string> {
  return sha256Hex(code);
}

export function codeExpiryFrom(now: string): string {
  return new Date(new Date(now).getTime() + CODE_TTL_MINUTES * 60_000).toISOString();
}

export function isCodeExpired(expiresAt: string, now: string): boolean {
  return new Date(expiresAt).getTime() <= new Date(now).getTime();
}