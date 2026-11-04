import { env } from "cloudflare:workers";
import { isSameOriginMutation, supabaseAuthEndpoint } from "@/lib/kidycode-adult-session";

const EMAIL = /^[^\\s@]+@[^\\s@.]+(\\.[^\\s@.]+)+$/;

/** Request a one-time email code for a self-attested adult guardian. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin rejected." }, { status: 403 });
  if (env.KIDYCODE_AUTH_MODE !== "supabase") return Response.json({ error: "Adult sign-in is not configured yet." }, { status: 503 });
  const emailApi = supabaseAuthEndpoint(env.SUPABASE_URL, "/auth/v1/otp");
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!emailApi || !key) return Response.json({ error: "Adult sign-in is not configured yet." }, { status: 503 });
  let data: { email?: unknown; adultConfirmation?: unknown };
  try { data = await request.json() as typeof data; } catch { return Response.json({ error: "Enter a valid email." }, { status: 400 }); }
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254 || data.adultConfirmation !== true) {
    return Response.json({ error: "Enter a valid email and confirm you are an adult." }, { status: 400 });
  }
  try {
    const response = await fetch(emailApi, {
      method: "POST",
      headers: { apikey: key, "content-type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 429) return Response.json({ error: "Please try again later." }, { status: 429 });
    if (!response.ok) return Response.json({ error: "The sign-in email could not be sent. Please try again later." }, { status: 503 });
    return Response.json({ message: "If sign-in is available for this address, check your email for the one-time code." }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Sign-in service is temporarily unavailable." }, { status: 503 });
  }
}
