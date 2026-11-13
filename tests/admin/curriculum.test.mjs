#!/usr/bin/env node
/*
 * The curriculum index, asserted against the real content.
 *
 * The owner must be able to open every lesson that exists, in every age pathway, with the
 * answer key present - without a learner gate. These checks prove the index covers the
 * catalogue, that keys are unique and reversible, and that a lesson which would be locked in
 * learner mode still opens here.
 */

import assert from "node:assert/strict";
import { courses } from "../../lib/course-catalog.ts";
import { designCourses } from "../../lib/design-course.ts";
import { adminLessonByKey, adminLessonIndex, adminPathways, adminUnit } from "../../lib/admin-curriculum.ts";

let checks = 0;
const failing = [];

function check(label, body) {
  checks += 1;
  try {
    body();
    console.log(`  ok   ${label}`);
  } catch (error) {
    failing.push(label);
    console.log(`  FAIL ${label}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const pathways = adminPathways();
const index = adminLessonIndex();

console.log("admin curriculum: coverage");
check("every coding pathway is indexed", () => {
  const coding = pathways.filter(pathway => pathway.kind === "coding").map(pathway => pathway.id);
  assert.deepEqual(coding.sort(), Object.keys(courses).sort());
});
check("every design age band is indexed separately", () => {
  const design = pathways.filter(pathway => pathway.kind === "design").map(pathway => pathway.id);
  assert.deepEqual(design.sort(), designCourses.map(course => `design:${course.adaptedFor}`).sort());
});
check("the four age pathways named in the brief are present", () => {
  for (const id of ["ages-10-12", "ages-13-15", "ages-16-18", "adults"]) {
    assert.ok(pathways.some(pathway => pathway.id === id), `${id} must be indexed`);
  }
});
check("a coding pathway carries a final assessment unit", () => {
  for (const pathway of pathways.filter(candidate => candidate.kind === "coding")) {
    assert.ok(pathway.units.some(unit => unit.id === "final-assessment"), `${pathway.id} must expose the final assessment`);
  }
});
check("the index holds every lesson of every pathway", () => {
  const expected = pathways.reduce((total, pathway) => {
    return total + pathway.units.reduce((unitTotal, unit) => unitTotal + unit.lessonCount, 0);
  }, 0);
  assert.equal(index.length, expected, "the flat index must hold one entry per advertised lesson");
  assert.ok(index.length > 100, `expected a substantial catalogue, saw ${index.length}`);
});

console.log("admin curriculum: keys and lookups");
check("every lesson key is unique", () => {
  const keys = index.map(entry => entry.key);
  assert.equal(new Set(keys).size, keys.length);
});
check("every key can be resolved back to the same lesson", () => {
  for (const entry of index) {
    const resolved = adminLessonByKey(entry.key);
    assert.ok(resolved, `${entry.key} must resolve`);
    assert.equal(resolved.lesson.id, entry.lesson.id);
    assert.equal(resolved.pathwayId, entry.pathwayId);
    assert.equal(resolved.unitIndex, entry.unitIndex);
  }
});
check("a design key with a colon in the pathway id resolves", () => {
  const design = index.find(entry => entry.pathwayId === "design:ages-10-12");
  assert.ok(design, "a design lesson must be indexed");
  const resolved = adminLessonByKey(design.key);
  assert.equal(resolved?.pathwayId, "design:ages-10-12");
});
check("an unknown key resolves to nothing rather than throwing", () => {
  assert.equal(adminLessonByKey("not-a-real-key"), null);
  assert.equal(adminLessonByKey("ages-10-12:99:missing"), null);
  assert.equal(adminLessonByKey(""), null);
});

console.log("admin curriculum: the content a reviewer needs");
check("coding lessons carry notes, an example and requirements", () => {
  const coding = index.filter(entry => entry.kind === "coding" && ["challenge", "project"].includes(entry.lesson.type));
  assert.ok(coding.length > 40, `expected many coding lessons, saw ${coding.length}`);
  const missing = coding.filter(entry => entry.lesson.notes.length === 0 || entry.lesson.requirements.length === 0);
  assert.deepEqual(missing.map(entry => entry.key).slice(0, 5), [], "no coding lesson may lose its notes or requirements");
});
check("the quiz lessons expose questions with an answer index and an explanation", () => {
  const quizzes = index.filter(entry => entry.lesson.type === "quiz");
  assert.ok(quizzes.length >= 4, "each coding pathway should have quiz lessons");
  for (const entry of quizzes) {
    assert.ok(entry.lesson.questions.length > 0, `${entry.key} must carry its questions`);
    for (const question of entry.lesson.questions) {
      assert.ok(Number.isInteger(question.correctIndex));
      assert.ok(question.options.length >= 3);
      assert.ok(question.explanation.length > 0);
    }
  }
});
check("the final assessment question bank is openable", () => {
  const final = index.find(entry => entry.lesson.id.endsWith("-final-knowledge"));
  assert.ok(final, "the final knowledge assessment must be indexed");
  assert.ok(final.lesson.questions.length >= 5, "the final assessment must expose its questions");
});
check("a lesson that the learner mode locks still opens read-only for the owner", () => {
  /* Later units are gated for a learner until earlier ones are complete. The index must not
   * carry that gate: an owner opens the last unit of every pathway directly. */
  const lastUnits = pathways.map(pathway => {
    const lastIndex = pathway.units[pathway.units.length - 1].index;
    return index.filter(entry => entry.pathwayId === pathway.id && entry.unitIndex === lastIndex);
  });
  assert.equal(lastUnits.length, pathways.length);
  for (const unit of lastUnits) assert.ok(unit.length > 0, "the last unit must be openable");
});
check("unit lookup refuses out-of-range indices", () => {
  assert.equal(adminUnit("ages-10-12", -1), null);
  assert.equal(adminUnit("ages-10-12", 999), null);
  assert.equal(adminUnit("not-a-pathway", 0), null);
});

if (failing.length > 0) {
  console.error(`\nadmin curriculum: ${failing.length} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\nadmin curriculum: all ${checks} checks passed`);
