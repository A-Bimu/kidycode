/*
 * The P4 institutional security journey, against a real local server and the real local D1
 * store.
 *
 * Everything here is a request a browser or a hostile caller could actually make. The suite
 * proves, in order:
 *
 *   1. A cohort-scoped grown-up reaches only the cohorts a persisted assignment grants. The
 *      first organisation has two cohorts, so the check is about a cohort inside the same
 *      school, not only about another organisation.
 *   2. An assignment written by an organisation-scoped role changes what that grown-up can
 *      reach on the very next request, and revoking it takes the cohort away again.
 *   3. A cohort lead cannot widen its own scope by assigning itself, and a member or cohort
 *      from another organisation is not found rather than silently accepted.
 *   4. A learner's saved work is idempotent: saving the same lesson twice leaves one row and
 *      the second save is reported as saved.
 *   5. A transfer code works once. The replay is refused, and the device that held the old
 *      key stops working, which is what "moved to another device" has to mean.
 *   6. A request that can set the forwarded identity header is believed in the
 *      platform-header mode. That is the documented residual risk of the current
 *      deployment, recorded here as evidence rather than described in prose.
 *
 * Local fixtures only, created by this script: no real child data, no production database.
 *
 *   KIDYCODE_E2E_URL=http://localhost:3011 node --import tsx --no-warnings scripts/e2e-institution-security.mjs
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { courses } from "../lib/course-catalog.ts";

const root = resolve(import.meta.dirname, "..");
const base = (process.env.KIDYCODE_E2E_URL || "http://localhost:3001").replace(/\/$/, "");

function locateDatabase() {
  if (process.env.KIDYCODE_D1_PATH) return process.env.KIDYCODE_D1_PATH;
  const directory = resolve(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!existsSync(directory)) throw new Error(`No local D1 store at ${directory}`);
  const file = readdirSync(directory)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => resolve(directory, name))
    .sort()
    .pop();
  if (!file) throw new Error("No D1 database file was found.");
  return file;
}

const passed = [];
const failures = [];
function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}
async function step(name, body) {
  try {
    await body();
    check(name);
  } catch (error) {
    failures.push(`${name}: ${String(error.message).split("\n").slice(0, 3).join(" | ")}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

const probe = await fetch(`${base}/api/progress`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
if (!probe) throw new Error(`No KidyCode server answered on ${base}. Start it before running this suite.`);
if (probe.status !== 401) throw new Error(`${base}/api/progress answered ${probe.status} to an anonymous request, so this is not the KidyCode app.`);

const database = new DatabaseSync(locateDatabase());
console.log(`Institution security journey against ${base}`);

/* ------------------------------------------------------------------ helpers -- */

let cookie = "";

async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session && !session.includes("Max-Age=0")) cookie = session.split(";")[0];
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, text };
}

function identity(id, email) {
  return { "oai-authenticated-user-id": id, "oai-authenticated-user-email": email };
}

const people = {
  admin: identity("p-admin", "admin@school.test"),
  lead: identity("p-lead", "lead@school.test"),
  reviewer: identity("p-review", "review@school.test"),
  instructor: identity("p-instructor", "teach@school.test"),
  outsider: identity("p-outsider", "out@elsewhere.test"),
};

async function workspaceFor(who, query = "") {
  cookie = "";
  const response = await fetch(`${base}/api/institution/workspace${query}`, {
    headers: people[who],
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function enrolAs(who, cohortId, learnerId, wanted = "active", organisationId = "org-home") {
  cookie = "";
  const response = await fetch(`${base}/api/institution/enrolment`, {
    method: "POST",
    headers: { "content-type": "application/json", ...people[who] },
    body: JSON.stringify({ organisationId, cohortId, learnerId, wanted }),
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function assignAs(who, memberId, cohortId, wanted = "active", organisationId = "org-home") {
  cookie = "";
  const response = await fetch(`${base}/api/institution/assignments`, {
    method: "POST",
    headers: { "content-type": "application/json", ...people[who] },
    body: JSON.stringify({ organisationId, cohortId, memberId, wanted }),
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

function cohortIdsOf(workspace) {
  return (workspace.cohorts || []).map((cohort) => cohort.cohortId).sort();
}

/* ------------------------------------------------------------------- the run -- */

await step("the pilot institution is seeded locally before the boundary checks", async () => {
  const output = execFileSync(process.execPath, ["--no-warnings", resolve(root, "scripts/seed-local-pilot.mjs")], { encoding: "utf8" });
  assert.match(output, /member_cohort_assignments: 3/, `the seed did not write the assignments: ${output.slice(-300)}`);
  assert.match(output, /cohorts: 3/, `the seed did not write three cohorts: ${output.slice(-300)}`);
});

await step("an identity that is not signed in is refused", async () => {
  const anonymous = await fetch(`${base}/api/institution/workspace`, { signal: AbortSignal.timeout(30000) });
  assert.equal(anonymous.status, 401, `an anonymous workspace request answered ${anonymous.status}`);
  const fake = await fetch(`${base}/api/institution/workspace`, {
    headers: { "oai-authenticated-user-id": "p-nobody", "oai-authenticated-user-email": "nobody@school.test" },
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(fake.status, 403, `an unknown identity answered ${fake.status} instead of a refusal`);
});

await step("a lead sees only the cohort it is assigned to, inside its own organisation", async () => {
  const lead = await workspaceFor("lead");
  assert.equal(lead.status, 200, `the lead answered ${lead.status}`);
  assert.deepEqual(cohortIdsOf(lead.body.workspace), ["cohort-a"], `the lead reached cohorts ${JSON.stringify(cohortIdsOf(lead.body.workspace))}`);
  const text = JSON.stringify(lead.body.workspace);
  assert.ok(!text.includes("Fern"), "the lead read a learner from the second cohort of the same school");
  assert.ok(!text.includes("cohort-b"), "the lead reached the second cohort of the same school");
});

await step("a lead cannot enrol into a second cohort of its own organisation", async () => {
  const refused = await enrolAs("lead", "cohort-b", "seed-learner-3");
  assert.equal(refused.status, 403, `a lead enrolled into an unassigned cohort (${refused.status})`);
  const rows = database.prepare("SELECT COUNT(*) AS n FROM cohort_enrolments WHERE cohort_id = 'cohort-b' AND learner_id = 'seed-learner-3'").get();
  assert.equal(rows.n, 0, "a refused enrolment was written anyway");
});

await step("a lead can still enrol inside its own cohort", async () => {
  const allowed = await enrolAs("lead", "cohort-a", "seed-learner-3");
  assert.equal(allowed.status, 200, `a lead was refused its own cohort (${allowed.status})`);
  assert.equal(allowed.body.plan.action, "insert", "a new learner link was not planned as an insert");
  const rows = database.prepare("SELECT COUNT(*) AS n FROM cohort_enrolments WHERE cohort_id = 'cohort-a' AND learner_id = 'seed-learner-3'").get();
  assert.equal(rows.n, 1, "the allowed enrolment left no row");
});

await step("an instructor assigned to the other cohort cannot reach this one", async () => {
  const instructor = await workspaceFor("instructor");
  assert.equal(instructor.status, 200, `the instructor answered ${instructor.status}`);
  assert.deepEqual(cohortIdsOf(instructor.body.workspace), ["cohort-b"], `the instructor reached ${JSON.stringify(cohortIdsOf(instructor.body.workspace))}`);
  const text = JSON.stringify(instructor.body.workspace);
  assert.ok(!text.includes("Sky"), "the instructor read a learner from the cohort it is not assigned to");
  const refusedEnrol = await enrolAs("instructor", "cohort-a", "seed-learner-2");
  assert.equal(refusedEnrol.status, 403, `an instructor enrolled outside its cohort (${refusedEnrol.status})`);
  const refusedAssign = await assignAs("instructor", "m-instructor", "cohort-a");
  assert.equal(refusedAssign.status, 403, `an instructor assigned itself another cohort (${refusedAssign.status})`);
});

await step("an organisation-scoped role keeps the organisation's cohorts and no other organisation's", async () => {
  const admin = await workspaceFor("admin");
  assert.equal(admin.status, 200, `the administrator answered ${admin.status}`);
  assert.equal(admin.body.workspace.audience, "organisation", "the administrator was scoped below the organisation");
  assert.deepEqual(cohortIdsOf(admin.body.workspace), ["cohort-a", "cohort-b"], `the administrator saw ${JSON.stringify(cohortIdsOf(admin.body.workspace))}`);
  const outsider = await workspaceFor("outsider");
  assert.equal(outsider.status, 200, `the second organisation answered ${outsider.status}`);
  assert.equal(outsider.body.workspace.organisation.id, "org-other", "the outsider reached the first organisation");
  const outsiderText = JSON.stringify(outsider.body.workspace);
  for (const forbidden of ["cohort-a", "cohort-b", "Sky", "Fern"]) {
    assert.ok(!outsiderText.includes(forbidden), `the outsider reached ${forbidden}`);
  }
});

await step("a cohort lead cannot widen its own scope with an assignment", async () => {
  const refused = await assignAs("lead", "m-lead", "cohort-b");
  assert.equal(refused.status, 403, `a lead assigned itself another cohort (${refused.status})`);
  const row = database.prepare("SELECT COUNT(*) AS n FROM member_cohort_assignments WHERE member_id = 'm-lead' AND cohort_id = 'cohort-b'").get();
  assert.equal(row.n, 0, "the refused self-assignment was written anyway");
  const after = await workspaceFor("lead");
  assert.deepEqual(cohortIdsOf(after.body.workspace), ["cohort-a"], "the lead's scope changed after a refused self-assignment");
});

await step("an administrator's assignment takes effect immediately, and a revoke takes it away", async () => {
  const inserted = await assignAs("admin", "m-instructor", "cohort-a");
  assert.equal(inserted.status, 200, `the administrator's assignment answered ${inserted.status}`);
  assert.equal(inserted.body.plan.action, "insert", `the assignment was planned as ${inserted.body.plan.action}`);
  const widened = await workspaceFor("instructor");
  assert.deepEqual(cohortIdsOf(widened.body.workspace), ["cohort-a", "cohort-b"], "the assignment did not widen the instructor's readable cohorts");

  const revoked = await assignAs("admin", "m-instructor", "cohort-a", "revoked");
  assert.equal(revoked.status, 200, `the revoke answered ${revoked.status}`);
  assert.equal(revoked.body.plan.action, "revoke", `the revoke was planned as ${revoked.body.plan.action}`);
  const narrowed = await workspaceFor("instructor");
  assert.deepEqual(cohortIdsOf(narrowed.body.workspace), ["cohort-b"], "the revoke did not take the cohort away");
  const kept = database.prepare("SELECT status FROM member_cohort_assignments WHERE member_id = 'm-instructor' AND cohort_id = 'cohort-a'").get();
  assert.equal(kept?.status, "revoked", "the revoked assignment row was deleted instead of kept");
});

await step("a member or cohort from another organisation is not found, not silently accepted", async () => {
  const crossMember = await assignAs("admin", "m-outsider", "cohort-a");
  assert.equal(crossMember.status, 404, `assigning another organisation's member answered ${crossMember.status}`);
  const crossCohort = await assignAs("admin", "m-lead", "cohort-x");
  assert.equal(crossCohort.status, 404, `assigning another organisation's cohort answered ${crossCohort.status}`);
  const crossEnrol = await enrolAs("lead", "cohort-a", "seed-learner-9", "active", "org-other");
  assert.equal(crossEnrol.status, 403, `a cross-organisation enrolment answered ${crossEnrol.status}`);
});

await step("a learner's saved lesson is idempotent when the same save is repeated", async () => {
  cookie = "";
  const created = await fetch(`${base}/api/learners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname: "SecSave", age: 12, theme: "interest", courseId: "ages-10-12" }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(created.status, 201, `learner creation answered ${created.status}`);
  const session = (created.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
  assert.ok(session, "learner creation returned no session");
  cookie = session.split(";")[0];
  const learner = await created.json();
  const lesson = courses["ages-10-12"].lessons[0];
  const payload = { lessonId: lesson.id, status: "started", questionAnswer: -1, quizAnswers: [], reflection: "First save.", workspace: { html: "<h1>Hello</h1>", css: "", javascript: "" } };

  const first = await api("/api/progress", { method: "POST", body: JSON.stringify(payload) });
  assert.equal(first.status, 200, `the first save answered ${first.status}`);
  const second = await api("/api/progress", { method: "POST", body: JSON.stringify(payload) });
  assert.equal(second.status, 200, `the repeated save answered ${second.status}`);
  assert.equal(second.body.saved, true, "the repeated save was not reported as saved");

  const rows = database.prepare("SELECT COUNT(*) AS n FROM course_progress WHERE learner_id = ? AND lesson_id = ?").get(learner.learner.id, lesson.id);
  assert.equal(rows.n, 1, `the repeated save left ${rows.n} rows`);
  const stored = database.prepare("SELECT reflection FROM course_progress WHERE learner_id = ? AND lesson_id = ?").get(learner.learner.id, lesson.id);
  assert.equal(stored.reflection, "First save.", "the repeated save did not keep the learner's reflection");
});

await step("a transfer code works once and the old device stops working", async () => {
  const generated = await api("/api/transfer/codes", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(generated.status, 201, `generating a transfer code answered ${generated.status}`);
  const code = generated.body.transfer?.code;
  assert.ok(code, "no transfer code was returned");

  const oldCookie = cookie;
  cookie = "";
  const claimed = await api("/api/transfer/claim", { method: "POST", body: JSON.stringify({ code }) });
  assert.equal(claimed.status, 200, `the first claim answered ${claimed.status}`);
  assert.equal(claimed.body.transferred, true, "the first claim did not report a transfer");
  assert.ok(cookie, "the first claim returned no new session");

  const replay = await api("/api/transfer/claim", { method: "POST", body: JSON.stringify({ code }) });
  assert.equal(replay.status, 410, `the replay answered ${replay.status} instead of a refusal`);

  cookie = oldCookie;
  const oldDevice = await api("/api/progress");
  assert.equal(oldDevice.status, 401, `the old device still read progress (${oldDevice.status})`);
  cookie = "";
});

await step("a caller that can set the forwarded header is believed in the platform-header mode", async () => {
  /* This is evidence, not an endorsement. With no proxy secret configured the app has no way
   * to tell the platform's header from one a caller wrote, so the current deployment relies
   * on the edge stripping client-supplied copies. The signed mode is what closes it, and
   * validate-institution-security.mjs proves that mode refuses exactly this request. */
  const impostor = await fetch(`${base}/api/institution/workspace`, { headers: people.lead, signal: AbortSignal.timeout(30000) });
  assert.equal(impostor.status, 200, `the forwarded-header mode answered ${impostor.status}`);
  const body = await impostor.json();
  assert.equal(body.workspace.role, "cohort_lead", "the forwarded-header request did not act as the lead, so the residual risk is different from the documented one");
});

console.log("");
if (failures.length) {
  console.log(`${passed.length} passed, ${failures.length} failed`);
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`${passed.length} checks passed, 0 failed`);
}
