import { env } from "cloudflare:workers";
import type { GuardianIdentity } from "@/lib/guardian-identity";
import { identityTrustModeFor, trustForwardedIdentity, type IdentityTrustMode } from "@/lib/identity-trust";

/*
 * The one place an institution route asks who is calling.
 *
 * The rule lives in lib/identity-trust.ts and stays free of the runtime; this module only
 * reads the deployment configuration and passes it on. A route therefore never reads an
 * identity header itself, so the trust mode cannot be skipped in one route and applied in
 * another.
 */

export function identityTrustConfiguration(): { mode: IdentityTrustMode; secret: string | null } {
  const secret = typeof env.KIDYCODE_IDENTITY_SECRET === "string" ? env.KIDYCODE_IDENTITY_SECRET : null;
  const configured = typeof env.KIDYCODE_IDENTITY_TRUST === "string" ? env.KIDYCODE_IDENTITY_TRUST : null;
  return { mode: identityTrustModeFor(configured, secret), secret };
}

export async function readInstitutionIdentity(request: Request): Promise<GuardianIdentity | null> {
  const { mode, secret } = identityTrustConfiguration();
  return trustForwardedIdentity(request, { mode, secret });
}
