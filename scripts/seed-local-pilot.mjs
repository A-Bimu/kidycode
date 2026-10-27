/*
 * Seed the local development store with one pilot institution.
 *
 * Local only. It writes to the D1 file that vite/miniflare keeps under
 * .wrangler/state, which is gitignored, is never the deployed database, and holds no real
 * learner. It exists so the institution pilot workspace can be exercised end to end
 * against real tables instead of being proved only by a pure function.
 *
 * What it does, in order:
 *   1. Applies the drizzle journal, every migration in order, if the institution tables
 *      are not in the local store yet.
 *   2. Replaces the pilot rows: two organisations, five members across four roles plus
 *      one outsider in the second organisation, three cohorts (two in the first
 *      organisation, so a within-organisation boundary can be tested), four learners, the
 *      persisted cohort assignments and one academic review. No learner code and no child
 *      data is written.
 *
 * Then, with the local dev server on http://localhost:3001:
 *
 *   curl -s -H "oai-authenticated-user-id: p-lead" \
 *           -H "oai-authenticated-user-email: lead@school.test" \
 *           http://localhost:3001/api/institution/workspace
 *
 * Usage: node --no-warnings scripts/seed-local-pilot.mjs
 */
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const d1Dir = resolve(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
/* Newer Miniflare keeps its own bookkeeping in metadata.sqlite and the application
 * database in the hash-named file beside it. Picking the first .sqlite therefore
 * migrated metadata.sqlite, reported success, and left the running server with no
 * application tables at all. The application file is chosen explicitly. */
const candidates = readdirSync(d1Dir).filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite").sort();
const file = candidates.pop();
if (!file) throw new Error(`No local D1 file under ${d1Dir}. Run the dev server once first.`);
const db = new DatabaseSync(resolve(d1Dir, file));
console.log("local D1:", file);

const tableExists = (name) =>
  Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name));

if (!tableExists("organisations")) {
  const journal = JSON.parse(readFileSync(resolve(root, "drizzle/meta/_journal.json"), "utf8"));
  const files = readdirSync(resolve(root, "drizzle")).filter((name) => name.endsWith(".sql")).sort();
  for (const tag of journal.entries.map((entry) => entry.tag)) {
    const sqlFile = files.find((name) => name.startsWith(tag));
    const sql = readFileSync(resolve(root, "drizzle", sqlFile), "utf8");
    let applied = 0;
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      db.exec(trimmed);
      applied += 1;
    }
    console.log(`  applied ${tag} (${applied} statements)`);
  }
} else {
  console.log("  institution tables already present; skipping the journal");
}

/* A local store created before the assignment migration exists without
 * member_cohort_assignments. Applying that one migration keeps a long-lived dev database in
 * step without replaying the whole journal over tables that already exist. */
if (tableExists("organisations") && !tableExists("member_cohort_assignments")) {
  const sql = readFileSync(resolve(root, "drizzle/0009_member_cohort_assignments.sql"), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed) db.exec(trimmed);
  }
  console.log("  applied 0009_member_cohort_assignments");
}

for (const table of ["academic_reviews", "member_cohort_assignments", "cohort_enrolments", "cohorts", "organisation_members", "organisations"]) {
  if (tableExists(table)) db.exec(`DELETE FROM ${table}`);
}
db.exec("DELETE FROM learner_profiles WHERE id LIKE 'seed-%'");

const now = "2026-10-24T09:00:00.000Z";
const insert = (sql, ...values) => db.prepare(sql).run(...values);

for (const [id, slug, name, kind] of [
  ["org-home", "pilot-school", "Pilot School", "school"],
  ["org-other", "elsewhere-college", "Elsewhere College", "college"],
]) {
  insert(
    "INSERT INTO organisations (id, slug, name, kind, status, created_at) VALUES (?,?,?,?,?,?)",
    id, slug, name, kind, "active", now,
  );
}

for (const [id, org, platformUserId, email, displayName, role] of [
  ["m-admin", "org-home", "p-admin", "admin@school.test", "Admin", "organisation_admin"],
  ["m-lead", "org-home", "p-lead", "lead@school.test", "Lead", "cohort_lead"],
  ["m-review", "org-home", "p-review", "review@school.test", "Reviewer", "academic_reviewer"],
  ["m-instructor", "org-home", "p-instructor", "teach@school.test", "Teacher", "instructor"],
  ["m-outsider", "org-other", "p-outsider", "out@elsewhere.test", "Outsider", "organisation_admin"],
]) {
  insert(
    "INSERT INTO organisation_members (id, organisation_id, platform_user_id, email, display_name, role, status, created_at, last_seen_at) VALUES (?,?,?,?,?,?,?,?,?)",
    id, org, platformUserId, email, displayName, role, "active", now, now,
  );
}

for (const [id, org, code, name, courseId] of [
  ["cohort-a", "org-home", "A1", "Year 7 A", "ages-10-12"],
  /* A second cohort in the first organisation is what makes a within-organisation negative
   * test possible: a lead assigned to cohort-a must not reach cohort-b even though both
   * belong to the same school. */
  ["cohort-b", "org-home", "B1", "Year 7 B", "ages-13-15"],
  ["cohort-x", "org-other", "X1", "Elsewhere", "adults"],
]) {
  insert(
    "INSERT INTO cohorts (id, organisation_id, code, name, course_id, status, created_at) VALUES (?,?,?,?,?,?,?)",
    id, org, code, name, courseId, "active", now,
  );
}

for (const [id, nickname, courseId] of [
  ["seed-learner-1", "Sky", "ages-10-12"],
  ["seed-learner-2", "River", "ages-10-12"],
  ["seed-learner-3", "Wren", "ages-10-12"],
  ["seed-learner-4", "Fern", "ages-13-15"],
  ["seed-learner-9", "Ace", "adults"],
]) {
  insert(
    "INSERT INTO learner_profiles (id, access_hash, nickname, age, theme, course_id, created_at, last_seen_at) VALUES (?,?,?,?,?,?,?,?)",
    id, `hash-${id}`, nickname, 12, "interest", courseId, now, now,
  );
}

for (const [id, cohortId, learnerId, status] of [
  ["e-1", "cohort-a", "seed-learner-1", "active"],
  ["e-2", "cohort-a", "seed-learner-2", "revoked"],
  ["e-4", "cohort-b", "seed-learner-4", "active"],
  ["e-9", "cohort-x", "seed-learner-9", "active"],
]) {
  insert(
    "INSERT INTO cohort_enrolments (id, cohort_id, learner_id, status, enrolled_by, enrolled_at, revoked_at) VALUES (?,?,?,?,?,?,?)",
    id, cohortId, learnerId, status, "organisation", now, status === "revoked" ? now : null,
  );
}

/* The persisted assignments. A lead works only in cohort-a, an instructor only in cohort-b,
 * and the reviewer only in cohort-a. The administrator needs no row because it is answered
 * at the organisation scope. These rows are what make a within-organisation negative test
 * possible: the lead must not reach cohort-b. */
for (const [id, memberId, cohortId] of [
  ["a-lead-a", "m-lead", "cohort-a"],
  ["a-review-a", "m-review", "cohort-a"],
  ["a-instructor-b", "m-instructor", "cohort-b"],
]) {
  insert(
    "INSERT INTO member_cohort_assignments (id, member_id, cohort_id, status, assigned_by, assigned_at, revoked_at) VALUES (?,?,?,?,?,?,NULL)",
    id, memberId, cohortId, "active", "organisation", now,
  );
}

insert(
  "INSERT INTO academic_reviews (id, cohort_id, learner_id, reviewer_member_id, scope, outcome, evidence_json, notes, created_at, decided_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  "r-1", "cohort-a", "seed-learner-1", "m-review", "independent-build", "approved",
  '{"kinds":["independent-start"]}', "", now, now,
);

for (const table of ["organisations", "organisation_members", "cohorts", "member_cohort_assignments", "cohort_enrolments", "academic_reviews"]) {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
  console.log(`  ${table}: ${row.n}`);
}
console.log("seeded the local pilot institution");
