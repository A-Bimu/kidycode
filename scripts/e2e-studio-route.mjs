import assert from "node:assert/strict";

const base = process.env.KIDYCODE_E2E_URL || "http://127.0.0.1:3003";
for (const path of ["/studio", "/design", "/practice"]) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(12000) });
  assert.equal(response.status, 200, path + " must render successfully");
  const content = await response.text();
  assert(content.length > 300, path + " must return meaningful HTML");
}
for (const asset of ["spark", "planet", "flower", "books", "rocket", "cloud", "music", "heart"]) {
  const response = await fetch(base + "/studio-assets/" + asset + ".svg", { signal: AbortSignal.timeout(12000) });
  assert.equal(response.status, 200, asset + " must be bundled locally");
  const source = await response.text();
  assert(source.includes("<svg") && source.includes("<title"), asset + " must be a labelled original SVG");
  assert(!/https?:\/\//.test(source.replace(/xmlns="[^"]+"/g, "")), asset + " must not depend on remote image services");
}
console.log("Practice Studio routes and four original bundled assets served successfully.");
