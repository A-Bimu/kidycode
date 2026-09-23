#!/usr/bin/env node
/*
 * Certification unit tests.
 *
 * The eligibility rule is a five-condition rule, so every condition is proved on its own: a
 * fixture that satisfies everything except that one condition, asserted ineligible, plus the
 * fully satisfied case. A single happy-path test would prove nothing about the rule.
 *
 * The harness follows the project's convention: check() only records a result and refuses
 * anything that is not a name, step() runs a body. A recorder that can silently ignore a body
 * manufactures false confidence.
 */

import assert from "node:assert/strict";
import {
  ASSESSMENT_PASS_MARK,
  CERTIFICATE_NAME,
  CERTIFICATE_LEVELS,
  CERTIFICATION_STATUS_LABELS,
  certificateLevelFor,
  credentialIdFrom,
  deriveCertification,
  toGuardianCertificate,
} from "../../lib/certification.ts";
import { buildPassport, demonstratedSkills, defenceSummary } from "../../lib/passport.ts";
import { courses } from "../../lib/course-catalog.ts";

const passed = [];
const failures = [];

function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
}

async function step(name, body) {
  if (typeof body !== "function") throw new TypeError("step() needs a body function.");
  try {
    await body();
    check(name);
  } catch (error) {
    failures.push({ name, error });
  }
}

/* A stored final attempt that satisfies every condition. Each test changes one field. */
function attempt(overrides = {}) {
  return {
    attemptId: "attempt-1",
    status: "submitted",
    submittedAt: "2026-09-20T10:00:00.000Z",
    score: 84,
    total: 100,
    buildAwarded: 44,
    buildTotal: 50,
    mandatoryPassed: true,
    defenceStatus: "passed",
    ...overrides,
  };
}

function certify(overrides = {}) {
  return deriveCertification({
    courseId: "ages-10-12",
    courseComplete: true,
    attempts: [attempt()],
    ...overrides,
  });
}

const GATES = ["course", "assessment", "build", "mandatory", "defence"];

await step("every condition satisfied certifies the learner", () => {
  const result = certify();
  assert.equal(result.eligible, true);
  assert.equal(result.status, "certified");
  assert.equal(result.missing.length, 0);
  assert.equal(result.level, "Web Creator");
  assert.equal(result.certificateName, CERTIFICATE_NAME);
});

await step("each condition is proved on its own", () => {
  const cases = [
    ["course", { courseComplete: false }],
    ["assessment", { attempts: [attempt({ score: 69 })] }],
    ["build", { attempts: [attempt({ buildAwarded: 29 })] }],
    ["mandatory", { attempts: [attempt({ mandatoryPassed: false })] }],
    ["defence", { attempts: [attempt({ defenceStatus: "not_passed" })] }],
  ];
  for (const [id, override] of cases) {
    const result = certify(override);
    assert.equal(result.eligible, false, `${id} alone should not certify`);
    assert.deepEqual(result.missing.map((gate) => gate.id), [id], `${id} should be the only missing gate`);
    assert.equal(result.gates.filter((gate) => gate.met).length, GATES.length - 1);
  }
});

await step("a high total cannot carry a failed mandatory check", () => {
  const result = certify({ attempts: [attempt({ score: 99, buildAwarded: 50, mandatoryPassed: false })] });
  assert.equal(result.eligible, false);
  assert.equal(result.missing[0].id, "mandatory");
  assert.equal(result.nextAction.label, "Pass the required checks");
});

await step("a high total cannot carry a weak independent build", () => {
  const result = certify({ attempts: [attempt({ score: 100, buildAwarded: 12 })] });
  assert.equal(result.eligible, false);
  assert.equal(result.missing[0].id, "build");
});

await step("course completed with no assessment is not certifiable", () => {
  const result = certify({ attempts: [] });
  assert.equal(result.eligible, false);
  assert.equal(result.status, "ready");
  assert.equal(result.status === "ready", CERTIFICATION_STATUS_LABELS.ready.startsWith("Course completed"));
  assert.equal(result.nextAction.label, "Return to revision");
});

await step("an unfinished course is in-progress, never ready", () => {
  const result = certify({ courseComplete: false });
  assert.equal(result.status, "in-progress");
  assert.equal(CERTIFICATION_STATUS_LABELS["in-progress"], "Still working through the course");
});

await step("an unfinished attempt is never evidence for a certificate", () => {
  const result = certify({ attempts: [attempt({ status: "in_progress" })] });
  assert.equal(result.eligible, false);
  assert.equal(result.status, "ready");
});

await step("a retryable technical defence state neither issues nor denies", () => {
  const result = certify({ attempts: [attempt({ defenceStatus: "pending" })] });
  assert.equal(result.eligible, false);
  /* The learner keeps everything: the certificate is undecided, not refused. */
  assert.equal(result.status, "ready");
  assert.equal(result.nextAction.label, "Complete your code defence");
  assert.equal(result.gates.find((gate) => gate.id === "defence").detail, "The code defence is not finished.");
});

await step("Not passed yet is not eligible and names the defence", () => {
  const result = certify({ attempts: [attempt({ defenceStatus: "not_passed" })] });
  assert.equal(result.eligible, false);
  assert.equal(result.gates.find((gate) => gate.id === "defence").detail, "The code defence is Not passed yet.");
});

await step("eligibility binds to one attempt, not to a mix of attempts", () => {
  /* A high score on one attempt and a passed defence on another is not a certified learner. */
  const result = certify({
    attempts: [
      attempt({ attemptId: "a", score: 92, defenceStatus: "not_passed" }),
      attempt({ attemptId: "b", score: 20, buildAwarded: 10, defenceStatus: "passed" }),
    ],
  });
  assert.equal(result.eligible, false);
  assert.equal(result.status, "ready");
});

await step("an eligible attempt wins even when a later attempt is weaker", () => {
  const result = certify({
    attempts: [
      attempt({ attemptId: "later", score: 30, buildAwarded: 0, mandatoryPassed: false, defenceStatus: "not_passed" }),
      attempt({ attemptId: "earlier", score: 88 }),
    ],
  });
  assert.equal(result.eligible, true);
  assert.equal(result.attemptId, "earlier");
});

await step("all four courses get their exact level, and an unknown course fails closed", () => {
  const expected = {
    "ages-10-12": "Web Creator",
    "ages-13-15": "Web Builder",
    "ages-16-18": "Web Application Builder",
    adults: "Business Website Builder",
  };
  assert.deepEqual(CERTIFICATE_LEVELS, expected);
  for (const [courseId, level] of Object.entries(expected)) {
    assert.equal(certificateLevelFor(courseId), level);
    assert.equal(certify({ courseId }).level, level);
  }
  const unknown = certify({ courseId: "not-a-course" });
  assert.equal(unknown.level, null);
  assert.equal(unknown.eligible, false);
  assert.equal(unknown.missing[0].id, "course");
});

await step("the pass marks are the approved ones", () => {
  assert.equal(ASSESSMENT_PASS_MARK, 70);
  assert.equal(certify({ attempts: [attempt({ score: 70 })] }).eligible, true);
  assert.equal(certify({ attempts: [attempt({ buildAwarded: 30 })] }).eligible, true);
});

await step("the credential id is opaque, unique and carries no identity", () => {
  const drawn = new Set();
  for (let index = 0; index < 400; index += 1) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = credentialIdFrom(bytes);
    assert.match(id, /^KC-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ-]+$/, `unexpected shape ${id}`);
    assert.ok(!/[01IO]/.test(id), `ambiguous character in ${id}`);
    assert.ok(!id.includes("ages"), "the id must not name a course");
    drawn.add(id);
  }
  assert.equal(drawn.size, 400, "credential ids repeated, so they are not unique");
  /* Deterministic for a fixed draw, so the shape is testable without weakening the call site. */
  assert.equal(credentialIdFrom(new Uint8Array(16)), credentialIdFrom(new Uint8Array(16)));
  assert.notEqual(credentialIdFrom(new Uint8Array(16).fill(255)), credentialIdFrom(new Uint8Array(16)));
});

await step("the guardian certificate carries only allowed facts", () => {
  const result = certify();
  const guardian = toGuardianCertificate(result, { projectTitle: "My club website", issuedAt: "2026-09-21T09:00:00.000Z", skills: ["Layout", "Styling"] });
  assert.deepEqual(Object.keys(guardian).sort(), [
    "certificateName", "courseComplete", "issuedAt", "level", "projectTitle", "skills", "status", "statusLabel",
  ]);
  const body = JSON.stringify(guardian);
  for (const forbidden of ["attempt", "score", "marks", "credentialId", "KC-", "code", "answers", "needsVerification"]) {
    assert.ok(!body.includes(forbidden), `the guardian view must not contain ${forbidden}`);
  }
});

await step("the passport demonstrates only skills with evidence behind them", () => {
  const course = courses["ages-10-12"];
  const result = certify();
  const modules = course.stages.map((stage, index) => ({
    id: stage.id,
    number: stage.number,
    title: stage.title,
    outcome: stage.outcome,
    lessonsTotal: stage.lessons.length,
    lessonsCompleted: index === 0 ? stage.lessons.length : 0,
    checksPassed: 0,
    checksAvailable: 0,
    mastery: 0,
    masteryLabel: "Just started",
    status: index === 0 ? "complete" : "not-started",
  }));
  const passport = buildPassport({
    course,
    completion: { complete: true, projectTitle: "My club website", completedAt: "2026-09-20T10:00:00.000Z" },
    certification: result,
    modules,
    savedStageIds: new Set([course.stages[0].id]),
    securedConcepts: [{ concept: "semantic-regions", label: "Semantic regions", itemId: "item-1" }],
    attempt: { score: 84, total: 100, buildAwarded: 44, buildTotal: 50 },
    defence: defenceSummary("passed"),
    credential: { issuedAt: "2026-09-21T09:00:00.000Z" },
  });

  const demonstrated = passport.skills.filter((skill) => skill.status === "demonstrated");
  const remaining = passport.skills.filter((skill) => skill.status === "still-to-demonstrate");
  assert.equal(demonstrated.length, 2, "one module skill and one assessment skill were expected");
  assert.ok(demonstrated.every((skill) => skill.sources.length > 0), "every demonstrated skill needs evidence");
  assert.ok(remaining.every((skill) => skill.sources.length === 0), "an undemonstrated skill has no evidence trail");
  assert.equal(passport.certificationLabel, CERTIFICATION_STATUS_LABELS.certified);
  assert.equal(passport.courseCompletion.label, "Course completed");
  assert.equal(demonstratedSkills(passport).length, demonstrated.length);
  /* The figure is never the only explanation: the passport says what it means. */
  assert.match(passport.assessment.detail, /Result 84 out of 100/);
  assert.match(passport.assessment.detail, /44 out of 50/);
});

await step("an incomplete passport names one sensible first action", () => {
  const course = courses.adults;
  const result = certify({ courseId: "adults", courseComplete: false });
  const passport = buildPassport({
    course,
    completion: { complete: false, projectTitle: "Business site", completedAt: null },
    certification: result,
    modules: [],
    savedStageIds: new Set(),
    securedConcepts: [],
    attempt: null,
    defence: defenceSummary("none"),
    credential: null,
  });
  assert.equal(passport.courseCompletion.label, "Course still to complete");
  assert.equal(passport.skills.filter((skill) => skill.status === "demonstrated").length, 0);
  assert.equal(passport.assessment.label, "Assessment not taken");
  assert.equal(passport.nextAction.label, "Finish the course");
});

await step("the certificate never claims to be an accreditation", () => {
  const sources = [
    JSON.stringify(certify()),
    CERTIFICATE_NAME,
    ...Object.values(CERTIFICATION_STATUS_LABELS),
    defenceSummary("passed").detail,
  ].join(" ").toLowerCase();
  for (const banned of ["accredited", "diploma", "licence", "license", "professional developer", "government"]) {
    assert.ok(!sources.includes(banned), `learner-facing copy must not say ${banned}`);
  }
});

console.log("\ncertification unit tests");
for (const name of passed) console.log(`  ok   ${name}`);
for (const failure of failures) {
  console.log(`  FAIL ${failure.name}`);
  console.log(`       ${failure.error && failure.error.message ? failure.error.message : failure.error}`);
}
console.log(`\ncertification: ${passed.length} checks passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);