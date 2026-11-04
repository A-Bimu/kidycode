import { env } from "cloudflare:workers";
import { verifySupabaseAdultIdentity } from "@/lib/supabase-identity";
import { isSameOriginMutation, sessionCookie, supabaseAuthEndpoint } from "@/lib/kidycode-adult-session";

/**
 * Exchange a one-time email code for a short-lived HttpOnly adult browser session.
 * Email confirmation does not verify legal age or parental authority; the actual
 * guardian-consent gate remains required before child data can be used.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin rejected." }, { status: 403 });
  if (env.KIDYCODE_AUTH_MODE !== "supabase") return Response.json({ error: "Adult sign-in is not configured yet." }, { status: 503 });
  const endpoint = supabaseAuthEndpoint(env.SUPABASE_URL, "/auth/v1/verify");
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!endpoint || !key) return Response.json({ error: "Adult sign-in is not configured yet." }, { status: 503 });
  let input: { email?: unknown; token?: unknown };
  try { input = await request.json() as typeof input; } catch { return Response.json({ error: "Enter the email code." }, { status: 400 }); }
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^[0-9]{6,8}$/.test(token)) {
    return Response.json({ error: "Enter a valid email and one-time code." }, { status: 400 });
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { apikey: key, "content-type": "application/json" },
      body: JSON.stringify({ email, token, type: "email" }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return Response.json({ error: "The code was invalid or expired. Request a new code." }, { status: 401 });
    const data = await response.json() as { access_token?: unknown; expires_in?: unknown };
    if (typeof data.access_token !== "string" || typeof data.expires_in !== "number" ||
        !Number.isFinite(data.expires_in) || data.expires_in < 1) return Response.json({ error: "Sign-in could not be completed." }, { status: 401 });

    const verifiedRequest = new Request(request.url, { headers: { authorization: `Bearer ${data.access_token}` } });
    const user = await verifySupabaseAdultIdentity(verifiedRequest, { url: env.SUPABASE_URL, publishableKey: key });
    if (!user || user.email !== email) return Response.json({ error: "Sign-in could not be verified." }, { status: 401 });

    return Response.json({ signedIn: true }, {
      headers: {
        "set-cookie": sessionCookie(request, data.access_token, data.expires_in),
        "cache-control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
