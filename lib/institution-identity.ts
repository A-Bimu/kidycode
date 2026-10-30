import { env } from "cloudflare:workers";
import type { GuardianIdentity } from "@/lib/guardian-identity";
import { verifySupabaseAdultIdentity } from "@/lib/supabase-identity";
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
  // Staging migration: a configured provider token must be verified by the issuer.
  // There is no automatic downgrade to raw identity headers after a failed bearer check.
  const authMode = typeof env.KIDYCODE_AUTH_MODE === "string" ? env.KIDYCODE_AUTH_MODE : "legacy";
  if (authMode === "supabase") {
    return verifySupabaseAdultIdentity(request, {
      url: typeof env.SUPABASE_URL === "string" ? env.SUPABASE_URL : null,
      publishableKey: typeof env.SUPABASE_PUBLISHABLE_KEY === "string" ? env.SUPABASE_PUBLISHABLE_KEY : null,
    });
  }
  if (authMode !== "legacy") return null;
  const { mode, secret } = identityTrustConfiguration();
  return trustForwardedIdentity(request, { mode, secret });
}
