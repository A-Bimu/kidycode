import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = ["public/landing.html", "public/young/index.html", "public/adult/index.html"];

for (const relativePath of pages) {
  const file = join(root, relativePath);
  const html = readFileSync(file, "utf8");
  assert.match(html, /^<!doctype html>/i, `${relativePath} needs a doctype.`);
  assert.match(html, /<title>[^<]+<\/title>/i, `${relativePath} needs a title.`);
  assert.match(html, /<meta\s+name="viewport"/i, `${relativePath} needs a viewport tag.`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${relativePath} contains duplicate IDs.`);

  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const reference = match[1].split("#")[0].split("?")[0];
    if (!reference || reference.startsWith("http") || reference.startsWith("mailto:") || reference.startsWith("#") || reference.endsWith("/")) continue;
    const target = reference.startsWith("/") ? join(root, "public", reference) : resolve(dirname(file), reference);
    assert(existsSync(target), `${relativePath} points to missing file ${reference}.`);
  }
}

assert(existsSync(join(root, "dist/server/index.js")), "The server build is missing.");
assert(existsSync(join(root, "dist/client/landing.html")), "The landing page build is missing.");
assert(existsSync(join(root, "dist/.openai/drizzle/0000_breezy_psylocke.sql")), "The first database migration is missing from the build.");

console.log("Validated the three marketing pages, local assets, server build and database migration.");
