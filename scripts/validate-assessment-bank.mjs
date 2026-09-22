/*
 * The reviewed content of every course bank, checked against the blueprint and against
 * the real course catalogue.
 *
 * The same rules are proved able to fail: a copy of the bank is broken one rule at a
 * time and the validator must report it. A validator that cannot fail would make a green
 * run worthless.
 *
 *   node --import tsx scripts/validate-assessment-bank.mjs
 */
import assert from "node:assert/strict";
import { bankProblems, blueprintFor, REQUIRED_COURSES } from "../lib/assessment/blueprint.ts";
import { assessmentContent } from "../lib/assessment/manifest.ts";
import { contentFor } from "../lib/assessment/manifest.ts";

const scope = process.env.ASSESSMENT_SCOPE === "complete" ? "complete" : "modules";
let total = 0;
const failures = [];

function sweep(name, body) {
  try {
    body();
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n").slice(0, 5).join(" | ")}`);
  }
}

let coursesWithContent = 0;
for (const courseId of REQUIRED_COURSES) {
  const content = assessmentContent[courseId];
  const available = contentFor(courseId) !== null;
  if (!available) {
    console.log(`  --   ${courseId}: no reviewed content yet (serves 503, which the API suite asserts)`);
    continue;
  }
  coursesWithContent += 1;
  sweep(`${courseId} bank`, () => {
    const problems = bankProblems(content, { scope });
    assert.deepEqual(problems, [], `\n    - ${problems.join("\n    - ")}`);
    const blueprint = blueprintFor(courseId);
    const expectedForms = blueprint.moduleCount * blueprint.formsPerModule;
    assert.equal(content.moduleForms.length, expectedForms, `${courseId} must carry ${expectedForms} module forms.`);
    const knowledge = content.moduleForms.flatMap((form) => form.knowledge);
    const requirements = content.moduleForms.flatMap((form) => form.practical.requirements);
    const mandatory = requirements.filter((requirement) => requirement.mandatory);
    console.log(`  ok   ${courseId}: ${content.moduleForms.length} forms, ${knowledge.length} questions, ${requirements.length} marked requirements, ${mandatory.length} mandatory`);
    total += 1;
  });
}

/* The rest of the suite only means something once every course has content. */
if (coursesWithContent === REQUIRED_COURSES.length) {
  sweep("the four banks use one namespace each", () => {
    const ids = new Set();
    for (const courseId of REQUIRED_COURSES) {
      for (const form of assessmentContent[courseId].moduleForms) {
        assert.ok(form.id.startsWith(`${courseId}-`), `${form.id} is not namespaced to ${courseId}.`);
        assert.ok(!ids.has(form.id), `${form.id} appears twice.`);
        ids.add(form.id);
      }
    }
  });
}

/* ------------------------------------------------ prove the validator can fail ---- */

const reference = assessmentContent[REQUIRED_COURSES.find((courseId) => contentFor(courseId) !== null)];
if (!reference) {
  console.log("\nNo content is present, so the failure proofs are skipped for this run.");
} else {
  const clone = () => JSON.parse(JSON.stringify(reference));
  const proofs = [
    ["a missing form", (b) => { b.moduleForms.splice(0, 1); }, /has 2 forms|not 3/],
    ["a duplicated item id", (b) => { b.moduleForms[1].knowledge[0].id = b.moduleForms[0].knowledge[0].id; }, /reuses the id/],
    ["a wrong mark", (b) => { b.moduleForms[0].knowledge[0].marks = 2; }, /awards 6 knowledge marks|totals/],
    ["a missing answer", (b) => { b.moduleForms[0].knowledge[0].answer = 9; }, /invalid answer/],
    ["a skipped taught lesson", (b) => { b.moduleForms[0].knowledge[0].objective = "not-a-lesson"; }, /does not teach/],
    ["a requirement on an untaught skill", (b) => { b.moduleForms[0].practical.requirements[0].check = { kind: "css-declaration", file: "css", property: "color", value: "colour" }; }, /has not taught yet/],
    ["forms covering different ideas", (b) => { b.moduleForms[1].knowledge[0].concept = `${b.courseId}:${b.moduleForms[1].moduleId}:extra-idea`; }, /same ideas in all three forms/],
    ["a repeated question", (b) => { b.moduleForms[1].knowledge[0].prompt = b.moduleForms[0].knowledge[0].prompt; }, /repeats the question/],
    ["a missing mandatory check", (b) => { for (const form of b.moduleForms) for (const requirement of form.practical.requirements) delete requirement.mandatory; }, /mandatory/],
    ["a banned character", (b) => { b.moduleForms[0].knowledge[0].explanation = `${b.moduleForms[0].knowledge[0].explanation} \u2014 really`; }, /em dash/],
    ["a missing misconception tag", (b) => { b.moduleForms[0].knowledge[0].misconceptions = ["", "", ""]; }, /misconception tag/],
    ["an unequally hard form", (b) => { b.moduleForms[2].difficultyProfile = { foundation: 99, developing: 0, secure: 0, advanced: 0 }; }, /same difficulty profile/],
    ["an undecidable requirement carrying a mark", (b) => {
      b.moduleForms[0].practical.requirements[0].check = { kind: "cannot-verify", reason: "Somebody must look." };
      delete b.moduleForms[0].practical.requirements[0].mandatory;
    }, /hold a mark hostage/],
  ];
  for (const [name, mutate, pattern] of proofs) {
    sweep(`the validator rejects ${name}`, () => {
      const broken = clone();
      mutate(broken);
      const problems = bankProblems(broken, { scope: "modules", requireContent: true });
      assert.ok(problems.length > 0, `${name} produced no problem at all.`);
      const matching = problems.filter((problem) => pattern.test(problem));
      assert.ok(matching.length > 0, `${name} was not reported: got ${problems.join(" | ")}`);
      total += 1;
    });
  }
}

console.log(`\nassessment bank: ${total} course banks and failure proofs passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const failure of failures) console.log(`  - ${failure.split("\n")[0]}`);
  process.exitCode = 1;
}