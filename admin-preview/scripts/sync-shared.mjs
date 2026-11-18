/*
 * Vendor the owner-console source the Vercel review target reuses.
 *
 * The Cloudflare/Vinext application and this Vercel review target are two separate builds of
 * the same repository. The console itself — AdminConsole, LessonContent, the review key, the
 * pure admin modules and the admin stylesheet — is written once, at the repository root, and
 * must not be copied by hand.
 *
 * So this script walks the import graph from a small set of entry points and writes exactly
 * that closure into `src/shared/`, preserving each file's repository-relative path. Nothing
 * is committed: `src/shared/` is generated on every build, so the root files stay the single
 * source of truth and the copies can never drift.
 *
 * It also fails the build if the closure ever reaches a Cloudflare-only module: that would
 * mean the review target is about to import `cloudflare:workers`, which is the exact
 * incompatibility this app exists to avoid.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const previewRoot = resolve(scriptDir, "..");
const repoRoot = resolve(previewRoot, "..");
const sharedRoot = join(previewRoot, "src", "shared");

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

function isExternal(specifier) {
  return !specifier.startsWith("@/") && !specifier.startsWith(".");
}

function main() {
  rmSync(sharedRoot, { recursive: true, force: true });

  const visited = new Set();
  const externals = new Set();
  const queue = [...ENTRY_POINTS];
  const copied = [];

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

    const destination = join(sharedRoot, repoRel);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, source);
    copied.push(repoRel);

    if (repoRel.endsWith(".css") || repoRel.endsWith(".json")) continue;

    for (const specifier of specifiersOf(source)) {
      if (isExternal(specifier)) {
        externals.add(specifier.split("/")[0].startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]);
        continue;
      }
      const resolved = resolveSpecifier(specifier, repoRel);
      if (!resolved) {
        throw new Error(`sync-shared: ${repoRel} imports "${specifier}" and no file could be resolved for it.`);
      }
      if (!visited.has(resolved)) queue.push(resolved);
    }
  }

  console.log(`sync-shared: vendored ${copied.length} files into src/shared`);
  for (const file of copied.sort()) console.log(`  ${file}`);
  console.log(`sync-shared: external packages required: ${[...externals].sort().join(", ") || "(none)"}`);
}

main();
