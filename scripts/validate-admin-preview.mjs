/*
 * Guard the isolated Vercel review target from the repository root's own check task.
 *
 * `admin-preview/` is a second build of this repository: a Vercel-hosted, access-controlled
 * owner review target that must not weaken or diverge from the Cloudflare application. This
 * validator (which needs no dependency install, so it is cheap enough to run on every
 * `npm run check`) asserts the four properties that keep the two builds honest:
 *
 *   1. The preview reuses the repository's console and stylesheet verbatim, rather than
 *      keeping a fork of them that can drift.
 *   2. The import closure the preview vendors never reaches the Cloudflare runtime.
 *   3. No admin route in the review target contains a write.
 *   4. The review target's owner gate is the repository's own gate, not a second
 *      implementation, and it stays closed without configuration.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const previewRoot = join(root, "admin-preview");

assert(existsSync(previewRoot), "admin-preview/ is missing: the Vercel review target must exist.");

function collect(directory, extensions, found = []) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) collect(full, extensions, found);
    else if (extensions.some(extension => entry.endsWith(extension))) found.push(full);
  }
  return found;
}

/* 1. The vendoring step must run and must be reproducible. Running it here both proves the
 *    closure resolves and refreshes the copies this check is about to compare. */
const sync = spawnSync(process.execPath, [join(previewRoot, "scripts", "sync-shared.mjs")], { encoding: "utf8" });
assert.equal(sync.status, 0, `sync-shared.mjs failed:\n${sync.stderr || sync.stdout}`);

const sharedRoot = join(previewRoot, "src", "shared");
assert(existsSync(sharedRoot), "sync-shared.mjs did not produce src/shared.");

/* 2. The console, the lesson renderer and the admin stylesheet are the repository's own
 *    files, byte for byte. */
const mustMatch = [
  ["components/admin/AdminConsole.tsx", "components/admin/AdminConsole.tsx"],
  ["components/admin/LessonContent.tsx", "components/admin/LessonContent.tsx"],
  ["components/admin/reviewKey.ts", "components/admin/reviewKey.ts"],
  ["app/admin/admin.css", "app/admin/admin.css"],
];
for (const [vendored, original] of mustMatch) {
  assert.equal(
    readFileSync(join(sharedRoot, vendored), "utf8"),
    readFileSync(join(root, original), "utf8"),
    `${vendored} in admin-preview is not the repository's ${original}.`,
  );
}

/* 3. The whole vendored closure is Node-safe. A single Cloudflare import here would
 *    reproduce the exact build failure this target exists to avoid. */
const vendored = collect(sharedRoot, [".ts", ".tsx", ".css", ".json"]);
assert.ok(vendored.length >= 20, `expected the full console closure, saw ${vendored.length} files`);
for (const file of vendored) {
  const source = readFileSync(file, "utf8");
  assert(!source.includes("cloudflare:workers"), `${file} imports cloudflare:workers.`);
  assert(!/from\s+["']@\/lib\/(admin-runtime|server-database|institution-identity)["']/.test(source), `${file} imports a Cloudflare-only module.`);
}

/* 4. The review target writes nothing and owns no second gate implementation. */
const routes = collect(join(previewRoot, "src", "app", "api"), [".ts"]);
assert.equal(routes.length, 5, `expected the five admin route handlers, saw ${routes.length}`);
for (const file of routes) {
  const source = readFileSync(file, "utf8");
  assert(!/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(source), `${file} contains a write statement.`);
  assert(!/\.run\s*\(/.test(source), `${file} contains a D1 .run() call.`);
}

const runtime = readFileSync(join(previewRoot, "src", "lib", "preview-runtime.ts"), "utf8");
assert(
  /from "@\/lib\/admin-security"/.test(runtime),
  "admin-preview must reuse lib/admin-security.ts for the owner gate rather than reimplementing it.",
);
assert(
  !/REVIEW_KEY_MINIMUM|ownerIds|hmac|constant.tim/i.test(runtime),
  "admin-preview must not carry its own copy of the gate rules.",
);

/* 5. The middleware-level and application-level gates are both declared. */
const config = readFileSync(join(previewRoot, "next.config.ts"), "utf8");
assert(/X-Robots-Tag/.test(config), "admin-preview must send a noindex header.");
assert(/X-Frame-Options/.test(config), "admin-preview must refuse framing.");

console.log("admin-preview: review target is intact, Node-safe, read-only and reuses the owner gate.");
