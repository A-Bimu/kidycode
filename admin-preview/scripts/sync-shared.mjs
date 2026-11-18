/*
 * Vendor the owner-console source the Vercel review target reuses.
 *
 * The Cloudflare/Vinext application and this Vercel review target are two builds of the same
 * repository. The console itself — AdminConsole, LessonContent, the review key, the pure admin
 * modules and the admin stylesheet — is written once, at the repository root, and must not be
 * copied by hand.
 *
 * This script walks the import graph from a small set of entry points and returns exactly that
 * closure, preserving each file's repository-relative path.
 *
 * Two modes:
 *
 *   node scripts/sync-shared.mjs           write the closure into src/shared/
 *   node scripts/sync-shared.mjs --check   compare src/shared/ against the closure, write nothing
 *
 * `src/shared/` is committed because the Vercel deployment is uploaded as this directory on its
 * own: at build time the repository root is not present, so the copies must already be there.
 * `--check` is what stops them from drifting — it runs in `npm run check` and in CI, and fails
 * the build if any vendored file differs from its root source, if one is missing, or if one is
 * left behind. It is also how the committed copies get refreshed: run the write mode, commit.
 *
 * Both modes fail if the closure ever reaches a Cloudflare-only module: that would mean the
 * review target is about to import `cloudflare:workers`, the exact incompatibility this app
 * exists to avoid.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const previewRoot = resolve(scriptDir, "..");
const repoRoot = resolve(previewRoot, "..");
const sharedRoot = join(previewRoot, "src", "shared");
const checkOnly = process.argv.includes("--check");

/* Entry points, as repository-relative paths. These are the modules the Vercel target either
 * renders or calls directly; everything else is pulled in through the import graph. */
const ENTRY_POINTS = [
  "components/admin/AdminConsole.tsx",
  "components/admin/LessonContent.tsx",
  "components/admin/reviewKey.ts",
  "components/admin/types.ts",
  "app/admin/admin.css",
  "lib/admin-curriculum.ts",
  "lib/admin-quality.ts",
  "lib/admin-review.ts",
  "lib/admin-analytics.ts",
  "lib/admin-notifications.ts",
  "lib/admin-security.ts",
  "lib/identity-trust.ts",
  "lib/guardian-identity.ts",
];

/* Modules that only exist inside the Cloudflare runtime. Reaching one of these would make the
 * Vercel build fail the same way `next build` fails at the repository root, so it is a hard
 * error here rather than a surprise 20 minutes into a deployment. */
const FORBIDDEN = ["cloudflare:workers", "@/lib/admin-runtime", "@/lib/server-database", "@/lib/institution-identity"];

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".css", ".json", "/index.ts", "/index.tsx"];

function resolveRepoFile(repoRel) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${repoRel}${suffix}`;
    const absolute = join(repoRoot, candidate);
    if (existsSync(absolute) && statSync(absolute).isFile()) return candidate;
  }
  return null;
}

function specifiersOf(source) {
  const found = new Set();
  for (const match of source.matchAll(/from\s*["']([^"']+)["']/g)) found.add(match[1]);
  for (const match of source.matchAll(/import\s*\(?\s*["']([^"']+)["']/g)) found.add(match[1]);
  return found;
}

/* A specifier is either server-local (relative), repository-rooted (`@/…`) or an external
 * package. Only the first two are followed; the third is reported so the preview manifest can
 * be checked against them. */
function resolveSpecifier(specifier, importerRepoRel) {
  if (specifier.startsWith("@/")) return resolveRepoFile(specifier.slice(2));
  if (specifier.startsWith(".")) {
    const base = join(dirname(importerRepoRel), specifier);
    return resolveRepoFile(relative(repoRoot, resolve(repoRoot, base)));
  }
  return null;
}

function buildClosure() {
  const visited = new Set();
  const externals = new Set();
  const queue = [...ENTRY_POINTS];
  const files = new Map();

  while (queue.length > 0) {
    const repoRel = queue.shift();
    if (visited.has(repoRel)) continue;
    visited.add(repoRel);

    for (const offending of FORBIDDEN) {
      if (repoRel === offending || repoRel.endsWith(offending)) {
        throw new Error(`sync-shared: the admin closure reached ${repoRel}, which only exists in the Cloudflare runtime.`);
      }
    }

    const source = readFileSync(join(repoRoot, repoRel), "utf8");
    if (source.includes("cloudflare:workers")) {
      throw new Error(`sync-shared: ${repoRel} imports cloudflare:workers and cannot run on Vercel.`);
    }
    files.set(repoRel, source);

    if (repoRel.endsWith(".css") || repoRel.endsWith(".json")) continue;

    for (const specifier of specifiersOf(source)) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) {
        const packageName = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0];
        externals.add(packageName);
        continue;
      }
      const resolved = resolveSpecifier(specifier, repoRel);
      if (!resolved) {
        throw new Error(`sync-shared: ${repoRel} imports "${specifier}" and no file could be resolved for it.`);
      }
      if (!visited.has(resolved)) queue.push(resolved);
    }
  }

  return { files, externals };
}

function listShared(directory, found = []) {
  if (!existsSync(directory)) return found;
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) listShared(full, found);
    else found.push(full);
  }
  return found;
}

function main() {
  /* The deployment uploads this directory alone, so the repository root may legitimately be
   * absent on the build machine. The committed copies are then the source of truth. */
  if (!existsSync(join(repoRoot, "components", "admin", "AdminConsole.tsx"))) {
    if (!existsSync(join(sharedRoot, "components", "admin", "AdminConsole.tsx"))) {
      throw new Error("sync-shared: neither the repository sources nor the vendored copies are present.");
    }
    console.log("sync-shared: repository root is not part of this upload; using the committed src/shared copies.");
    return;
  }

  const { files, externals } = buildClosure();

  if (checkOnly) {
    const problems = [];
    for (const [repoRel, source] of files) {
      const vendored = join(sharedRoot, repoRel);
      if (!existsSync(vendored)) problems.push(`missing ${repoRel}`);
      else if (readFileSync(vendored, "utf8") !== source) problems.push(`differs ${repoRel}`);
    }
    const committed = new Set(listShared(sharedRoot).map(file => relative(sharedRoot, file).split("\\").join("/")));
    for (const path of committed) {
      if (!files.has(path)) problems.push(`should not be vendored ${path}`);
    }
    if (problems.length > 0) {
      throw new Error(`sync-shared: src/shared is out of date. Run \`npm run sync\` and commit the result.\n  ${problems.join("\n  ")}`);
    }
    console.log(`sync-shared: ${files.size} vendored files match the repository sources (external: ${[...externals].sort().join(", ") || "none"}).`);
    return;
  }

  rmSync(sharedRoot, { recursive: true, force: true });
  for (const [repoRel, source] of files) {
    const destination = join(sharedRoot, repoRel);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, source);
  }
  console.log(`sync-shared: vendored ${files.size} files into src/shared (external: ${[...externals].sort().join(", ") || "none"})`);
}

main();