import { env } from "cloudflare:workers";
import { identityTrustModeFor } from "@/lib/identity-trust";
import {
  adminGateState,
  adminNoAccess,
  provenanceFor,
  resolveOwner,
  type OwnerConfig,
  type OwnerDecision,
} from "@/lib/admin-security";

/*
 * The one place an admin route asks whether the caller is the owner.
 *
 * The rules live in lib/admin-security.ts and stay free of the runtime; this module only
 * reads the deployment configuration and passes it on, exactly like
 * lib/institution-identity.ts does for the institution routes. A route therefore never
 * reads an identity header itself, so the trust mode cannot be skipped in one admin route
 * and applied in another.
 */

export function ownerRuntimeConfig(): OwnerConfig {
  const secret = typeof env.KIDYCODE_IDENTITY_SECRET === "string" ? env.KIDYCODE_IDENTITY_SECRET : null;
  const mode = typeof env.KIDYCODE_IDENTITY_TRUST === "string" ? env.KIDYCODE_IDENTITY_TRUST : null;
  const adminIds = typeof env.KIDYCODE_ADMIN_USER_IDS === "string" ? env.KIDYCODE_ADMIN_USER_IDS : null;
  const reviewDemo = env.KIDYCODE_ADMIN_REVIEW_DEMO === "1";
  const reviewKey = typeof env.KIDYCODE_ADMIN_REVIEW_KEY === "string" ? env.KIDYCODE_ADMIN_REVIEW_KEY : null;
  return { mode: identityTrustModeFor(mode, secret), secret, adminIds, reviewDemo, reviewKey };
}

export function ownerGateState() {
  return adminGateState(ownerRuntimeConfig());
}

export async function authenticateOwner(request: Request): Promise<OwnerDecision | null> {
  return resolveOwner(request, ownerRuntimeConfig());
}

/* Route guard. Returns either the owner decision plus the provenance label to stamp on
 * the payload, or the fail-closed response to return unchanged. */
export async function requireOwner(request: Request): Promise<
  { ok: true; decision: OwnerDecision; provenance: "owner" | "synthetic" } | { ok: false; response: Response }
> {
  const decision = await authenticateOwner(request);
  if (!decision) return { ok: false, response: adminNoAccess() };
  return { ok: true, decision, provenance: provenanceFor(decision) };
}
