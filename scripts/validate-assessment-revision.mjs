#!/usr/bin/env node
/*
 * Validates the revision library.
 *
 * Two rules matter most: every concept a bank can mark a learner on must have a revision
 * page, and no revision prompt may repeat another pack's prompt. The validator proves its
 * own rules can fail before it reports success.
 */

import assert from "node:assert/strict";
import { courses } from "../lib/course-catalog.ts";
import { assessmentContent } from "../lib/assessment/manifest.ts";
import { REVISION_PACKS, assessedConcepts, revisionProblems } from "../lib/assessment/revision/index.ts";

const contents = Object.values(assessmentContent);
const lessonsFor = (courseId) => new Set(courses[courseId].lessons.map((lesson) => lesson.id));

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

sweep("every assessed concept has a reachable revision page", () => {
  const problems = revisionProblems(contents, lessonsFor);
  assert.deepEqual(problems, [], `\n    - ${problems.join("\n    - ")}`);
});

sweep("the rules reject a bank concept with no revision page", () => {
  const oneCourse = [contents[0]];
  const withGhost = {
    ...oneCourse[0],
    moduleForms: oneCourse[0].moduleForms.map((form, index) => index === 0
      ? { ...form, knowledge: form.knowledge.map((item, at) => at === 0 ? { ...item, concept: `${oneCourse[0].courseId}:ghost:concept` } : item) }
      : form),
  };
  const problems = revisionProblems([withGhost], lessonsFor);
  assert.ok(problems.some((problem) => problem.includes("ghost:concept")), "a missing page was not reported");
});

sweep("the rules reject a pack whose lesson the course does not teach", () => {
  const original = REVISION_PACKS[0];
  if (!original) return;
  const swapped = { ...original, lessonId: `${original.courseId}-lesson-that-does-not-exist` };
  const key = REVISION_PACKS.indexOf(original);
  REVISION_PACKS[key] = swapped;
  const problems = revisionProblems(contents, lessonsFor);
  REVISION_PACKS[key] = original;
  assert.ok(problems.some((problem) => problem.includes("does not teach")), "a broken lesson link was not reported");
});

sweep("the rules reject a pack with one guided question", () => {
  const original = REVISION_PACKS[0];
  if (!original) return;
  const key = REVISION_PACKS.indexOf(original);
  REVISION_PACKS[key] = { ...original, guided: [original.guided[0]] };
  const problems = revisionProblems(contents, lessonsFor);
  REVISION_PACKS[key] = original;
  assert.ok(problems.some((problem) => problem.includes("not two")), "a short guided set was not reported");
});

for (const content of contents) {
  const assessed = assessedConcepts(content).length;
  const owned = REVISION_PACKS.filter((pack) => pack.courses.includes(content.courseId)).length;
  console.log(`  ok   ${content.courseId}: ${owned} revision pages for ${assessed} assessed concepts`);
}

console.log(`\nrevision library: ${checks} checks, ${REVISION_PACKS.length} packs, ${process.exitCode ? "failures above" : "no problems"}`);
