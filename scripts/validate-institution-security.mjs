import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GUARDIAN_EMAIL_HEADER,
  GUARDIAN_ID_HEADER,
} from "../lib/guardian-identity.ts";
import {
  canActOn,
  canRead,
  cohortScoped,
  institutionActions,
  institutionRoles,
  mayRead,
} from "../lib/institution-roles.ts";
import {
  assignedCohortIds,
  membershipFromAssignments,
  planAssignment,
} from "../lib/lms-accounts.ts";
import {
  IDENTITY_ISSUED_HEADER,
  IDENTITY_SIGNATURE_HEADER,
  identityTrustModeFor,
  signIdentityAssertion,
  trustForwardedIdentity,
} from "../lib/identity-trust.ts";

/*
 * The P4 security gate.
 *
 * Three things are proved here, and none of them is a description of the code:
 *
 *   1. A cohort-scoped grown-up reaches only the cohorts a persisted assignment grants.
 *      Two cohorts inside one organisation are enough to show the difference, and every
 *      cohort-scoped role is checked, not only the lead.
 *   2. An identity header is not an identity on its own when the deployment is in the
 *      signed-proxy mode. Unsigned, tampered, stale and replayed-for-another-person
 *      assertions are refused, and the mode resolution fails closed on a misspelling.
 *   3. The routes cannot bypass either rule: they ask the identity module, they read the
 *      assignment table, and the migration is additive.
 */

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const cohortA = "cohort-a";
const cohortB = "cohort-b";
const elsewhere = "org-other";

/* ------------------------------------------- a persisted assignment is the scope --- */

assert.deepEqual(
  assignedCohortIds([{ cohortId: cohortA, status: "active" }, { cohortId: cohortA, status: "active" }]),
  [cohortA],
  "An active assignment is granted once, even when the row appears twice.",
);
assert.deepEqual(
  assignedCohortIds([{ cohortId: cohortA, status: "active" }, { cohortId: cohortB, status: "revoked" }]),
  [cohortA],
  "A revoked assignment keeps its history and grants nothing.",
);
assert.deepEqual(assignedCohortIds([]), [], "A member with no assignment is granted no cohort.");

/* The defect this phase exists to close: deriving a cohort scope from the organisation's
 * cohort list. Each cohort-scoped role is checked with the persisted scope, not with the
 * organisation's list. */
for (const role of cohortScoped) {
  const unassigned = { organisationId: "org-home", role, cohortIds: [] };
  for (const action of institutionActions) {
    if (action === "assign_cohort") {
      assert.equal(canActOn(unassigned, action, { organisationId: "org-home", cohortId: cohortA }), false, `${role} must not assign a cohort.`);
      continue;
    }
    assert.equal(
      canActOn(unassigned, action, { organisationId: "org-home", cohortId: cohortA }),
      false,
      `${role} acted on ${action} in a cohort it was not assigned to.`,
    );
  }
  for (const dataClass of ["cohort_roster", "progress_summary", "assessment_evidence", "learner_identity", "learner_code"]) {
    assert.equal(
      canRead(unassigned, dataClass, { organisationId: "org-home", cohortId: cohortA }),
      false,
      `${role} read ${dataClass} from an unassigned cohort.`,
    );
  }
}

for (const role of cohortScoped) {
  const assigned = { organisationId: "org-home", role, cohortIds: assignedCohortIds([{ cohortId: cohortA, status: "active" }]) };
  assert.equal(
    canRead(assigned, "cohort_roster", { organisationId: "org-home", cohortId: cohortA }),
    true,
    `${role} was refused a cohort it is assigned to.`,
  );
  assert.equal(
    canRead(assigned, "cohort_roster", { organisationId: "org-home", cohortId: cohortB }),
    false,
    `${role} reached a second cohort in the same organisation.`,
  );
  assert.equal(
    canRead(assigned, "cohort_roster", { organisationId: elsewhere, cohortId: cohortA }),
    false,
    `${role} reached a cohort by naming another organisation.`,
  );
  assert.notEqual(assigned.organisationId, elsewhere, "The membership must stay bound to its own organisation.");
}

/* The membership a route builds carries only the assigned cohorts, never the organisation's
 * whole list. */
const built = membershipFromAssignments(
  { organisationId: "org-home", role: "cohort_lead", cohortIds: [] },
  [{ cohortId: cohortA, status: "active" }, { cohortId: cohortB, status: "revoked" }],
);
assert.deepEqual(built.cohortIds, [cohortA], "The route membership must carry only active assignments.");

/* ------------------------------------------------ who may write an assignment ----- */

const admin = { organisationId: "org-home", role: "organisation_admin", cohortIds: [] };
const coordinator = { organisationId: "org-home", role: "programme_coordinator", cohortIds: [] };
const lead = { organisationId: "org-home", role: "cohort_lead", cohortIds: [cohortA] };

assert.equal(
  planAssignment({ membership: admin, organisationId: "org-home", cohortId: cohortA, current: null, wanted: "active" }).action,
  "insert",
  "An administrator may assign a member to a cohort in its own organisation.",
);
const revoked = { cohortId: cohortA, memberId: "m-lead", status: "revoked" };
assert.equal(
  planAssignment({ membership: coordinator, organisationId: "org-home", cohortId: cohortA, current: revoked, wanted: "active" }).action,
  "reactivate",
  "A re-assignment reactivates the same row so the history survives.",
);
assert.equal(
  planAssignment({ membership: admin, organisationId: "org-home", cohortId: cohortA, current: { ...revoked, status: "active" }, wanted: "active" }).action,
  "no-op",
  "Assigning an already assigned member changes nothing.",
);
assert.equal(
  planAssignment({ membership: admin, organisationId: "org-home", cohortId: cohortA, current: { ...revoked, status: "active" }, wanted: "revoked" }).action,
  "revoke",
  "An administrator may revoke an assignment.",
);
assert.equal(
  planAssignment({ membership: lead, organisationId: "org-home", cohortId: cohortA, current: null, wanted: "active" }).action,
  "refused",
  "A cohort lead must not widen its own scope by assigning cohorts.",
);
assert.equal(
  planAssignment({ membership: admin, organisationId: elsewhere, cohortId: cohortA, current: null, wanted: "active" }).action,
  "refused",
  "An assignment must never cross an organisation.",
);

/* ---------------------------------------------------------- the identity boundary --- */

assert.equal(identityTrustModeFor(null, null), "platform-headers", "With nothing configured the documented platform contract is named, not left implicit.");
assert.equal(identityTrustModeFor(undefined, ""), "platform-headers", "An empty secret must not switch the mode.");
assert.equal(identityTrustModeFor(null, "a".repeat(32)), "proxy-signature", "A configured secret switches the deployment to signed proxy identity.");
assert.equal(identityTrustModeFor("deny", "a".repeat(32)), "deny", "A named mode must win over a configured secret.");
assert.equal(identityTrustModeFor("proxy-signature", null), "proxy-signature", "A named signed mode must be honoured even without a secret, and then fail closed.");
assert.equal(identityTrustModeFor("platform-header", null), "deny", "A misspelled mode must fail closed rather than fall back to a weaker mode.");
assert.equal(identityTrustModeFor("nonsense", "a".repeat(32)), "deny", "An unknown mode must not be silently downgraded.");

const secret = "k".repeat(48);
const identity = { platformUserId: "platform-lead", email: "lead@school.test", displayName: "Lead" };
const now = new Date("2026-10-28T00:00:00.000Z");
const issued = "2026-10-28T00:00:00.000Z";

function request(headers) {
  return new Request("http://localhost/api/institution/workspace", { headers });
}

const unsigned = request({ [GUARDIAN_ID_HEADER]: identity.platformUserId, [GUARDIAN_EMAIL_HEADER]: identity.email });
assert.equal(await trustForwardedIdentity(unsigned, { mode: "deny", secret, now }), null, "The deny mode accepted an identity.");
assert.equal(
  (await trustForwardedIdentity(unsigned, { mode: "platform-headers", secret: null, now }))?.platformUserId,
  identity.platformUserId,
  "The platform-header mode must read the forwarded identity, which is the documented contract.",
);
assert.equal(
  await trustForwardedIdentity(unsigned, { mode: "proxy-signature", secret, now }),
  null,
  "A signed deployment accepted an unsigned identity header, so the header can be spoofed.",
);
assert.equal(
  await trustForwardedIdentity(unsigned, { mode: "proxy-signature", secret: null, now }),
  null,
  "A signed deployment with no secret must fail closed.",
);

const signature = await signIdentityAssertion(identity, issued, secret);
const signed = request({ [GUARDIAN_ID_HEADER]: identity.platformUserId, [GUARDIAN_EMAIL_HEADER]: identity.email, [IDENTITY_SIGNATURE_HEADER]: signature, [IDENTITY_ISSUED_HEADER]: issued });
assert.equal(
  (await trustForwardedIdentity(signed, { mode: "proxy-signature", secret, now }))?.platformUserId,
  identity.platformUserId,
  "A correctly signed identity assertion was refused.",
);

const spoofed = request({ [GUARDIAN_ID_HEADER]: "platform-admin", [GUARDIAN_EMAIL_HEADER]: identity.email, [IDENTITY_SIGNATURE_HEADER]: signature, [IDENTITY_ISSUED_HEADER]: issued });
assert.equal(
  await trustForwardedIdentity(spoofed, { mode: "proxy-signature", secret, now }),
  null,
  "A signature for one identity was accepted for a different identity.",
);

const swappedEmail = request({ [GUARDIAN_ID_HEADER]: identity.platformUserId, [GUARDIAN_EMAIL_HEADER]: "other@school.test", [IDENTITY_SIGNATURE_HEADER]: signature, [IDENTITY_ISSUED_HEADER]: issued });
assert.equal(
  await trustForwardedIdentity(swappedEmail, { mode: "proxy-signature", secret, now }),
  null,
  "A signature was accepted after the email was swapped.",
);

const stale = request({ [GUARDIAN_ID_HEADER]: identity.platformUserId, [GUARDIAN_EMAIL_HEADER]: identity.email, [IDENTITY_SIGNATURE_HEADER]: signature, [IDENTITY_ISSUED_HEADER]: "2026-10-27T20:00:00.000Z" });
assert.equal(
  await trustForwardedIdentity(stale, { mode: "proxy-signature", secret, now }),
  null,
  "A stale identity assertion was replayed successfully.",
);

const truncated = request({ [GUARDIAN_ID_HEADER]: identity.platformUserId, [GUARDIAN_EMAIL_HEADER]: identity.email, [IDENTITY_SIGNATURE_HEADER]: signature.slice(0, -2), [IDENTITY_ISSUED_HEADER]: issued });
assert.equal(
  await trustForwardedIdentity(truncated, { mode: "proxy-signature", secret, now }),
  null,
  "A truncated signature was accepted.",
);

const plainHeaders = request({ [GUARDIAN_ID_HEADER]: identity.platformUserId, [GUARDIAN_EMAIL_HEADER]: identity.email });
assert.equal(
  await trustForwardedIdentity(plainHeaders, { mode: "proxy-signature", secret: "wrong".repeat(10), now }),
  null,
  "A signature made with a different secret was accepted.",
);

/* ------------------------------------------------------------ the routes and data --- */

const workspaceSource = read("app/api/institution/workspace/route.ts");
const enrolmentSource = read("app/api/institution/enrolment/route.ts");
const assignmentSource = read("app/api/institution/assignments/route.ts");

for (const [name, source] of [
  ["workspace", workspaceSource],
  ["enrolment", enrolmentSource],
  ["assignments", assignmentSource],
]) {
  assert(source.includes("readInstitutionIdentity"), `The ${name} route reads an identity header itself instead of asking the identity module.`);
  assert(!source.includes("readLmsIdentity"), `The ${name} route still trusts the raw forwarded identity.`);
  assert(!source.includes("request.json") || name !== "workspace", `The ${name} route must not read an identity from a body.`);
}

for (const [name, source] of [
  ["workspace", workspaceSource],
  ["enrolment", enrolmentSource],
]) {
  assert(source.includes("member_cohort_assignments"), `The ${name} route does not read the persisted cohort assignment.`);
  assert(source.includes("assignedCohortIds") || source.includes("membershipFromAssignments"), `The ${name} route does not derive its scope from assignments.`);
  assert(!source.includes('membership.role === "cohort_lead"'), `The ${name} route still expands a cohort-scoped role to every cohort.`);
}

/* The old defect, stated as data: the workspace must never hand a cohort-scoped role the
 * organisation's whole cohort list. The organisation-scoped branch is the only place that
 * may build a list from `cohorts`, and it is guarded by the role check. */
assert(
  workspaceSource.includes("organisationScoped.includes(membership.role)"),
  "The workspace must branch on the role before it attributes organisation-wide cohorts.",
);
for (const block of workspaceSource.split("organisationScoped.includes(membership.role)").slice(1)) {
  assert(!block.includes('role === "cohort_lead"'), "A cohort-scoped role must not be expanded to the organisation's cohorts.");
}

for (const role of institutionRoles) {
  /* The administrator and the coordinator keep their organisation-wide reads; nobody else
   * may read a learner identity without a cohort. */
  assert.equal(mayRead(role, "learner_identity"), role !== "academic_reviewer" && role !== "organisation_admin", `${role} has the wrong learner identity boundary.`);
}

const schema = read("db/schema.ts");
assert(schema.includes('"member_cohort_assignments"'), "The schema is missing the assignment table.");
assert(schema.includes('uniqueIndex("member_cohort_assignments_pair_unique")'), "A member must have one assignment row per cohort.");
assert(
  schema.includes('references(() => organisationMembers.id, { onDelete: "cascade" })'),
  "An assignment must cascade from the member.",
);

const migrationPath = resolve(root, "drizzle/0009_member_cohort_assignments.sql");
assert(existsSync(migrationPath), "The assignment migration is missing.");
const migration = readFileSync(migrationPath, "utf8");
assert.equal((migration.match(/CREATE TABLE/g) || []).length, 1, "The assignment migration must add exactly one table.");
assert.equal((migration.match(/CREATE (?:UNIQUE )?INDEX/g) || []).length, 3, "The assignment migration must add exactly three indexes.");
for (const statement of migration.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) {
  assert(/^CREATE\s+(TABLE|(UNIQUE\s+)?INDEX)\b/i.test(statement), `The assignment migration must only create tables and indexes, found: ${statement.slice(0, 40)}`);
}
for (const forbidden of ["DROP TABLE", "DROP INDEX", "ALTER TABLE", "INSERT INTO", "DELETE FROM"]) {
  assert(!migration.toUpperCase().includes(forbidden), `The assignment migration must not ${forbidden.toLowerCase()} anything.`);
}
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
assert.equal(
  journal.entries.map((entry) => entry.tag).at(-1),
  "0009_member_cohort_assignments",
  "The assignment migration must be the newest migration.",
);

const identitySource = read("lib/identity-trust.ts");
for (const forbidden of ["request.json", "searchParams", 'get("cookie")']) {
  assert(!identitySource.includes(forbidden), `Identity trust must never read ${forbidden}.`);
}
assert(identitySource.includes("constantTimeEquals"), "The signature comparison must not exit on the first differing byte.");

console.log("Validated persisted cohort assignments, within-organisation negative scope, assignment writers and the proxy identity boundary.");
