import type { GuardianIdentity } from "@/lib/guardian-identity";

/**
 * Verify a Supabase adult access token with Supabase Auth itself.
 * Do not decode JWTs without signature verification or trust browser-provided identity headers.
 * This adapter does not provide the login UI, guardian consent or production deployment.
 */
export type SupabaseIdentityConfig = {
  url: string | null | undefined;
  publishableKey: string | null | undefined;
};

type SupabaseUserResponse = {
  id?: unknown;
  email?: unknown;
  is_anonymous?: unknown;
};

const MAX_BEARER_LENGTH = 8192;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export async function verifySupabaseAdultIdentity(
  request: Request,
  config: SupabaseIdentityConfig,
  fetcher: typeof fetch = fetch,
): Promise<GuardianIdentity | null> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match || match[1].length > MAX_BEARER_LENGTH) return null;

  const key = config.publishableKey?.trim();
  if (!key) return null;

  let origin: URL;
  try {
    origin = new URL(config.url ?? "");
  } catch {
    return null;
  }
  // Never allow the bearer token to be sent to an arbitrary or insecure host.
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/" || !origin.hostname.endsWith(".supabase.co")) {
    return null;
  }

  try {
    const response = await fetcher(new URL("/auth/v1/user", origin), {
      method: "GET",
      headers: { apikey: key, Authorization: `Bearer ${match[1]}` },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as SupabaseUserResponse;
    if (body.is_anonymous === true || typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return null;
    if (typeof body.email !== "string" || body.email.length > 254 || !EMAIL_PATTERN.test(body.email)) return null;
    return { platformUserId: body.id, email: body.email.toLowerCase(), displayName: null };
  } catch {
    return null;
  }
}
