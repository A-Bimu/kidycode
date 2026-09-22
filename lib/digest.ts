/*
 * One SHA-256 helper for the whole project.
 *
 * Access keys, one-time code digests and attempt scopes all need the same
 * hexadecimal digest, so there is a single implementation rather than one per
 * feature.
 */

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
