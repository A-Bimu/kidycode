import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { courses } from "../lib/course-catalog.ts";
import {
  scaffoldLevelIds,
  transferEvidenceKinds,
  transferContractIssues,
  transferProjectBank,
  transferProjectBanks,
} from "../lib/transfer-projects.ts";

/*
 * The Day 1 transfer-project contract.
 *
 * The gate is that every pathway has a transfer-project contract, and that the contract
 * says something real: a different problem, a different setting, four scaffold levels and
 * the four kinds of transfer evidence. The rule itself lives in
 * transferContractIssues() and this script runs it, so a bank added later is checked by
 * the same function the product would run.
 */

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const courseIds = Object.keys(courses);

assert.equal(courseIds.length, 4, "There are four pathways, so there must be four transfer banks.");
assert.equal(transferProjectBanks.length, 4, `Expected four transfer banks, found ${transferProjectBanks.length}.`);
assert.equal(new Set(transferProjectBanks.map((bank) => bank.id)).size, 4, "Transfer bank ids must be unique.");

for (const courseId of courseIds) {
  const bundle = courses[courseId];
  const bank = transferProjectBank(courseId);

  assert.equal(bank.courseId, courseId, `${courseId} is served by a bank for another pathway.`);
  assert.equal(bank.pathwayTitle, bundle.courseFacts.title, `${courseId} names a pathway title that does not match the course.`);
  assert.equal(bank.ageRange, bundle.courseFacts.ageRange, `${courseId} names an age range that does not match the course.`);

  /* The contract rule, run for real. */
  assert.deepEqual(transferContractIssues(bank), [], `${courseId} has an incomplete transfer contract.`);

  /* Four scaffold levels, ordered, with the four evidence kinds covered. */
  assert.deepEqual(bank.scaffolds.map((level) => level.id), [...scaffoldLevelIds], `${courseId} must carry the four scaffold levels in order.`);
  assert.deepEqual(bank.scaffolds.map((level) => level.order), [1, 2, 3, 4], `${courseId} scaffold order must run 1 to 4.`);
  const covered = new Set(bank.scaffolds.flatMap((level) => level.evidence));
  for (const kind of transferEvidenceKinds) {
    assert(covered.has(kind), `${courseId} has no scaffold level that requires the ${kind} evidence.`);
  }
  assert.equal(Object.keys(bank.evidence).length, transferEvidenceKinds.length, `${courseId} must describe every evidence kind once.`);

  /* A transfer project is a different problem, so it may not reuse the guided project the
   * learner already built, nor another pathway's project. */
  const guidedTitles = new Set(bundle.projectChoices.map((project) => project.title.toLowerCase()));
  for (const project of bank.projects) {
    assert(project.title.length > 4 && project.problem.length > 40, `${project.id} is an unfinished transfer project.`);
    assert(!guidedTitles.has(project.title.toLowerCase()), `${project.id} repeats the guided project ${project.title}.`);
    assert(project.difference.length > 40, `${project.id} must say how it differs from the guided project.`);
  }

  const allTitles = transferProjectBanks.flatMap((candidate) => candidate.projects.map((project) => project.title.toLowerCase()));
  assert.equal(new Set(allTitles).size, allTitles.length, "A transfer project title may not appear in two pathways.");
}

/* The contract module holds rules and public content only: no learner data, no database,
 * and none of the language the product bans. */
const source = read("lib/transfer-projects.ts");
assert(!source.includes("learnerId"), "A transfer contract must not reference a learner.");
assert(!source.includes("server-database") && !source.includes("cloudflare"), "A transfer contract must not touch the database.");
assert(!source.includes("\u2014") && !source.includes("\u2013"), "Transfer contract copy must not use dashes as punctuation.");
assert(!/\bgreen\b/i.test(source), "Transfer contract copy must not use the banned colour name.");
for (const banned of ["guaranteed", "job-ready", "accredited"]) {
  assert(!source.toLowerCase().includes(banned), `Transfer contract copy must not claim ${banned}.`);
}

console.log(
  `Validated ${transferProjectBanks.length} transfer banks, one per pathway, with ${scaffoldLevelIds.length} scaffold levels and ${transferEvidenceKinds.length} evidence kinds each.`,
);
