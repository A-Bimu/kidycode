import { env } from "cloudflare:workers";
import { identityTrustModeFor } from "@/lib/identity-trust";
import { readOwnerIdentity, type OwnerConfig } from "@/lib/admin-security";

function ownerRuntimeConfig(): OwnerConfig {
  const secret = typeof env.KIDYCODE_IDENTITY_SECRET === "string" ? env.KIDYCODE_IDENTITY_SECRET : null;
  const mode = typeof env.KIDYCODE_IDENTITY_TRUST === "string" ? env.KIDYCODE_IDENTITY_TRUST : null;
  const adminIds = typeof env.KIDYCODE_ADMIN_USER_IDS === "string" ? env.KIDYCODE_ADMIN_USER_IDS : null;
  return { mode: identityTrustModeFor(mode, secret), secret, adminIds };
}

export async function authenticateOwner(request: Request) {
  return readOwnerIdentity(request, ownerRuntimeConfig());
}
