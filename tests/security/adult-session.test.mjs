import assert from "node:assert/strict";
import {
  ADULT_COOKIE, LOCAL_ADULT_COOKIE, secureRequest, isSameOriginMutation,
  cookieToken, sessionCookie, clearSessionCookie, supabaseAuthEndpoint,
} from "../../lib/kidycode-adult-session.ts";

const site = "https://kidycode.example/api/guardian/links";
const post = (origin, cookie) => new Request(site, {
  method: "POST", headers: { ...(origin ? { origin } : {}), ...(cookie ? { cookie } : {}) },
});
assert.equal(isSameOriginMutation(post("https://kidycode.example")), true);
assert.equal(isSameOriginMutation(post("https://evil.example")), false);
assert.equal(isSameOriginMutation(post(null)), false);
assert.equal(secureRequest(new Request("http://evil.example")), false);
assert.equal(secureRequest(new Request("http://localhost:3000")), true);
assert.equal(supabaseAuthEndpoint("https://example.supabase.co", "/auth/v1/otp")?.href, "https://example.supabase.co/auth/v1/otp");
assert.equal(supabaseAuthEndpoint("http://example.supabase.co", "/auth/v1/otp"), null);
assert.equal(supabaseAuthEndpoint("https://example.supabase.co.evil.org", "/auth/v1/otp"), null);
assert.equal(supabaseAuthEndpoint("https://user:password@example.supabase.co", "/auth/v1/otp"), null);
assert.equal(supabaseAuthEndpoint("https://example.supabase.co/anything", "/auth/v1/otp"), null);
const token = "example.jwt_Token-42";
const cookie = sessionCookie(post("https://kidycode.example"), token, 3600);
assert(cookie.startsWith(`${ADULT_COOKIE}=${token};`));
assert(cookie.includes("HttpOnly"));
assert(cookie.includes("Secure"));
assert(cookie.includes("SameSite=Strict"));
assert.equal(cookieToken(post("https://kidycode.example", `${ADULT_COOKIE}=${token}`)), token);
assert.equal(cookieToken(post("https://kidycode.example", `${LOCAL_ADULT_COOKIE}=${token}`)), null);
assert.equal(cookieToken(post("https://kidycode.example", `${ADULT_COOKIE}=bad value`)), null);
assert.equal(cookieToken(new Request("http://evil.example", {headers:{cookie: `${ADULT_COOKIE}=${token}`}})), null);
assert.equal(cookieToken(new Request("http://localhost:3000", {headers:{cookie: `${LOCAL_ADULT_COOKIE}=${token}`}})), token);
assert(clearSessionCookie(post("https://kidycode.example")).includes("Max-Age=0"));
assert(clearSessionCookie(post("https://kidycode.example")).includes("Secure"));
console.log("Adult cookie/session origin controls passed");
