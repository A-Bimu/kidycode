import assert from "node:assert/strict";
import { verifySupabaseAdultIdentity } from "../../lib/supabase-identity.ts";

const url = "https://example.supabase.co";
const config = { url, publishableKey: "sb_publishable_example" };
const UUID = "0a0a0a0a-bbbb-4ccc-8ddd-eeeeeeeeeeee";
let calls = 0;
const accepting = async (input, options) => {
  calls++;
  assert.equal(new URL(input).href, url + "/auth/v1/user");
  assert.equal(options.method, "GET");
  assert.equal(options.headers.Authorization, "Bearer valid-token");
  return Response.json({ id: UUID, email: "Grownup@Example.com", is_anonymous: false });
};
const request = (authorization) => new Request("https://kidycode.test/api/guardian/session", {
  headers: authorization ? { Authorization: authorization, "oai-authenticated-user-id": "forged", "oai-authenticated-user-email": "forged@example.com" } : { "oai-authenticated-user-id": "forged" },
});

assert.equal(await verifySupabaseAdultIdentity(request(null), config, accepting), null);
assert.equal(calls, 0, "Raw identity headers must not produce an authenticated user");
assert.equal(await verifySupabaseAdultIdentity(request("Bearer valid-token"), { url: "http://example.supabase.co", publishableKey: "key" }, accepting), null);
assert.equal(await verifySupabaseAdultIdentity(request("Bearer valid-token"), { url: "https://evil.example", publishableKey: "key" }, accepting), null);
assert.equal(await verifySupabaseAdultIdentity(request("Bearer valid-token"), { url, publishableKey: "" }, accepting), null);
const identity = await verifySupabaseAdultIdentity(request("Bearer valid-token"), config, accepting);
assert.deepEqual(identity, { platformUserId: UUID, email: "grownup@example.com", displayName: null });
const fail = async () => Response.json({ error: "invalid token" }, { status: 401 });
assert.equal(await verifySupabaseAdultIdentity(request("Bearer invalid"), config, fail), null);
const anonymous = async () => Response.json({ id: UUID, email: "child@example.com", is_anonymous: true });
assert.equal(await verifySupabaseAdultIdentity(request("Bearer valid-token"), config, anonymous), null);
const malformed = async () => Response.json({ id: "forged-id", email: "wrong@example.com" });
assert.equal(await verifySupabaseAdultIdentity(request("Bearer valid-token"), config, malformed), null);
const networkFailure = async () => { throw new Error("unreachable"); };
assert.equal(await verifySupabaseAdultIdentity(request("Bearer valid-token"), config, networkFailure), null);
console.log("Validated server-verified adult identity adapter: forged headers and invalid tokens rejected.");
