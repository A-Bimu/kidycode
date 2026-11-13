import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GUARDIAN_ID_HEADER, GUARDIAN_SIGN_IN_PATH } from "../lib/guardian-identity.ts";
import {
  canActOn,
  canPerform,
  canRead,
  cohortScoped,
  dataClasses,
  institutionActions,
  institutionRoles,
  mayRead,
  organisationScoped,
  permissions,
  reviewIssuesCertificate,
  withinScope,
} from "../lib/institution-roles.ts";
import { LMS_ID_HEADER, LMS_SIGN_IN_PATH, activeCohortIds, planEnrolment, resolveMembership, withCohorts } from "../lib/lms-accounts.ts";

/*
 * The Day 1 role and boundary checks.
 *
 * Two promises are proved here rather than described:
 *
 *   1. No role crosses an organisation, and a cohort-scoped role cannot reach a cohort it
 *      does not work in. The test asserts this for every role, including the one that
 *      manages the organisation.
 *   2. An academic reviewer decides from evidence. The reviewer never reads learner code,
 *      never reads a learner's identity, and never issues a certificate.
 */

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const home = { organisationId: "org-home", cohortId: "cohort-a" };
const elsewhere = { organisationId: "org-other", cohortId: "cohort-a" };

/* ------------------------------------------------------------- the shape ------- */

assert.equal(institutionRoles.length, 5, "There are five institution roles.");
for (const role of institutionRoles) {
  assert(role in permissions, `The permission table is missing ${role}.`);
  assert.deepEqual(
    Object.keys(permissions[role]).sort(),
    [...institutionActions].sort(),
    `${role} does not answer every action, so an action could arrive by accident.`,
  );
}
assert.deepEqual([...organisationScoped, ...cohortScoped].sort(), [...institutionRoles].sort(), "Every role must be scoped to either an organisation or a cohort.");
for (const role of institutionRoles) {
  assert(!(organisationScoped.includes(role) && cohortScoped.includes(role)), `${role} cannot be both organisation and cohort scoped.`);
}

/* --------------------------------------------------- no crossing an org -------- */

for (const role of institutionRoles) {
  const membership = { organisationId: "org-home", role, cohortIds: ["cohort-a"] };
  assert.equal(withinScope(membership, elsewhere), false, `${role} must not reach another organisation.`);
  assert.equal(withinScope({ ...membership, organisationId: "" }, home), false, `${role} must refuse a missing organisation.`);
  assert.equal(withinScope(membership, { organisationId: "org-home" }), organisationScoped.includes(role) === true, `${role} answered the organisation-only scope wrongly.`);
  if (cohortScoped.includes(role)) {
    assert.equal(withinScope(membership, { organisationId: "org-home", cohortId: "cohort-b" }), false, `${role} must not reach a cohort it does not work in.`);
    assert.equal(withinScope({ ...membership, cohortIds: ["cohort-a", "cohort-b"] }, { organisationId: "org-home", cohortId: "cohort-b" }), true, `${role} must reach a cohort it does work in.`);
  }
}

/* A permission alone is not enough: the scope is still required. */
for (const role of institutionRoles) {
  const membership = { organisationId: "org-home", role, cohortIds: ["cohort-a"] };
  for (const action of institutionActions) {
    if (!canPerform(role, action)) continue;
    assert.equal(canActOn(membership, action, elsewhere), false, `${role} performed ${action} in another organisation.`);
  }
}

/* --------------------------------------------------- the review boundary ------- */

for (const role of institutionRoles) {
  const reviewerOnly = role === "academic_reviewer";
  assert.equal(
    mayRead(role, "learner_code"),
    role === "instructor" || role === "cohort_lead",
    `${role} has the wrong access to learner code.`,
  );
  if (reviewerOnly) {
    assert.equal(mayRead(role, "learner_identity"), false, "A reviewer decides from evidence, so a learner identity is not needed.");
    assert.equal(canPerform(role, "read_learner_code"), false, "A reviewer must never read learner code.");
    assert.equal(canPerform(role, "read_learner_identity"), false, "A reviewer must never read a learner identity.");
    assert.equal(canPerform(role, "decide_academic_review"), true, "A reviewer must be able to decide a review.");
    assert.equal(canPerform(role, "record_academic_review"), true, "A reviewer must be able to record a review.");
  }
  assert.equal(canPerform(role, "issue_certificate"), false, `${role} may issue a certificate from inside a review, which is a separate gate.`);
}

/* A review decides about evidence. It never becomes a certificate. */
assert.equal(reviewIssuesCertificate(), false, "A review outcome must never issue a certificate.");

/* The organisation administrator manages the institution and its members. It does not
 * enrol learners, does not read a learner's identity and never reads learner code. */
assert.equal(canPerform("organisation_admin", "manage_organisation"), true, "The administrator manages the organisation.");
assert.equal(canPerform("organisation_admin", "manage_members"), true, "The administrator manages members.");
assert.equal(canPerform("organisation_admin", "enrol_learner"), false, "Enrolment belongs to the coordinator and the cohort lead.");
assert.equal(canPerform("organisation_admin", "read_learner_code"), false, "The administrator must not read learner code.");
assert.equal(canPerform("organisation_admin", "decide_academic_review"), false, "The administrator must not decide an academic review.");

/* Learner code is only readable inside a named cohort, so a summary view cannot widen
 * into a copy of a learner's work. */
const instructor = { organisationId: "org-home", role: "instructor", cohortIds: ["cohort-a"] };
assert.equal(canRead(instructor, "learner_code", { organisationId: "org-home", cohortId: "cohort-a" }), true, "An instructor reads code inside their own cohort.");
assert.equal(canRead(instructor, "learner_code", { organisationId: "org-home" }), false, "Learner code must not be readable without a cohort.");
assert.equal(canRead(instructor, "learner_code", { organisationId: "org-home", cohortId: "cohort-b" }), false, "An instructor must not read code from another cohort.");

/* ------------------------------------------------------ signed-in accounts ----- */

assert.equal(LMS_ID_HEADER, GUARDIAN_ID_HEADER, "The LMS reads the same platform identity header, with no second sign-in.");
assert.equal(LMS_SIGN_IN_PATH, GUARDIAN_SIGN_IN_PATH, "The LMS must not invent its own sign-in route.");

const identity = { platformUserId: "platform-1", email: "lead@example.test", displayName: "Lead" };
const accounts = [
  { id: "m1", platformUserId: "platform-1", organisationId: "org-home", email: "lead@example.test", displayName: "Lead", role: "cohort_lead", status: "active" },
  { id: "m2", platformUserId: "platform-1", organisationId: "org-other", email: "lead@example.test", displayName: "Lead", role: "instructor", status: "active" },
];
assert.equal(resolveMembership(identity, accounts), null, "A membership must not be guessed when two organisations are possible.");
assert.equal(resolveMembership(identity, accounts, "org-home")?.role, "cohort_lead", "A named organisation resolves the membership.");
assert.equal(resolveMembership(identity, accounts, "org-missing"), null, "An unknown organisation resolves to nothing.");
assert.equal(
  resolveMembership(identity, [{ ...accounts[0], status: "suspended" }], "org-home"),
  null,
  "A suspended account holds no membership.",
);
assert.equal(resolveMembership(identity, [{ ...accounts[0], role: "principal" }], "org-home"), null, "An unknown role holds no membership.");

const lead = withCohorts({ organisationId: "org-home", role: "cohort_lead", cohortIds: [] }, activeCohortIds([
  { cohortId: "cohort-a", status: "active" },
  { cohortId: "cohort-a", status: "revoked" },
  { cohortId: "cohort-b", status: "paused" },
]));
assert.deepEqual(lead.cohortIds, ["cohort-a"], "Only an active enrolment widens a lead's cohorts.");

/* ------------------------------------------------------ enrolment linking ------ */

const coordinator = { organisationId: "org-home", role: "programme_coordinator", cohortIds: [] };
const nothing = null;

assert.equal(planEnrolment({ membership: coordinator, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-1", current: nothing, wanted: "active" }).action, "insert", "A coordinator creates a new learner link.");
assert.equal(
  planEnrolment({ membership: coordinator, organisationId: "org-other", cohortId: "cohort-a", learnerId: "learner-1", current: nothing, wanted: "active" }).action,
  "refused",
  "An enrolment must not cross an organisation.",
);
const existing = { cohortId: "cohort-a", learnerId: "learner-1", status: "revoked" };
assert.equal(
  planEnrolment({ membership: coordinator, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-1", current: existing, wanted: "active" }).action,
  "reactivate",
  "A returning learner keeps the same enrolment row, so the history survives.",
);
assert.equal(
  planEnrolment({ membership: coordinator, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-2", current: existing, wanted: "active" }).action,
  "refused",
  "An enrolment row must not be reused for a different learner.",
);
assert.equal(
  planEnrolment({ membership: coordinator, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-1", current: { ...existing, status: "active" }, wanted: "active" }).action,
  "no-op",
  "Re-enrolling an active learner changes nothing.",
);
assert.equal(
  planEnrolment({ membership: instructor, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-1", current: nothing, wanted: "active" }).action,
  "refused",
  "An instructor must not enrol a learner.",
);
assert.equal(
  planEnrolment({ membership: coordinator, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-1", current: { ...existing, status: "active" }, wanted: "revoked" }).action,
  "revoke",
  "A coordinator may revoke a learner link.",
);
assert.equal(
  planEnrolment({ membership: coordinator, organisationId: "org-home", cohortId: "cohort-a", learnerId: "learner-1", current: nothing, wanted: "revoked" }).action,
  "no-op",
  "Revoking a link that does not exist changes nothing.",
);

/* ----------------------------------------------------------- the source -------- */

const roleSource = read("lib/institution-roles.ts");
const accountSource = read("lib/lms-accounts.ts");
for (const source of [roleSource, accountSource]) {
  assert(!source.includes("\u2014") && !source.includes("\u2013"), "Institution copy must not use dashes as punctuation.");
  assert(!/\bgreen\b/i.test(source), "Institution copy must not use the banned colour name.");
  assert(!source.includes("request.json"), "A role decision must never read a request body.");
  assert(!source.includes("server-database") && !source.includes("cloudflare"), "The role rules must stay free of database access.");
}
for (const dataClass of dataClasses) {
  assert(roleSource.includes(`"${dataClass}"`), `The boundary module does not describe the ${dataClass} data class.`);
}
assert(roleSource.includes("A reviewer decides from evidence"), "The review boundary must be stated in the rule, not only in a test.");
assert(roleSource.includes("No role crosses an organisation"), "The organisation boundary must be stated in the rule.");

/* ------------------------------------------------------ the schema and SQL ----- */

const schema = read("db/schema.ts");
for (const table of ["organisations", "organisation_members", "cohorts", "cohort_enrolments", "academic_reviews"]) {
  assert(schema.includes(`"${table}"`), `The schema is missing ${table}.`);
}
assert(schema.includes('uniqueIndex("cohort_enrolments_pair_unique")'), "A learner link must be unique per cohort.");
assert(schema.includes('references(() => learnerProfiles.id, { onDelete: "cascade" })'), "A learner link must cascade from the learner.");
assert(schema.includes('references(() => organisations.id, { onDelete: "cascade" })'), "An organisation must be able to remove its own cohorts and members.");
/* A review holds a scope, an outcome and a compact evidence summary. It must not gain a
 * column that could hold a learner's work. */
const reviewColumns = schema.slice(schema.indexOf('"academic_reviews"'), schema.indexOf("export const", schema.indexOf('"academic_reviews"')));
for (const forbidden of ["code_json", "html", "javascript", "draft_json"]) {
  assert(!reviewColumns.includes(forbidden), `An academic review must not carry learner work (${forbidden}).`);
}

const migrationPath = resolve(root, "drizzle/0008_ancient_centennial.sql");
assert(existsSync(migrationPath), "The Day 1 migration is missing.");
const migration = readFileSync(migrationPath, "utf8");
assert.equal((migration.match(/CREATE TABLE/g) || []).length, 5, "The Day 1 migration adds exactly five tables.");
assert.equal((migration.match(/CREATE (?:UNIQUE )?INDEX/g) || []).length, 9, "The Day 1 migration adds exactly nine indexes.");
for (const statement of migration.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) {
  assert(/^CREATE\s+(TABLE|(UNIQUE\s+)?INDEX)\b/i.test(statement), `The Day 1 migration must only create tables and indexes, found: ${statement.slice(0, 40)}`);
}
for (const forbidden of ["DROP TABLE", "DROP INDEX", "ALTER TABLE", "INSERT INTO", "DELETE FROM"]) {
  assert(!migration.toUpperCase().includes(forbidden), `The Day 1 migration must not ${forbidden.toLowerCase()} anything.`);
}
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const tags = journal.entries.map((entry) => entry.tag);
assert.equal(tags[tags.length - 1], "0009_member_cohort_assignments", "The cohort assignment migration must be the newest migration.");
assert.equal(tags.filter((tag) => tag === "0008_ancient_centennial").length, 1, "The Day 1 migration must appear once.");
assert.equal(tags.filter((tag) => tag === "0009_member_cohort_assignments").length, 1, "The cohort assignment migration must appear once.");

console.log("Validated five institution roles, organisation and cohort scope, the review boundary and the Day 1 additive migration.");
