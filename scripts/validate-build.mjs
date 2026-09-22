import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "dist/server/index.js",
  "dist/client/landing.html",
  "dist/client/styles.css",
  "dist/client/app.js",
  "dist/.openai/hosting.json",
  "dist/.openai/drizzle/0000_breezy_psylocke.sql",
  "dist/.openai/drizzle/0001_regular_shotgun.sql",
  "dist/.openai/drizzle/0002_good_master_mold.sql",
  /* Every migration must reach the deployment artifact, or a published site
   * would run against a schema it does not have. */
  "dist/.openai/drizzle/0003_closed_winter_soldier.sql",
  "dist/.openai/drizzle/0004_light_solo.sql",
  "dist/.openai/drizzle/0005_slimy_xorn.sql",
];

for (const relativePath of requiredFiles) {
  assert(existsSync(resolve(root, relativePath)), `The production build is missing ${relativePath}.`);
}

const sourceHosting = readFileSync(resolve(root, ".openai/hosting.json"), "utf8");
const builtHosting = readFileSync(resolve(root, "dist/.openai/hosting.json"), "utf8");
assert.equal(builtHosting, sourceHosting, "The production build contains the wrong Sites configuration.");

const worker = readFileSync(resolve(root, "dist/server/index.js"), "utf8");
assert(worker.length > 1_000, "The production Worker bundle is unexpectedly small.");

const landing = readFileSync(resolve(root, "dist/client/landing.html"), "utf8");
assert(landing.includes("KidyCode"), "The production landing page is missing KidyCode content.");
assert(!landing.includes("—"), "The production landing page contains an em dash.");

console.log("Validated the Worker bundle, marketing assets, Sites metadata and all database migrations.");
