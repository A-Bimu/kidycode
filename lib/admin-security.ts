import type { GuardianIdentity } from "@/lib/guardian-identity";
import { trustForwardedIdentity, type IdentityTrustMode } from "@/lib/identity-trust";

/*
 * Platform-wide owner access is separate from institution permissions. It NEVER
 * inherits organisation_admin privileges, a learner cookie or a guardian link.
 * Admin routes require a verified signed edge identity and an explicit ID
 * allowlist. Unsigned platform headers are insufficient even when institution
 * routes accept them in a legacy deployment.
 */
export type OwnerConfig = {
  mode: IdentityTrustMode;
  secret: string | null | undefined;
  adminIds: string | null | undefined;
};

const SAFE_ID = /^[A-Za-z0-9._:@-]{1,128}$/;

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

export async function readOwnerIdentity(request: Request, config: OwnerConfig): Promise<GuardianIdentity | null> {
  if (!ownerConfigured(config)) return null;
  // A valid signature proves the trusted gateway signed the asserted identity.
  const identity = await trustForwardedIdentity(request, { mode: "proxy-signature", secret: config.secret });
  return identity && ownerIds(config.adminIds).has(identity.platformUserId) ? identity : null;
}

export function adminNoAccess(): Response {
  return Response.json(
    { error: "Owner access is unavailable. A signed platform identity and an approved owner account are required." },
    { status: 403, headers: { "Cache-Control": "private, no-store" } },
  );
}

export const ADMIN_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;
