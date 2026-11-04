import { isSameOriginMutation, clearSessionCookie } from "@/lib/kidycode-adult-session";

/** Logout clears the browser bearer session; the provider access token expires independently. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin rejected." }, { status: 403 });
  return Response.json({ signedOut: true }, {
    headers: { "set-cookie": clearSessionCookie(request), "cache-control": "no-store" },
  });
}
