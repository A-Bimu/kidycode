import { readGuardianIdentity, type GuardianIdentity } from "@/lib/guardian-identity";

/*
 * Whether the platform identity headers may be trusted, and what has to be true first.
 *
 * The institution routes read a grown-up's identity from the headers the platform edge
 * forwards. That contract is only safe if the edge is the only writer of those headers. A
 * request that reaches the app directly can set `oai-authenticated-user-id` to anything,
 * and a local dev server, a staging origin or a misconfigured proxy will accept it. This
 * module makes the assumption explicit and gives a deployment a way to prove it.
 *
 * Three modes, and the strictest one that is configured wins:
 *
 *   proxy-signature  The edge signs the identity it forwards:
 *                    `x-kidycode-identity-signature` is the lowercase hex HMAC-SHA-256 of
 *                    `user-id \n email \n issued-at` under a shared secret, and
 *                    `x-kidycode-identity-issued-at` is an ISO date within the allowed skew.
 *                    A header that carries no valid signature is refused, so a caller
 *                    cannot invent an identity even if it reaches the app directly.
 *   platform-headers The forwarded headers are trusted as forwarded. This is the behaviour
 *                    of the current deployment, and it is only as strong as the edge's
 *                    stripping of client-supplied copies of those headers.
 *   deny             No identity is accepted at all. Useful to fail a deployment closed.
 *
 * The default is `platform-headers` when nothing is configured, so an existing deployment
 * keeps behaving exactly as it does today, and `proxy-signature` the moment a secret is
 * configured. The security report records which mode a deployment is actually in; the
 * module cannot verify the edge on its own, so this is a control a human has to switch on,
 * not a claim that the edge is safe.
 */

export const IDENTITY_SIGNATURE_HEADER = "x-kidycode-identity-signature";
export const IDENTITY_ISSUED_HEADER = "x-kidycode-identity-issued-at";
export const IDENTITY_SIGNATURE_ALGORITHM = "hmac-sha256";
export const IDENTITY_MAX_SKEW_SECONDS = 300;

export const identityTrustModes = ["platform-headers", "proxy-signature", "deny"] as const;
export type IdentityTrustMode = (typeof identityTrustModes)[number];

export type IdentityTrustOptions = {
  mode: IdentityTrustMode;
  secret?: string | null;
  now?: Date;
};

export function isIdentityTrustMode(value: string): value is IdentityTrustMode {
  return (identityTrustModes as readonly string[]).includes(value);
}

/*
 * The mode a deployment is in. A named mode always wins so a deployment can be pinned; a
 * configured secret then implies the signature mode; and with neither, the forwarded
 * headers are trusted, which is the current contract and is named rather than left
 * implicit.
 */
export function identityTrustModeFor(configured: string | null | undefined, secret: string | null | undefined): IdentityTrustMode {
  if (configured) {
    const named = configured.trim().toLowerCase();
    if (isIdentityTrustMode(named)) return named;
    /* An unknown value is a configuration mistake. Fail closed rather than fall back to a
     * weaker mode that silently accepts unsigned headers. */
    return "deny";
  }
  if (secret && secret.trim().length >= 32) return "proxy-signature";
  return "platform-headers";
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

/* The exact string that is signed. It is built here and nowhere else, so the signer and the
 * verifier cannot drift. Every part is length-delimited by a newline the identity itself
 * cannot contain: the id pattern excludes whitespace and the email is validated. */
export function identityAssertionPayload(identity: GuardianIdentity, issuedAt: string): string {
  return `${identity.platformUserId}\n${identity.email}\n${issuedAt.trim()}`;
}

export async function signIdentityAssertion(identity: GuardianIdentity, issuedAt: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(identityAssertionPayload(identity, issuedAt)));
  return hex(signature);
}

/* Compared without an early exit, so a caller cannot learn the right prefix byte by byte. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

export async function verifyIdentityAssertion(
  identity: GuardianIdentity,
  signature: string | null,
  issuedAt: string | null,
  secret: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!signature || !issuedAt) return false;
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued)) return false;
  const skew = Math.abs(now.getTime() - issued) / 1000;
  if (skew > IDENTITY_MAX_SKEW_SECONDS) return false;
  const expected = await signIdentityAssertion(identity, issuedAt, secret);
  return constantTimeEquals(expected, signature.trim().toLowerCase());
}

/*
 * The identity a request may act as, or null. Nothing is read from the body, the query or
 * a cookie: the forwarded headers are the only source, and in the signature mode they are
 * not believed until the edge's signature on them has been checked.
 */
export async function trustForwardedIdentity(request: Request, options: IdentityTrustOptions): Promise<GuardianIdentity | null> {
  if (options.mode === "deny") return null;
  const identity = readGuardianIdentity(request);
  if (!identity) return null;
  if (options.mode === "platform-headers") return identity;
  const secret = options.secret?.trim();
  if (!secret) return null;
  const verified = await verifyIdentityAssertion(
    identity,
    request.headers.get(IDENTITY_SIGNATURE_HEADER),
    request.headers.get(IDENTITY_ISSUED_HEADER),
    secret,
    options.now ?? new Date(),
  );
  return verified ? identity : null;
}
