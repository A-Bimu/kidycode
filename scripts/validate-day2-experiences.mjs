import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { institutionRoles, canRead } from "../lib/institution-roles.ts";
import { buildPilotWorkspace, learnerDisplay, visibleActions, visibleDataClasses } from "../lib/pilot-workspace.ts";
import { codingCourseIds, courseCatalogue, learnerExperienceIssues, notesLibrary, practiceLab } from "../lib/learning-experience.ts";
import { designCourseFor, designCourseIssues, designCourses } from "../lib/design-course.ts";
import { buildOutside, buildOutsideIssues } from "../lib/build-outside.ts";
import { curriculumMap, curriculumMapIssues } from "../lib/curriculum-map.ts";
import { skillsEvidenceIssues, skillsEvidenceRecord } from "../lib/skills-evidence.ts";
import { certificateWording, certificateWordingIssues } from "../lib/certificate-language.ts";

/*
 * The Day 2 experiences, proved against the contracts they call rather than described.
 *
 * Nothing here trusts a comment. The pilot workspace is built for every role and every
 * boundary is asserted on the returned object; the four learner experiences are checked
 * against the courses themselves; and the new screens must exist and must stay free of the
 * banned copy and the banned capabilities the rest of the product already forbids.
 */

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

let passed = 0;
const failed = [];
const skipped = [];
function step(name, body) {
  try {
    body();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

/* ---------------------------------------------------- the learner experiences -- */

step("the catalogue, notes, practice and dashboard agree with the courses", () => {
  const issues = learnerExperienceIssues();
  assert.deepEqual(issues, [], issues.join("; "));
});

step("the catalogue labels every entry and reaches six programmes", () => {
  const catalogue = courseCatalogue();
  assert.ok(catalogue.length >= 6, `expected at least six catalogue entries, found ${catalogue.length}.`);
  for (const entry of catalogue) {
    assert.ok(["real", "demo", "pending"].includes(entry.provenance), `${entry.id} has no provenance label.`);
  }
});

step("the Notes Library covers every lesson, the Practice Lab carries no answer", () => {
  for (const courseId of codingCourseIds) {
    const notes = notesLibrary(courseId);
    const lab = practiceLab(courseId);
    assert.ok(notes.noteCount > 0, `${courseId} has no notes.`);
    assert.ok(lab.cards.length > 0, `${courseId} has no practice cards.`);
    const labText = JSON.stringify(lab);
    assert.ok(!/explanation/i.test(labText), `${courseId}: the Practice Lab must not carry an explanation.`);
    assert.ok(!/"answer"/.test(labText), `${courseId}: the Practice Lab must not carry an answer.`);
  }
});

/* --------------------------------------------------------- the pilot workspace -- */

const home = { organisationId: "org-home", cohortId: "cohort-a" };
const organisations = { id: "org-home", slug: "school", name: "Pilot School", kind: "school", status: "active" };
const input = {
  organisation: organisations,
  members: [
    { id: "m1", organisationId: "org-home", platformUserId: "p-admin", email: "admin@school.test", displayName: "Admin", role: "organisation_admin", status: "active" },
    { id: "m2", organisationId: "org-home", platformUserId: "p-lead", email: "lead@school.test", displayName: "Lead", role: "cohort_lead", status: "active" },
    { id: "m3", organisationId: "org-home", platformUserId: "p-review", email: "review@school.test", displayName: "Reviewer", role: "academic_reviewer", status: "active" },
  ],
  cohorts: [
    { id: "cohort-a", organisationId: "org-home", code: "A1", name: "Year 7 A", courseId: "ages-10-12", status: "active" },
    { id: "cohort-b", organisationId: "org-home", code: "B1", name: "Year 8 B", courseId: "ages-13-15", status: "active" },
    { id: "cohort-x", organisationId: "org-other", code: "X1", name: "Elsewhere", courseId: "adults", status: "active" },
  ],
  enrolments: [
    { cohortId: "cohort-a", learnerId: "learner-1", status: "active" },
    { cohortId: "cohort-a", learnerId: "learner-2", status: "revoked" },
    { cohortId: "cohort-b", learnerId: "learner-3", status: "active" },
    { cohortId: "cohort-x", learnerId: "learner-9", status: "active" },
  ],
  learners: [
    { learnerId: "learner-1", nickname: "Sky", courseId: "ages-10-12" },
    { learnerId: "learner-2", nickname: "River", courseId: "ages-10-12" },
    { learnerId: "learner-3", nickname: "Ace", courseId: "ages-13-15" },
  ],
  reviews: [
    { cohortId: "cohort-a", learnerId: "learner-1", scope: "independent-build", outcome: "approved", decidedAt: "2026-10-01T09:00:00.000Z" },
  ],
};

step("no workspace ever crosses the organisation, including the administrator", () => {
  for (const role of institutionRoles) {
    const membership = { organisationId: "org-home", role, cohortIds: ["cohort-a", "cohort-b"] };
    const workspace = buildPilotWorkspace(membership, input);
    const cohortIds = workspace.cohorts.map((cohort) => cohort.cohortId);
    assert.ok(!cohortIds.includes("cohort-x"), `${role} reached a cohort in another organisation.`);
    for (const cohort of workspace.cohorts) {
      assert.ok(["cohort-a", "cohort-b"].includes(cohort.cohortId), `${role} reached an unexpected cohort.`);
    }
  }
});

step("a cohort-scoped role reaches only the cohorts it works in", () => {
  const membership = { organisationId: "org-home", role: "instructor", cohortIds: ["cohort-a"] };
  const workspace = buildPilotWorkspace(membership, input);
  assert.deepEqual(workspace.cohorts.map((cohort) => cohort.cohortId), ["cohort-a"], "an instructor reached a cohort outside their list.");
  assert.equal(workspace.audience, "cohort", "a cohort-scoped role must read as cohort scoped.");
});

step("a roster names a learner only where a learner identity may be read", () => {
  const lead = buildPilotWorkspace({ organisationId: "org-home", role: "cohort_lead", cohortIds: ["cohort-a"] }, input);
  assert.equal(lead.cohorts[0].learners[0].display, "Sky", "a cohort lead may see the learner's chosen name.");
  const admin = buildPilotWorkspace({ organisationId: "org-home", role: "organisation_admin", cohortIds: [] }, input);
  const adminNames = admin.cohorts.flatMap((cohort) => cohort.learners.map((learner) => learner.display));
  for (const name of adminNames) {
    assert.match(name, /^Learner [A-Z0-9]{4}$/, `an administrator must not see a learner name, saw ${name}.`);
  }
});

step("an academic reviewer reads evidence and never a learner identity or code", () => {
  const reviewer = buildPilotWorkspace({ organisationId: "org-home", role: "academic_reviewer", cohortIds: ["cohort-a"] }, input);
  assert.equal(canRead({ organisationId: "org-home", role: "academic_reviewer", cohortIds: ["cohort-a"] }, "learner_identity", home), false, "a reviewer must not read a learner identity.");
  const names = reviewer.cohorts.flatMap((cohort) => cohort.learners.map((learner) => learner.display));
  for (const name of names) assert.match(name, /^Learner [A-Z0-9]{4}$/, `a reviewer must not see a learner name, saw ${name}.`);
  assert.ok(reviewer.hidden.includes("learner code"), "the reviewer workspace must name learner code as hidden.");
  assert.ok(reviewer.hidden.includes("learner identities"), "the reviewer workspace must name learner identities as hidden.");
});

step("the capabilities and the hidden list are answered across the cohorts the role works in", () => {
  const lead = buildPilotWorkspace({ organisationId: "org-home", role: "cohort_lead", cohortIds: ["cohort-a"] }, input);
  assert.ok(lead.capabilities.mayRead.includes("learner_identity"), "a cohort lead reads a learner identity in the cohort they work in.");
  assert.ok(lead.capabilities.mayRead.includes("learner_code"), "a cohort lead may read learner code in the cohort they work in.");
  assert.ok(lead.capabilities.mayAct.includes("enrol_learner"), "a cohort lead enrols a learner in their own cohort.");
  assert.equal(lead.readOnly, false, "a cohort lead is not read only.");
  assert.deepEqual(lead.hidden, ["the organisation member list"], "a cohort lead is denied only the organisation member list.");

  const administrator = buildPilotWorkspace({ organisationId: "org-home", role: "organisation_admin", cohortIds: [] }, input);
  assert.ok(!administrator.capabilities.mayRead.includes("learner_identity"), "an administrator still never reads a learner identity.");

  const reviewer = buildPilotWorkspace({ organisationId: "org-home", role: "academic_reviewer", cohortIds: ["cohort-a"] }, input);
  assert.deepEqual(reviewer.hidden, ["learner identities", "learner code", "the organisation member list"], "a reviewer is denied learner identities and learner code.");
  assert.ok(!reviewer.capabilities.mayRead.includes("learner_code"), "a reviewer never reads learner code.");
});

step("the workspace never carries learner code", () => {
  const lead = buildPilotWorkspace({ organisationId: "org-home", role: "cohort_lead", cohortIds: ["cohort-a"] }, input);
  const serialised = JSON.stringify(lead);
  assert.ok(!/learnerCode|codeJson|projectJson|html|javascript/i.test(serialised), "the workspace must not carry learner work.");
});

step("an administrator is offered no enrolment action, a coordinator is", () => {
  const admin = visibleActions({ organisationId: "org-home", role: "organisation_admin", cohortIds: [] }, { organisationId: "org-home" });
  assert.ok(!admin.includes("enrol_learner"), "an administrator must not enrol a learner.");
  const coordinator = visibleActions({ organisationId: "org-home", role: "programme_coordinator", cohortIds: [] }, { organisationId: "org-home" });
  assert.ok(coordinator.includes("enrol_learner"), "a coordinator must be able to enrol a learner.");
  assert.ok(visibleDataClasses({ organisationId: "org-home", role: "academic_reviewer", cohortIds: ["cohort-a"] }, { organisationId: "org-home", cohortId: "cohort-a" }).includes("assessment_evidence"), "a reviewer reads evidence.");
});

step("the learner label never leaks the whole identifier", () => {
  assert.equal(learnerDisplay("abcdef-1234", "Sky", true), "Sky", "a permitted reader sees the name.");
  assert.equal(learnerDisplay("abcdef-1234", "Sky", false), "Learner 1234", "an unpermitted reader sees only a stable tail.");
});

/* The route and the screens exist and call the rules, rather than restating them. */
step("the pilot route builds the workspace through the boundary helpers", () => {
  const route = read("app/api/institution/workspace/route.ts");
  assert(route.includes("readLmsIdentity(request)"), "the workspace route must read the platform identity.");
  assert(route.includes("resolveMembership("), "the workspace route must resolve the membership.");
  assert(route.includes("buildPilotWorkspace("), "the workspace route must build through the shared boundary.");
  assert(!/bodyJson|await request\.json/.test(route), "the workspace route must not read a request body.");
  const enrolRoute = read("app/api/institution/enrolment/route.ts");
  assert(enrolRoute.includes("planEnrolment("), "the enrolment route must use the shared enrolment decision.");
  assert(enrolRoute.includes("resolveMembership("), "the enrolment route must resolve the membership from the headers.");
});

/* -------------------------------------------------- the new programmes and map -- */

step("the UI and UX Design course is complete and age adapted", () => {
  for (const band of ["ages-10-12", "ages-13-15", "ages-16-18", "adults"]) {
    const issues = designCourseIssues(designCourseFor(band));
    assert.deepEqual(issues, [], issues.join("; "));
  }
  assert.ok(designCourses.length === 4, "the design course must be adapted for four age bands.");
  assert.ok(designCourseFor("ages-10-12").modules.length >= 6, "the design course needs at least six modules.");
});

step("Build Outside KidyCode names all six stations with a safety rule each", () => {
  const issues = buildOutsideIssues(buildOutside);
  assert.deepEqual(issues, [], issues.join("; "));
  assert.equal(buildOutside.stations.length, 6, "there must be six stations.");
});

step("the curriculum map names every pathway and its gates", () => {
  const issues = curriculumMapIssues();
  assert.deepEqual(issues, [], issues.join("; "));
  const map = curriculumMap();
  for (const kind of ["coding", "design", "tooling"]) {
    assert.ok(map.pathways.some((pathway) => pathway.kind === kind), `the map is missing a ${kind} programme.`);
  }
});

step("the Skills Evidence Record carries every evidence kind and asserts no accreditation", () => {
  for (const courseId of codingCourseIds) {
    const issues = skillsEvidenceIssues(courseId);
    assert.deepEqual(issues, [], issues.join("; "));
    assert.equal(skillsEvidenceRecord(courseId).accreditation, false, "the record must never assert accreditation.");
  }
});

step("the certificate wording is pending approval and withholds what it must", () => {
  const issues = certificateWordingIssues();
  assert.deepEqual(issues, [], issues.join("; "));
  for (const courseId of codingCourseIds) {
    const wording = certificateWording(courseId);
    assert.equal(wording.status, "pending-approval", "the wording must be pending approval.");
    assert.equal(wording.coBranding, false, "there must be no co-branding before written approval.");
  }
});

/* ----------------------------------------------------------- the new screens --- */

step("the Day 2 routes exist and render the shared data", () => {
  const routes = [
    ["app/dashboard/page.tsx", "learnerDashboard"],
    ["app/catalogue/page.tsx", "courseCatalogue"],
    ["app/notes/page.tsx", "notesLibrary"],
    ["app/practice/page.tsx", "practiceLab"],
    ["app/design/page.tsx", "designCourseFor"],
    ["app/build-outside/page.tsx", "buildOutside"],
    ["app/curriculum/page.tsx", "curriculumMap"],
    ["app/institution/page.tsx", "PilotWorkspacePanel"],
  ];
  for (const [path, reference] of routes) {
    assert.ok(existsSync(resolve(root, path)), `Missing Day 2 route: ${path}`);
    assert.ok(read(path).includes(reference), `${path} must render ${reference}.`);
  }
});

step("the new sources hold no banned copy and no banned capability", () => {
  const newSources = [
    "lib/pilot-workspace.ts",
    "lib/learning-experience.ts",
    "lib/design-course.ts",
    "lib/build-outside.ts",
    "lib/curriculum-map.ts",
    "lib/skills-evidence.ts",
    "lib/certificate-language.ts",
    "components/ExperienceNav.tsx",
    "components/PilotWorkspacePanel.tsx",
    "app/dashboard/page.tsx",
    "app/catalogue/page.tsx",
    "app/notes/page.tsx",
    "app/practice/page.tsx",
    "app/design/page.tsx",
    "app/build-outside/page.tsx",
    "app/curriculum/page.tsx",
    "app/institution/page.tsx",
  ];
  const bannedCapability = ["getUserMedia", "mediaDevices", "MediaRecorder", "enumerateDevices", "navigator.clipboard.read", "clipboard.readText", "SpeechRecognition", "faceDetector"];
  for (const path of newSources) {
    const source = read(path);
    assert(!source.includes("\u2014") && !source.includes("\u2013"), `${path} contains a dash used as punctuation.`);
    assert(!/\bgreen\b/i.test(source), `${path} contains the banned colour name.`);
    for (const capability of bannedCapability) assert(!source.includes(capability), `${path} contains ${capability}.`);
  }
});

step("the responsive styles were added and stay inside the palette", () => {
  const styles = read("app/globals.css");
  assert(styles.includes(".kc-page"), "the Day 2 screens need their own layout.");
  assert(styles.includes("@media (min-width: 720px)"), "the Day 2 screens need a wider-screen layout.");
  const newBlock = styles.slice(styles.indexOf("Day 2 experiences: dashboard"));
  assert(!/#[0-9a-f]{3,6}\b/i.test(newBlock), "the Day 2 styles must use the existing palette variables, not new colours.");
});

console.log(`\nDay 2 experiences: ${passed} checks passed, ${failed.length} failed, ${skipped.length} skipped`);
if (failed.length > 0) {
  for (const failure of failed) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
