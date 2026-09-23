#!/usr/bin/env node
/*
 * Validates the code-defence templates.
 *
 * The defence is what establishes independent understanding, so its content has to hold up:
 * every task must be answerable from what the course taught, every predict task must have one
 * genuinely correct option among plausible distractors, and every live change must be decided
 * by a check kind the deterministic grader can actually run. The validator proves its rules can
 * fail before it reports success.
 */

import assert from "node:assert/strict";
import { courses } from "../lib/course-catalog.ts";
import { assessmentContent } from "../lib/assessment/manifest.ts";
import { DEFENCE_TEMPLATES, defenceProblems } from "../lib/assessment/defence/index.ts";

const contents = Object.values(assessmentContent);
const lessonsFor = (courseId) => {
  const ids = courses[courseId].lessons.map((lesson) => lesson.id);
  /* A revision reference is either a full lesson id or the short slug the banks use, which is
   * the last segment of the real id. Both resolve to the same lesson, so both are accepted. */
  return {
    has: (reference) => ids.includes(reference) || ids.some((id) => id.endsWith(`-${reference}`)),
  };
};

let checks = 0;
const sweep = (label, body) => {
  try {
    body();
    checks += 1;
    console.log(`  ok   ${label}`);
  } catch (error) {
    checks += 1;
    console.log(`  FAIL ${label}`);
    console.log(`    ${String(error.message).split("\n")[0]}`);
    process.exitCode = 1;
  }
};

sweep("every course has three reviewed defence templates that hold up", () => {
  const problems = defenceProblems(contents, lessonsFor);
  assert.deepEqual(problems, [], `\n    - ${problems.join("\n    - ")}`);
});

sweep("a predict task with one option is refused", () => {
  const original = DEFENCE_TEMPLATES.find((template) => template.predict.options?.length === 4);
  assert.ok(original, "no template to break");
  const index = DEFENCE_TEMPLATES.indexOf(original);
  DEFENCE_TEMPLATES[index] = { ...original, predict: { ...original.predict, options: ["only one"] } };
  const problems = defenceProblems(contents, lessonsFor);
  DEFENCE_TEMPLATES[index] = original;
  assert.ok(problems.some((problem) => problem.includes("not four")), "a short option list was not reported");
});

sweep("a change task with no requirement is refused", () => {
  const original = DEFENCE_TEMPLATES[0];
  assert.ok(original, "no template to break");
  const index = DEFENCE_TEMPLATES.indexOf(original);
  DEFENCE_TEMPLATES[index] = { ...original, change: { ...original.change, changeRequirement: undefined } };
  const problems = defenceProblems(contents, lessonsFor);
  DEFENCE_TEMPLATES[index] = original;
  assert.ok(problems.some((problem) => problem.includes("change")), "a missing change requirement was not reported");
});

sweep("a task pointing at an untaught lesson is refused", () => {
  const original = DEFENCE_TEMPLATES[0];
  const index = DEFENCE_TEMPLATES.indexOf(original);
  DEFENCE_TEMPLATES[index] = { ...original, explain: { ...original.explain, revision: "lesson-that-does-not-exist" } };
  const problems = defenceProblems(contents, lessonsFor);
  DEFENCE_TEMPLATES[index] = original;
  assert.ok(problems.some((problem) => problem.includes("does not teach")), "a broken lesson link was not reported");
});

for (const content of contents) {
  const owned = DEFENCE_TEMPLATES.filter((template) => template.courseId === content.courseId);
  const tasks = owned.length * 4;
  console.log(`  ok   ${content.courseId}: ${owned.length} defence templates, ${tasks} reviewed tasks`);
}

console.log(`\ncode defence: ${checks} checks, ${DEFENCE_TEMPLATES.length} templates, ${process.exitCode ? "failures above" : "no problems"}`);