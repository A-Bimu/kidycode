import assert from "node:assert/strict";

const base = (process.env.KIDYCODE_E2E_URL || "http://localhost:3001").replace(/\/$/, "");
const origin = new URL(base).origin;
async function send(path, options = {}) {
  return fetch(base + path, { ...options, signal: AbortSignal.timeout(10000) });
}

const page = await send("/adult-login");
assert.equal(page.status, 200, "Adult sign-in page should load");
assert.match(await page.text(), /Sign in to follow their progress/, "Adult sign-in heading must render");

const noOrigin = await send("/api/adult-auth/start", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "pilot@example.test", adultConfirmation: true }),
});
assert.equal(noOrigin.status, 403, "No-Origin OTP attempts must fail");

const crossOrigin = await send("/api/adult-auth/logout", {
  method: "POST", headers: { Origin: "https://evil.example" },
});
assert.equal(crossOrigin.status, 403, "Cross-origin logout must fail");

const logout = await send("/api/adult-auth/logout", {
  method: "POST", headers: { Origin: origin },
});
assert.equal(logout.status, 200);
assert.match(logout.headers.get("set-cookie") || "", /HttpOnly; SameSite=Strict/);
assert.match(logout.headers.get("set-cookie") || "", /Max-Age=0/);

const disabledAuth = await send("/api/adult-auth/start", {
  method: "POST", headers: { "content-type": "application/json", Origin: origin },
  body: JSON.stringify({ email: "pilot@example.test", adultConfirmation: true }),
});
assert.equal(disabledAuth.status, 503, "Synthetic local legacy mode must not be able to send real email codes");
console.log("Adult sign-in routes: page, failed-closed provider mode, origin and logout checks passed.");
