#!/usr/bin/env node
/*
 * V3 lesson journey behaviour tests.
 *
 * Phase 3 adds the checks the phase plan asks for: hint ordering and pacing, the
 * mastery gate, and recovery from a wrong answer or a runtime error. The rules are
 * proved against the real lesson scripts and the real course catalogue, not
 * fixtures that could drift away from the product.
 *
 * The harness follows the project convention: check() only records a result and
 * refuses anything that is not a name, step() runs a body.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "../../lib/course-catalog.ts";
import { lessonScripts } from "../../lib/lesson-scripts.ts";
import {
  appendPreviewError,
  completionButtonReady,
  completionGate,
  evaluateMasteryChecks,
  guidanceStoragePrefix,
  hintGateOpen,
  initialGuidance,
  journeyEnabledFor,
  masteryEditorFiles,
  masteryReflectionMinimum,
  masteryResultSummary,
  nextHintIndex,
  projectReflectionMinimum,
  readGuidanceOverride,
  visibleRequirements,
  writeGuidanceOverride,
} from "../../lib/lesson-journey.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const passed = [];
const failures = [];

function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
}

function step(name, body) {
  try {
    body();
    check(name);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${error.message}`);
  }
}

function assertEqualLabels(actual, expected) {
  const labels = actual.map((result) => result.label);
  assert.deepEqual(labels, expected, `expected failures ${JSON.stringify(expected)}, got ${JSON.stringify(labels)}`);
}

const lessonsById = new Map();
for (const courseId of Object.keys(courses)) {
  for (const lesson of courses[courseId].lessons) lessonsById.set(`${courseId}/${lesson.id}`, lesson);
}

const scriptedLessons = lessonScripts.map((script) => {
  const courseId = script.courseIds[0];
  const lesson = lessonsById.get(`${courseId}/${script.lessonId}`);
  assert(lesson, `${script.lessonId} is not a lesson in ${courseId}.`);
  return { script, courseId, lesson };
});

console.log("hint pacing and ordering");

step("a scripted guided lesson opens help only after one attempt", () => {
  assert.equal(hintGateOpen("guided", 0), false);
  assert.equal(hintGateOpen("guided", 1), true);
  assert.equal(hintGateOpen("guided", 2), true);
});

step("a scripted independent lesson requires two attempts", () => {
  assert.equal(hintGateOpen("independent", 0), false);
  assert.equal(hintGateOpen("independent", 1), false);
  assert.equal(hintGateOpen("independent", 2), true);
});

step("a balanced lesson leaves the hint to the learner", () => {
  assert.equal(hintGateOpen("balanced", 0), true);
});

step("a lesson without a script keeps the V2 pacing", () => {
  assert.equal(hintGateOpen(null, 0), true);
  const expected = new Set();
  for (const script of lessonScripts) {
    for (const courseId of script.courseIds) expected.add(`${courseId}/${script.courseLessonIds?.[courseId] || script.lessonId}`);
    for (const [courseId, companions] of Object.entries(script.companionLessonIds || {})) {
      for (const companion of companions) expected.add(`${courseId}/${companion}`);
    }
  }
  let unscripted = 0;
  for (const courseId of Object.keys(courses)) {
    for (const lesson of courses[courseId].lessons) {
      const enabled = journeyEnabledFor(courseId, lesson.id);
      assert.equal(enabled, expected.has(`${courseId}/${lesson.id}`), `${courseId}/${lesson.id} journey flag disagrees with the script mapping.`);
      if (!enabled) unscripted += 1;
    }
  }
  assert(unscripted > 0, "the catalogue has no unscripted lesson to check.");
});

step("hints are revealed in authored order, one at a time, and never past the last", () => {
  for (const { lesson } of scriptedLessons) {
    assert(lesson.hints.length >= 2, `${lesson.id} needs at least two graduated hints.`);
    assert.equal(new Set(lesson.hints).size, lesson.hints.length, `${lesson.id} repeats a hint.`);
    const revealed = [];
    let index = -1;
    for (let press = 0; press < lesson.hints.length + 2; press += 1) {
      index = nextHintIndex(index, lesson.hints.length);
      revealed.push(index);
    }
    const expected = [...lesson.hints.keys(), ...Array(2).fill(lesson.hints.length - 1)];
    assert.deepEqual(revealed, expected, `${lesson.id} revealed ${revealed.join(",")} instead of ${expected.join(",")}.`);
    assert.equal(new Set(revealed.slice(0, lesson.hints.length)).size, lesson.hints.length, `${lesson.id} skipped a hint.`);
  }
});

step("an empty hint list cannot produce a negative reveal index", () => {
  assert.equal(nextHintIndex(-1, 0), -1);
  assert.equal(nextHintIndex(4, 0), -1);
});

console.log("guided requirement focus");

step("guided shows one requirement: the first that failed", () => {
  const requirements = ["h1 exists", "h2 exists", "h3 exists"];
  const results = [
    { label: "h1 exists", passed: true },
    { label: "h2 exists", passed: false },
    { label: "h3 exists", passed: false },
  ];
  assert.deepEqual(visibleRequirements(requirements, results, "guided"), ["h2 exists"]);
});

step("guided falls back to the first requirement before any check has run", () => {
  const requirements = ["h1 exists", "h2 exists"];
  assert.deepEqual(visibleRequirements(requirements, [], "guided"), ["h1 exists"]);
  assert.deepEqual(visibleRequirements([], [], "guided"), []);
});

step("balanced and independent show every requirement", () => {
  const requirements = ["h1 exists", "h2 exists"];
  const results = [{ label: "h1 exists", passed: false }];
  assert.deepEqual(visibleRequirements(requirements, results, "balanced"), requirements);
  assert.deepEqual(visibleRequirements(requirements, results, "independent"), requirements);
});

console.log("mastery gate and completion");

const passedCode = { workChecked: true, practiceCorrect: true, quizPassed: false };

step("a scripted challenge needs the fresh task and a written reflection", () => {
  const base = { activityType: "challenge", journeyActive: true, ...passedCode, masteryPassed: true, reflection: "x".repeat(masteryReflectionMinimum) };
  assert.equal(completionGate(base), true);
  assert.equal(completionGate({ ...base, masteryPassed: false }), false, "the mastery task was skipped.");
  assert.equal(completionGate({ ...base, reflection: "x".repeat(masteryReflectionMinimum - 1) }), false, "a missing reflection passed.");
  assert.equal(completionGate({ ...base, workChecked: false }), false, "the code check was skipped.");
  assert.equal(completionGate({ ...base, practiceCorrect: false }), false, "the quick check was skipped.");
  assert.equal(completionButtonReady({ ...base, masteryPassed: false }), false, "the button offered completion without the fresh task.");
});

step("a lesson without a script keeps the V2 completion rule", () => {
  const base = { activityType: "challenge", journeyActive: false, ...passedCode, masteryPassed: false, reflection: "" };
  assert.equal(completionGate(base), true);
  assert.equal(completionButtonReady(base), true);
});

step("project and quiz lessons keep their own rules", () => {
  const project = { activityType: "project", journeyActive: false, ...passedCode, masteryPassed: false };
  assert.equal(completionGate({ ...project, reflection: "x".repeat(projectReflectionMinimum) }), true);
  assert.equal(completionGate({ ...project, reflection: "x".repeat(projectReflectionMinimum - 1) }), false);
  assert.equal(
    completionGate({ activityType: "quiz", workChecked: false, practiceCorrect: false, quizPassed: true, journeyActive: false, masteryPassed: false, reflection: "" }),
    true,
    "a passed quiz must still complete.",
  );
  assert.equal(
    completionGate({ activityType: "quiz", workChecked: true, practiceCorrect: true, quizPassed: false, journeyActive: true, masteryPassed: true, reflection: "x".repeat(20) }),
    false,
    "an unpassed quiz must not complete.",
  );
});

step("a scripted project lesson still needs the fresh task on the button", () => {
  const gate = { activityType: "project", journeyActive: true, ...passedCode, masteryPassed: false, reflection: "x".repeat(projectReflectionMinimum) };
  assert.equal(completionGate(gate), true, "the save path keeps the project rule.");
  assert.equal(completionButtonReady(gate), false, "the button must not offer completion without the fresh task.");
});

console.log("fresh task evaluation and error recovery");

step("every fresh task fails on its starter and passes on its worked solution", () => {
  for (const { script } of scriptedLessons) {
    const starter = evaluateMasteryChecks(script.mastery.checks, script.mastery.starterFiles);
    assert.equal(starter.length, script.mastery.checks.length);
    assert(starter.every((result) => result.passed === false), `${script.lessonId} starter already passes a check.`);
    assert.equal(masteryResultSummary(true, starter), "Not there yet. Repair one requirement and check again.");
    const solved = evaluateMasteryChecks(script.mastery.checks, script.mastery.workedSolution);
    assert(solved.every((result) => result.passed), `${script.lessonId} worked solution fails a check.`);
    assert.equal(masteryResultSummary(true, solved), "The fresh task passes. Explain it in your own words to finish.");
    assert.equal(masteryResultSummary(false, []), "", "nothing may be announced before a check runs.");
  }
});

step("repairing one requirement passes only that requirement", () => {
  const headings = lessonScripts.find((script) => script.lessonId === "ages-13-15-structure-headings");
  const headingPartial = {
    ...headings.mastery.starterFiles,
    html: "<main>\n  <h1>Lost and found</h1>\n  <p>Where to look</p>\n  <p>If you find an item</p>\n</main>",
  };
  assert.deepEqual(
    evaluateMasteryChecks(headings.mastery.checks, headingPartial).map((result) => result.passed),
    [true, false, false],
    "only the repaired heading requirement should pass.",
  );
  const flex = lessonScripts.find((script) => script.lessonId === "ages-13-15-responsive-flex");
  const flexPartial = { ...flex.mastery.starterFiles, css: ".tags { display: flex; }" };
  assert.deepEqual(
    evaluateMasteryChecks(flex.mastery.checks, flexPartial).map((result) => result.passed),
    [true, false, false, false],
    "only display: flex should pass at this stage.",
  );
});

step("an invalid check pattern fails closed instead of throwing", () => {
  const results = evaluateMasteryChecks(
    [{ file: "html", label: "broken pattern", pattern: "(" }],
    { html: "<h1>anything</h1>", css: "", javascript: "" },
  );
  assert.deepEqual(results, [{ label: "broken pattern", passed: false }]);
});

step("the editable files always offer a file to edit", () => {
  assert.deepEqual(masteryEditorFiles(["css"]), ["css"]);
  assert.deepEqual(masteryEditorFiles([]), ["html"]);
});

step("preview errors are deduplicated, kept newest last and capped", () => {
  let errors = [];
  errors = appendPreviewError(errors, "ReferenceError: item is not defined");
  assert.deepEqual(errors, ["ReferenceError: item is not defined"]);
  errors = appendPreviewError(errors, "ReferenceError: item is not defined");
  assert.equal(errors.length, 1, "a repeated runtime error was shown twice.");
  for (const message of ["a", "b", "c", "d"]) errors = appendPreviewError(errors, message);
  assert.equal(errors.length, 4);
  assert.deepEqual(errors, ["a", "b", "c", "d"], "the newest errors were not kept.");
  assert.deepEqual(appendPreviewError(errors, ""), errors, "an empty message must not be recorded.");
});

step("a repaired script recovers: the failure clears and the checks pass", () => {
  const loopScript = lessonScripts.find((script) => script.lessonId === "javascript-logic-loops");
  assert(loopScript, "the loops script is missing.");
  const starter = evaluateMasteryChecks(loopScript.mastery.checks, loopScript.mastery.starterFiles);
  assert(starter.some((result) => !result.passed), "the starter must not pass.");
  const wrongVariable = { ...loopScript.mastery.workedSolution, javascript: loopScript.mastery.workedSolution.javascript.replace("textContent = time", "textContent = item") };
  const failed = evaluateMasteryChecks(loopScript.mastery.checks, wrongVariable);
  assertEqualLabels(failed.filter((result) => !result.passed), ["The item shows the current time"]);
  const errorState = appendPreviewError([], "ReferenceError: time is not defined");
  assert.equal(errorState.length, 1, "the runtime error was not recorded.");
  const repaired = evaluateMasteryChecks(loopScript.mastery.checks, { ...loopScript.mastery.workedSolution });
  assert(repaired.every((result) => result.passed), "the repair did not pass.");
  assert.equal(masteryResultSummary(true, repaired).startsWith("The fresh task passes"), true);
});

step("the heading lesson's two-section requirement accepts a real outline", () => {
  const lesson = lessonsById.get("ages-13-15/ages-13-15-structure-headings");
  const requirement = lesson.tests.find((test) => test.label === "Has two section headings");
  assert(requirement, "the headings lesson lost its two-section requirement.");
  const expression = new RegExp(requirement.pattern, "i");
  assert.equal(expression.test(lesson.starterFiles.html), false, "the starter already satisfies the requirement.");
  assert.equal(expression.test("<h1>Learning Library</h1>\n<h2>Only one</h2>"), false, "one section heading satisfied a two-section requirement.");
  assert.equal(
    expression.test("<main>\n  <h1>Learning Library</h1>\n  <h2>New resources</h2>\n  <h2>Popular topics</h2>\n  <h3>Web development</h3>\n</main>"),
    true,
    "a plain two-heading outline must satisfy the requirement.",
  );
  assert.equal(
    expression.test("<main>\n  <h1>Learning Library</h1>\n  <section><h2>New resources</h2></section>\n  <section><h2>Popular topics</h2></section>\n</main>"),
    true,
    "an outline with each heading inside its own section must satisfy the requirement.",
  );
  assert.equal(expression.test("<h1>Learning Library</h1>\n<h2>New resources\n<h2>Popular topics"), false, "unclosed headings must not satisfy the requirement.");
});

console.log("guidance defaults and the per-lesson override");

step("each register gets its documented default guidance", () => {
  const expectations = { "ages-10-12": "guided", "ages-13-15": "balanced", "ages-16-18": "independent", adults: "balanced" };
  for (const [courseId, mode] of Object.entries(expectations)) {
    assert.equal(initialGuidance(courseId, `${courseId}-structure-headings`), mode, `${courseId} defaulted to the wrong mode.`);
  }
});

function withStorage(storage) {
  const previous = globalThis.window;
  globalThis.window = { localStorage: storage };
  return () => {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  };
}

step("a learner override is stored per lesson and wins over the course default", () => {
  const store = new Map();
  const restore = withStorage({
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  });
  try {
    writeGuidanceOverride("ages-13-15-structure-headings", "guided");
    assert.equal(store.get(`${guidanceStoragePrefix}ages-13-15-structure-headings`), "guided");
    assert.equal(readGuidanceOverride("ages-13-15-structure-headings"), "guided");
    assert.equal(initialGuidance("ages-13-15", "ages-13-15-structure-headings"), "guided");
    assert.equal(readGuidanceOverride("another-lesson"), null, "an override must not leak between lessons.");
  } finally {
    restore();
  }
});

step("a corrupt or blocked storage falls back to the course default without throwing", () => {
  const restore = withStorage({
    getItem: () => "impossible-mode",
    setItem: () => {},
  });
  try {
    assert.equal(readGuidanceOverride("ages-13-15-responsive-flex"), null);
    assert.equal(initialGuidance("ages-16-18", "ages-16-18-responsive-flex"), "independent");
  } finally {
    restore();
  }
  const throwingRestore = withStorage({
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  });
  try {
    assert.equal(readGuidanceOverride("any"), null);
    assert.doesNotThrow(() => writeGuidanceOverride("any", "guided"));
    assert.equal(initialGuidance("ages-10-12", "any"), "guided");
  } finally {
    throwingRestore();
  }
  assert.equal(readGuidanceOverride("no-window"), null, "outside a browser there is no override.");
});

step("the interface wires the tested rules instead of restating them", () => {
  const app = fs.readFileSync(path.join(root, "components/LearningApp.tsx"), "utf8");
  const journey = fs.readFileSync(path.join(root, "components/LessonJourney.tsx"), "utf8");
  assert(app.includes("completionGate(") && app.includes("completionButtonReady("), "LearningApp does not use the tested completion rule.");
  assert(app.includes("hintGateOpen(") && app.includes("nextHintIndex("), "LearningApp does not use the tested hint pacing.");
  assert(journey.includes("evaluateMasteryChecks(") && journey.includes("visibleRequirements("), "LessonJourney does not use the tested rules.");
});

const total = passed.length;
console.log(`\nlesson journey: ${total} checks passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
