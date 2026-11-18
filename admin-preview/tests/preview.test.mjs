/*
 * Verification for the isolated Vercel review target.
 *
 * It starts the built app the way Vercel would, then checks the two things that matter about
 * a deployment that shows owner-only content:
 *
 *   1. Nobody without the owner's credentials can read a single byte — every admin endpoint
 *      refuses, with a wrong key, a short key and no key at all.
 *   2. The owner who does hold the key gets the real curriculum (all eight pathways, every
 *      lesson, the answer keys) and an analytics screen that reports what is genuinely
 *      recorded instead of inventing figures.
 *
 * It also asserts the deployment shape directly in source: the review target must never
 * reach the Cloudflare runtime, and no admin route may contain a write.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const PORT = Number(process.env.PREVIEW_TEST_PORT || 3111);
const BASE = `http://127.0.0.1:${PORT}`;
const REVIEW_KEY = "preview-test-key-0001";
const REVIEW_HEADER = "x-kidycode-review-demo";

function collectFiles(directory, extensions, found = []) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) collectFiles(full, extensions, found);
    else if (extensions.some(extension => entry.endsWith(extension))) found.push(full);
  }
  return found;
}

async function waitForServer(deadlineMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < deadlineMs) {
    try {
      const response = await fetch(`${BASE}/api/admin/session`);
      if (response.status === 200 || response.status === 403) return;
    } catch {
      /* Not listening yet. */
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 500));
  }
  throw new Error("The review target did not start within 60 seconds.");
}

async function main() {
  /* ---- Source-level guarantees, checked before the server is even started ---- */

  const sharedRoot = join(appRoot, "src", "shared");
  const vendored = collectFiles(sharedRoot, [".ts", ".tsx", ".css"]);
  assert(vendored.length > 0, "src/shared is empty: run the vendoring step before the test.");
  for (const file of vendored) {
    const source = readFileSync(file, "utf8");
    assert(!source.includes("cloudflare:workers"), `${file} must not import cloudflare:workers.`);
  }

  const routeFiles = collectFiles(join(appRoot, "src", "app", "api"), [".ts"]);
  assert(routeFiles.length >= 5, "Expected the five admin route handlers.");
  for (const file of routeFiles) {
    const source = readFileSync(file, "utf8");
    assert(!/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(source), `${file} contains a write statement.`);
    assert(!/\.run\s*\(/.test(source), `${file} contains a D1 .run() call.`);
  }

  const lessonRoute = readFileSync(join(appRoot, "src", "app", "api", "admin", "lesson", "route.ts"), "utf8");
  assert(!/getDatabase\s*\(|server-database|D1Database/.test(lessonRoute), "The lesson route must have no database access at all.");

  /* The console must remain the repository's own console, not a copy that can drift. */
  const consoleSource = readFileSync(join(sharedRoot, "components", "admin", "AdminConsole.tsx"), "utf8");
  const consoleOriginal = readFileSync(join(repoRoot, "components", "admin", "AdminConsole.tsx"), "utf8");
  assert.equal(consoleSource, consoleOriginal, "admin-preview is not serving the repository's AdminConsole.");
  const cssVendored = readFileSync(join(sharedRoot, "app", "admin", "admin.css"), "utf8");
  const cssOriginal = readFileSync(join(repoRoot, "app", "admin", "admin.css"), "utf8");
  assert.equal(cssVendored, cssOriginal, "admin-preview is not serving the repository's admin stylesheet.");

  /* ---- Live behaviour ---- */

  /* Start Next's own binary rather than through npm: npm would add a wrapper process that
   * outlives `kill()` and lingers in CI. */
  const nextBin = join(appRoot, "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start"], {
    cwd: appRoot,
    stdio: "ignore",
    env: {
      ...process.env,
      PORT: String(PORT),
      KIDYCODE_ADMIN_REVIEW_DEMO: "1",
      KIDYCODE_ADMIN_REVIEW_KEY: REVIEW_KEY,
      KIDYCODE_ADMIN_REVIEW_DEPLOYMENT: "1",
    },
  });

  const failures = [];
  const check = async (name, run) => {
    try {
      await run();
      console.log(`  ok   ${name}`);
    } catch (error) {
      failures.push(name);
      console.log(`  FAIL ${name}: ${error.message}`);
    }
  };

  try {
    await waitForServer();

    await check("unauthenticated admin reads are refused", async () => {
      for (const path of ["session", "curriculum", "lesson", "analytics", "notifications"]) {
        const response = await fetch(`${BASE}/api/admin/${path}`);
        if (path === "session") {
          assert.equal(response.status, 200, "session may answer, but only with gate state");
          const body = await response.json();
          assert.equal(body.authenticated, false, "session must report an unauthenticated caller as unauthenticated");
          assert.equal(body.owner, null, "session must not name an owner to a stranger");
        } else {
          assert.equal(response.status, 403, `/api/admin/${path} responded ${response.status} without credentials`);
        }
      }
    });

    await check("unauthenticated notification drafting is refused", async () => {
      const response = await fetch(`${BASE}/api/admin/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template: notificationTemplate, audience: "guardian" }),
      });
      assert.equal(response.status, 403, "POST /api/admin/notifications answered without credentials");
    });

    await check("a wrong or short review key is refused", async () => {
      for (const key of ["wrong-key-wrong-key", "short"]) {
        const response = await fetch(`${BASE}/api/admin/curriculum`, { headers: { [REVIEW_HEADER]: key } });
        assert.equal(response.status, 403, `the review key "${key}" opened the console`);
      }
    });

    await check("the owner key opens a synthetic review session", async () => {
      const response = await fetch(`${BASE}/api/admin/session`, { headers: { [REVIEW_HEADER]: REVIEW_KEY } });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.authenticated, true);
      assert.equal(body.permission, "synthetic-review");
      assert.equal(body.readOnly, true);
      assert.equal(body.gate.synthetic, true);
    });

    await check("all eight pathways and every lesson are present", async () => {
      const response = await fetch(`${BASE}/api/admin/curriculum`, { headers: { [REVIEW_HEADER]: REVIEW_KEY } });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.provenance, "synthetic");
      assert.equal(body.readOnly, true);
      assert.equal(body.totals.pathways, 8, `expected 8 pathways, saw ${body.totals.pathways}`);
      for (const id of ["ages-10-12", "ages-13-15", "ages-16-18", "adults", "design:ages-10-12", "design:ages-13-15", "design:ages-16-18", "design:adults"]) {
        assert(body.pathways.some(pathway => pathway.id === id), `pathway ${id} is missing`);
      }
      assert(body.totals.lessons >= 200, `expected the full lesson index, saw ${body.totals.lessons}`);
      assert(body.totals.withQuestions > 0, "no lesson exposes an answer key");
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    });

    await check("a lesson opens with its notes and answer key, and writes nothing", async () => {
      const index = await (await fetch(`${BASE}/api/admin/curriculum`, { headers: { [REVIEW_HEADER]: REVIEW_KEY } })).json();
      const key = index.lessons[0].key;
      const response = await fetch(`${BASE}/api/admin/lesson?key=${encodeURIComponent(key)}`, { headers: { [REVIEW_HEADER]: REVIEW_KEY } });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert(body.lesson.title, "the lesson has no title");
      assert(Array.isArray(body.lesson.questions) && body.lesson.questions.length > 0, "the lesson exposes no answer key");
      assert.equal(typeof body.lesson.questions[0].correctIndex, "number");
      assert(body.location.totalInPathway > 0, "the lesson has no position in its pathway");
      assert.equal(body.readOnly, true);
    });

    await check("analytics reports what is recorded, and nothing more", async () => {
      const response = await fetch(`${BASE}/api/admin/analytics`, { headers: { [REVIEW_HEADER]: REVIEW_KEY } });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.databaseConnected, false);
      assert(body.report.metrics.length > 0);
      for (const metric of body.report.metrics) {
        assert.equal(metric.provenance, "unavailable", `${metric.id} claims a recorded value in a deployment with no database`);
        assert.equal(metric.value, null, `${metric.id} carries a fabricated value`);
      }
      const notTrackedIds = body.report.notTracked.map(entry => entry.id);
      for (const id of ["verified-sign-ins", "dau-wau", "retention-cohorts", "interaction-hotspots"]) {
        assert(notTrackedIds.includes(id), `${id} is not reported as not tracked`);
      }
    });

    await check("notification drafting stays a dry run", async () => {
      const catalogue = await (await fetch(`${BASE}/api/admin/notifications`, { headers: { [REVIEW_HEADER]: REVIEW_KEY } })).json();
      assert.equal(catalogue.liveDeliveryEnabled, false);
      const planned = await (await fetch(`${BASE}/api/admin/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json", [REVIEW_HEADER]: REVIEW_KEY },
        body: JSON.stringify({ template: notificationTemplate, audience: "guardian", recipientRef: "synthetic" }),
      })).json();
      assert.equal(planned.plan.liveDeliveryEnabled, false, "the review target must never enable live delivery");
      assert.equal(planned.plan.deliverable, false, "the review target must never report a message as deliverable");
    });

    await check("the console shell is served closed and noindex", async () => {
      for (const path of ["/", "/admin"]) {
        const response = await fetch(`${BASE}${path}`);
        assert.equal(response.status, 200, `${path} did not render`);
        assert.match(response.headers.get("x-robots-tag") || "", /noindex/i, `${path} is indexable`);
      }
    });
  } finally {
    server.kill();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} preview check(s) failed.`);
    process.exit(1);
  }
  console.log("\nadmin-preview: all checks passed.");
}

/* The first template in the catalogue, read from source rather than duplicated here. */
const notificationTemplate = (() => {
  const source = readFileSync(join(appRoot, "src", "shared", "lib", "admin-notifications.ts"), "utf8");
  const match = source.match(/export const notificationTemplates = \[\s*"([^"]+)"/);
  return match ? match[1] : "unfinished-lesson";
})();

main().catch(error => {
  console.error(error);
  process.exit(1);
});
