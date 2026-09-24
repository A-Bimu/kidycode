import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "dist/server/index.js",
  "dist/client/landing.html",
  "dist/client/styles.css",
  "dist/client/app.js",
  "dist/.openai/hosting.json",
];

for (const relativePath of requiredFiles) {
  assert(existsSync(resolve(root, relativePath)), `The production build is missing ${relativePath}.`);
}

/*
 * Every migration must reach the deployment artifact, or a published site would run against a
 * schema it does not have. The set is compared rather than listed, so a migration added later
 * cannot be forgotten here: that is exactly how the list fell one file behind at 0007.
 */
const sourceMigrations = readdirSync(resolve(root, "drizzle"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const packagedDirectory = resolve(root, "dist/.openai/drizzle");
assert(existsSync(packagedDirectory), "The production build is missing the packaged migrations directory.");
const packagedMigrations = readdirSync(packagedDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort();
assert.deepEqual(packagedMigrations, sourceMigrations, "The packaged migrations must be exactly the migrations in the repository, in order.");
assert.ok(sourceMigrations.length >= 8, `Expected at least eight migrations, found ${sourceMigrations.length}.`);
for (const name of packagedMigrations) {
  const source = readFileSync(resolve(root, "drizzle", name), "utf8");
  const packaged = readFileSync(resolve(packagedDirectory, name), "utf8");
  assert.equal(packaged, source, `${name} was altered on its way into the production build.`);
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
