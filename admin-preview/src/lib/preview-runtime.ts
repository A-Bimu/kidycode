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
 * The Node twin of lib/admin-runtime.ts.
 *
 * The Cloudflare build reads its deployment configuration from the Workers `env` binding; the
 * Vercel build reads the same configuration from the process environment. Everything that
 * decides whether the caller is the owner — the trust mode, the signed-identity rules, the
 * allowlist and the synthetic-review switch — is reused unchanged from lib/admin-security.ts,
 * so the review deployment cannot be weaker than the Worker one. Only the source of the
 * configuration differs, and that is the whole point of this file.
 */

function environmentValue(name: string): string | null {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function ownerRuntimeConfig(): OwnerConfig {
  const secret = environmentValue("KIDYCODE_IDENTITY_SECRET");
  const configured = environmentValue("KIDYCODE_IDENTITY_TRUST");
  return {
    mode: identityTrustModeFor(configured, secret),
    secret,
    adminIds: environmentValue("KIDYCODE_ADMIN_USER_IDS"),
    reviewDemo: process.env.KIDYCODE_ADMIN_REVIEW_DEMO === "1",
    reviewKey: environmentValue("KIDYCODE_ADMIN_REVIEW_KEY"),
  };
}

export function ownerGateState() {
  return adminGateState(ownerRuntimeConfig());
}

export async function authenticateOwner(request: Request): Promise<OwnerDecision | null> {
  return resolveOwner(request, ownerRuntimeConfig());
}

export async function requireOwner(request: Request): Promise<
  { ok: true; decision: OwnerDecision; provenance: "owner" | "synthetic" } | { ok: false; response: Response }
> {
  const decision = await authenticateOwner(request);
  if (!decision) return { ok: false, response: adminNoAccess() };
  return { ok: true, decision, provenance: provenanceFor(decision) };
}

/* Whether this deployment is the synthetic review target. Used only to label responses
 * honestly; it never grants access. */
export function isReviewDeployment(): boolean {
  return process.env.KIDYCODE_ADMIN_REVIEW_DEPLOYMENT === "1";
}
