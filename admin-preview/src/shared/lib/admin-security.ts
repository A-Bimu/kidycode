import type { GuardianIdentity } from "@/lib/guardian-identity";
import { trustForwardedIdentity, type IdentityTrustMode } from "@/lib/identity-trust";

/*
 * Platform-wide owner access is separate from institution permissions. It NEVER
 * inherits organisation_admin privileges, a learner cookie or a guardian link.
 * Admin routes require a verified signed edge identity and an explicit ID
 * allowlist. Unsigned platform headers are insufficient even when institution
 * routes accept them in a legacy deployment.
 *
 * Two ways in, and only two:
 *
 *   signed owner          mode is proxy-signature, a secret of at least 32 characters
 *                         is configured, an allowlist is configured, and the request
 *                         carries a valid HMAC signature over the forwarded identity
 *                         whose platform user id is on that allowlist.
 *   synthetic review      the deployment explicitly set KIDYCODE_ADMIN_REVIEW_DEMO=1
 *                         AND has no signing secret configured. This exists only so the
 *                         owner can open the console for a local or review demonstration
 *                         while no signing edge and no owner account exist yet. It is
 *                         refused the moment a real secret is present, the caller must
 *                         still send the review header, and every response is labelled
 *                         synthetic so it can never be mistaken for real owner access.
 *
 * There is no fallback to platform-headers, no learner cookie path, no query
 * parameter, no development override that weakens the signed path.
 */
export type OwnerConfig = {
  mode: IdentityTrustMode;
  secret: string | null | undefined;
  adminIds: string | null | undefined;
  reviewDemo?: boolean;
  reviewKey?: string | null;
};

export type OwnerDecision = {
  identity: GuardianIdentity;
  permission: "owner" | "synthetic-review";
};

const SAFE_ID = /^[A-Za-z0-9._:@-]{1,128}$/;

/* The header a review session presents. Its value is the deployment's own review key, which
 * is never in the source and never rendered into a page, so knowing the route is not enough
 * to open a demonstration console. */
export const REVIEW_DEMO_HEADER = "x-kidycode-review-demo";
export const REVIEW_KEY_MINIMUM = 16;

export function ownerIds(value: string | null | undefined): Set<string> {
  if (!value || value.length > 4096) return new Set();
  const ids = value.split(",").map(id => id.trim()).filter(Boolean);
  if (ids.length === 0 || ids.length > 20 || ids.some(id => !SAFE_ID.test(id))) return new Set();
  return new Set(ids);
}

export function ownerConfigured(config: OwnerConfig): boolean {
  return config.mode === "proxy-signature" &&
    typeof config.secret === "string" && config.secret.trim().length >= 32 &&
    ownerIds(config.adminIds).size > 0;
}

/* Two independent switches, and a signing secret always wins. Once the owner configures a
 * real signature, synthetic review can never be reached, so the demonstration path cannot
 * outlive the real one. */
export function reviewDemoEnabled(config: OwnerConfig): boolean {
  if (ownerConfigured(config)) return false;
  if (config.reviewDemo !== true) return false;
  return typeof config.reviewKey === "string" && config.reviewKey.trim().length >= REVIEW_KEY_MINIMUM;
}

export async function readOwnerIdentity(request: Request, config: OwnerConfig): Promise<GuardianIdentity | null> {
  if (!ownerConfigured(config)) return null;
  // A valid signature proves the trusted gateway signed the asserted identity.
  const identity = await trustForwardedIdentity(request, { mode: "proxy-signature", secret: config.secret });
  return identity && ownerIds(config.adminIds).has(identity.platformUserId) ? identity : null;
}

export async function resolveOwner(request: Request, config: OwnerConfig): Promise<OwnerDecision | null> {
  const identity = await readOwnerIdentity(request, config);
  if (identity) return { identity, permission: "owner" };
  if (!reviewDemoEnabled(config)) return null;
  const presented = request.headers.get(REVIEW_DEMO_HEADER)?.trim() || "";
  const expected = (config.reviewKey || "").trim();
  if (presented.length === 0 || presented.length !== expected.length) return null;
  /* Compared without an early exit, so the key cannot be learned a character at a time. */
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= presented.charCodeAt(index) ^ expected.charCodeAt(index);
  if (difference !== 0) return null;
  return {
    identity: {
      platformUserId: "synthetic-review-owner",
      email: "synthetic-review@kidycode.invalid",
      displayName: "Synthetic review session",
    },
    permission: "synthetic-review",
  };
}

/* Every admin payload carries where it came from, so no screen can quietly present
 * synthetic demonstration data as if it were a real owner session. */
export function provenanceFor(decision: OwnerDecision): "owner" | "synthetic" {
  return decision.permission === "owner" ? "owner" : "synthetic";
}

export function adminNoAccess(): Response {
  return Response.json(
    { error: "Owner access is unavailable. A signed platform identity and an approved owner account are required." },
    { status: 403, headers: { "Cache-Control": "private, no-store" } },
  );
}

/* A refusal that reveals only whether the gate is configured at all, never which
 * condition failed, so a caller cannot probe the allowlist. */
export function adminGateState(config: OwnerConfig): { configured: boolean; synthetic: boolean } {
  return { configured: ownerConfigured(config), synthetic: reviewDemoEnabled(config) };
}

export const ADMIN_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;
