import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { courses } from "../lib/course-catalog.ts";
import { buildCompletionRecord, technologiesTaught } from "../lib/completion.ts";
import { buildPortfolio, moduleDetail, readCheckpointFiles, MAX_PORTFOLIO_FILE_CHARS } from "../lib/portfolio.ts";

/*
 * The portfolio and the completion record.
 *
 * The completion rule is tested here as a rule: one calculation, three conditions,
 * no dependence on optional practice, and a completion date that can only come
 * from the evidence the rule requires. The rest checks that the privacy boundary,
 * the safe preview and the print styles are the ones this phase promised.
 */

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const course = courses["ages-10-12"];
const otherCourse = courses["ages-13-15"];

function completedMap(count) {
  const map = new Map();
  course.lessons.slice(0, count).forEach((lesson, index) => {
    map.set(lesson.id, new Date(Date.UTC(2026, 8, 1, 8, index)).toISOString());
  });
  return map;
}

function savedMap(stageIndexes) {
  const map = new Map();
  for (const index of stageIndexes) {
    const stage = course.stages[index];
    map.set(stage.id, new Date(Date.UTC(2026, 8, 2, 8, index)).toISOString());
  }
  return map;
}

const allStages = course.stages.map((_, index) => index);
const passedExam = { score: 9, passed: true, createdAt: "2026-09-03T09:00:00.000Z" };
const failedExam = { score: 3, passed: false, createdAt: "2026-09-03T08:00:00.000Z" };

/* 1. The three conditions, one at a time. */
const empty = buildCompletionRecord(course, { theme: "interest", completedLessons: new Map(), savedModules: new Map(), exams: [] });
assert.equal(empty.complete, false, "An empty course is not complete.");
assert.equal(empty.activities.required, 48, "The course requires 48 activities.");
assert.equal(empty.modules.required, 8, "The course requires eight module versions.");
assert.equal(empty.missing.length, 3, "All three requirements must be listed as missing.");
assert.equal(empty.nextRequirement.kind, "activities", "The first gap must be the activities.");
assert.equal(empty.nextRequirement.label, "Complete 48 more activities", `Unexpected first action: ${empty.nextRequirement.label}`);
assert.equal(empty.completedAt, null, "No completion date may exist before completion.");

const activitiesOnly = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(48), savedModules: new Map(), exams: [] });
assert.equal(activitiesOnly.complete, false, "Activities alone cannot complete the course.");
assert.equal(activitiesOnly.nextRequirement.kind, "modules", "The next gap must be a module version.");
assert.equal(activitiesOnly.nextRequirement.label, "Save the Module 1 project version", `Unexpected next step: ${activitiesOnly.nextRequirement.label}`);

const withoutExam = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(48), savedModules: savedMap(allStages), exams: [] });
assert.equal(withoutExam.complete, false, "The final assessment is required.");
assert.equal(withoutExam.finalAssessment.status, "not-started", "An untaken assessment is not started.");
assert.equal(withoutExam.nextRequirement.label, "Pass the final assessment", "The last requirement must be named.");

const failedOnly = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(48), savedModules: savedMap(allStages), exams: [failedExam] });
assert.equal(failedOnly.complete, false, "A failed assessment cannot complete the course.");
assert.equal(failedOnly.finalAssessment.status, "attempted", "A failed attempt is recorded as attempted.");

/* 11. A failed attempt followed by a passed one satisfies the requirement. */
const afterFailure = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(48), savedModules: savedMap(allStages), exams: [failedExam, passedExam] });
assert.equal(afterFailure.complete, true, "A passed attempt after a failed one must complete the course.");
assert.equal(afterFailure.finalAssessment.status, "passed", "The final assessment must read as passed.");

/* 7. One activity missing keeps the course incomplete. */
const oneMissing = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(47), savedModules: savedMap(allStages), exams: [passedExam] });
assert.equal(oneMissing.complete, false, "47 of 48 activities cannot complete the course.");
assert.equal(oneMissing.nextRequirement.label, "Complete 1 more activity", `Unexpected wording: ${oneMissing.nextRequirement.label}`);

/* 8. One module missing keeps the course incomplete, and the gap named is the
 * earliest one in course order, not whatever the map happened to hold. */
const oneModuleMissing = buildCompletionRecord(course, {
  theme: "interest",
  completedLessons: completedMap(48),
  savedModules: savedMap([0, 1, 3, 4, 5, 6, 7]),
  exams: [passedExam],
});
assert.equal(oneModuleMissing.complete, false, "Seven of eight module versions cannot complete the course.");
assert.equal(oneModuleMissing.nextRequirement.label, "Save the Module 3 project version", `Unexpected module named: ${oneModuleMissing.nextRequirement.label}`);
assert.match(oneModuleMissing.nextRequirement.detail, /Module 3/, "The detail must name the module.");

/* A version saved for another course can never count toward this one. */
const foreignOnly = new Map([[otherCourse.stages[0].id, "2026-09-02T08:00:00.000Z"]]);
const withForeign = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(48), savedModules: foreignOnly, exams: [passedExam] });
assert.equal(withForeign.modules.saved, 0, "A version from another course must not count.");
assert.equal(withForeign.complete, false, "A version from another course must not complete this one.");

/* 10. Complete only when all three hold, with the date taken from the evidence. */
const complete = buildCompletionRecord(course, { theme: "interest", completedLessons: completedMap(48), savedModules: savedMap(allStages), exams: [passedExam] });
assert.equal(complete.complete, true, "All three requirements are met.");
assert.equal(complete.missing.length, 0, "Nothing may be listed as missing.");
assert.equal(complete.nextRequirement, null, "There is no next requirement once complete.");
assert.equal(complete.completedAt, passedExam.createdAt, "The completion date is the latest required evidence.");
assert.equal(complete.recordName, "KidyCode course completion record", "The record must be named plainly.");
assert.equal(complete.projectTitle, "Interest Guide", "The record must name the learner's project.");
assert.equal(complete.activities.completed, 48, "48 activities completed.");
assert.equal(complete.modules.saved, 8, "Eight module versions saved.");
assert.match(complete.statement, /Built and tested a website using HTML, CSS and JavaScript/, `Unexpected statement: ${complete.statement}`);
assert.equal(technologiesTaught(course), "HTML, CSS and JavaScript", "The technologies come from the course itself.");

/* The record must never claim an accreditation. */
for (const banned of ["certificate", "diploma", "accredited", "qualification", "professional certification", "credential"]) {
  assert.equal(read("lib/completion.ts").toLowerCase().includes(banned), false, `The completion module must not claim ${banned}.`);
  assert.equal(read("components/PortfolioPage.tsx").toLowerCase().includes(banned), false, `The portfolio must not claim ${banned}.`);
}

/* Optional practice must never gate completion. Comments are stripped first, so
 * the check reads the code rather than the explanation of it. */
const completionModule = read("lib/completion.ts");
const completionCode = completionModule.replace(/\/\*[\s\S]*?\*\//g, "").toLowerCase();
for (const optional of ["concept_review", "recall", "hint", "intervention", "reviewstreak", "timesfailed", "review"]) {
  assert.equal(completionCode.includes(optional), false, `Completion must not depend on ${optional}.`);
}
assert(completionModule.includes("course.lessons.length") && completionModule.includes("course.stages"), "The rule must read the course itself.");
assert(read("lib/summary.ts").includes("buildCompletionRecord(course, {"), "The progress summary must use the shared calculation.");
assert(read("lib/guardian-view.ts").includes("toGuardianCompletion(summary.completion)"), "The grown-up view must use the shared calculation.");

/* 5 and 13. Stored JSON is read defensively. */
assert.equal(readCheckpointFiles("{not json"), null, "Malformed JSON must be reported as unreadable.");
assert.equal(readCheckpointFiles("null"), null, "A null payload must be reported as unreadable.");
assert.equal(readCheckpointFiles(JSON.stringify({ html: "", css: "", javascript: "" })), null, "An empty version must be reported as unreadable.");
const readable = readCheckpointFiles(JSON.stringify({ html: "<h1>Hi</h1>", css: "h1{}", javascript: "1" }));
assert.equal(readable.html, "<h1>Hi</h1>", "A readable version must come back whole.");
assert.equal(readCheckpointFiles(JSON.stringify({ html: "<h1>Hi</h1>", css: 5, javascript: null })).css, "", "A wrong type must degrade to an empty file.");

/* 3. Modules come back in course order, with the newest row for each. */
const unorderedRows = [
  { stageId: course.stages[3].id, version: 1, projectJson: JSON.stringify({ html: "a", css: "", javascript: "" }), reflection: "third", createdAt: "2026-09-02T09:00:00.000Z" },
  { stageId: course.stages[0].id, version: 1, projectJson: JSON.stringify({ html: "b", css: "", javascript: "" }), reflection: "first", createdAt: "2026-09-02T07:00:00.000Z" },
  { stageId: course.stages[0].id, version: 2, projectJson: JSON.stringify({ html: "c", css: "", javascript: "" }), reflection: "first again", createdAt: "2026-09-02T10:00:00.000Z" },
  { stageId: otherCourse.stages[1].id, version: 1, projectJson: JSON.stringify({ html: "d", css: "", javascript: "" }), reflection: "elsewhere", createdAt: "2026-09-02T11:00:00.000Z" },
];
const portfolio = buildPortfolio(course, { theme: "interest", courseId: course.courseFacts.id }, unorderedRows, { completedLessons: completedMap(48), exams: [passedExam] });
assert.deepEqual(portfolio.modules.map((module) => module.number), [1, 2, 3, 4, 5, 6, 7, 8], "Modules must follow course order.");
assert.equal(portfolio.modules.length, 8, "The portfolio holds no more than the eight course modules.");
assert.equal(portfolio.totals.saved, 2, "Only the course's own readable versions count.");
assert.equal(portfolio.finalBuild.number, 8, "The finished build is the last module.");
assert.equal(portfolio.modules[0].savedAt, "2026-09-02T10:00:00.000Z", "The newest row for a module must win.");

/* A module with a corrupt row is reported, not thrown. */
const corruptRows = [{ stageId: course.stages[0].id, version: 1, projectJson: "{broken", reflection: "", createdAt: "2026-09-02T07:00:00.000Z" }];
const corrupt = buildPortfolio(course, { theme: "interest", courseId: course.courseFacts.id }, corruptRows, { completedLessons: new Map(), exams: [] });
assert.equal(corrupt.modules[0].saved, true, "The row exists, so the module reports as saved.");
assert.equal(corrupt.modules[0].readable, false, "A corrupt version must be reported as unreadable.");
assert.equal(corrupt.totals.saved, 0, "A corrupt version must not count as saved.");

/* 13. A version opens for its own learner, and only when it is readable. */
const detail = moduleDetail(course, unorderedRows, course.stages[0].id);
assert.equal(detail.number, 1, "The opened version must be the module asked for.");
assert.equal(detail.files.html, "c", "The newest readable version must be returned.");
assert.equal(moduleDetail(course, unorderedRows, "not-a-module"), null, "An unknown module must not open.");
assert.equal(moduleDetail(course, unorderedRows, otherCourse.stages[0].id), null, "Another course's module must not open.");
assert.equal(moduleDetail(course, corruptRows, course.stages[0].id), null, "An unreadable version must not open.");
const longRow = [{ stageId: course.stages[0].id, version: 1, projectJson: JSON.stringify({ html: "x".repeat(MAX_PORTFOLIO_FILE_CHARS + 500), css: "", javascript: "" }), reflection: "r", createdAt: "2026-09-02T07:00:00.000Z" }];
const longDetail = moduleDetail(course, longRow, course.stages[0].id);
assert.equal(longDetail.files.html.length, MAX_PORTFOLIO_FILE_CHARS, "A very long file must be bounded.");
assert.equal(longDetail.truncated, true, "A shortened file must say so.");

/* 12 and 18. The privacy boundary. */
const portfolioRoute = read("app/api/portfolio/route.ts");
assert(portfolioRoute.includes("authenticateLearner(request)"), "The portfolio must authenticate the learner.");
assert(!/searchParams\.get\("learnerId"\)/.test(portfolioRoute), "The portfolio must never take an identity from a parameter.");
assert(!/searchParams\.get\("id"\)/.test(portfolioRoute), "The portfolio must never take an identity from a parameter.");
assert(portfolioRoute.includes("courseStageIds.has(row.stageId)"), "Rows from another course must be dropped.");
assert(!/answersJson\s*[,}]/.test(portfolioRoute.replace(/answers_json AS answersJson/g, "")), "Stored answers must not be returned.");
assert(!portfolioRoute.includes("practical_json AS practicalJson"), "Stored practical code must not be read for the response.");
assert(!portfolioRoute.includes("access_hash"), "The portfolio must not read the access hash.");

const guardianView = read("lib/guardian-view.ts");
for (const forbidden of ["projectJson", "reflection", "answers", "practical", "accessHash", "html", "css", "javascript"]) {
  assert(guardianView.includes(`"${forbidden}"`), `The grown-up boundary must name ${forbidden} as forbidden.`);
}

/* 14 and 15. One preview, and the safe permissions only. */
const portfolioPage = read("components/PortfolioPage.tsx");
assert.equal((portfolioPage.match(/<iframe/g) || []).length, 1, "The portfolio must contain exactly one preview frame.");
assert.equal((portfolioPage.match(/srcDoc=/g) || []).length, 1, "Only one preview may be built at a time.");
assert(portfolioPage.includes('sandbox="allow-scripts"'), "The preview must keep the safe sandbox.");
for (const permission of ["allow-same-origin", "allow-popups", "allow-forms", "allow-top-navigation", "allow-downloads", "allow-modals"]) {
  assert(!portfolioPage.includes(permission), `The preview must not grant ${permission}.`);
}
assert(portfolioPage.includes('title={`Module ${detail.number} browser preview`}'), "The preview frame needs a useful title.");
assert(portfolioPage.includes("buildPreview"), "The portfolio must reuse the shared safe preview builder.");
assert(read("lib/preview.ts").includes("export function buildPreview("), "There must be one shared preview builder.");
assert.equal((read("components/LearningApp.tsx").match(/function buildPreview\(/g) || []).length, 0, "The app must not keep its own preview builder.");
assert(read("components/LearningApp.tsx").includes('from "@/lib/preview"'), "The app must import the shared preview builder.");

/* 19. Printing hides the interface and keeps the record. */
const styles = read("app/globals.css");
/* The stylesheet holds more than one print block, so the portfolio rules are asserted against the
 * block that governs the record sheet rather than against everything after the first one. */
const printBlocks = [];
let printCursor = styles.indexOf("@media print");
while (printCursor > -1) {
  const open = styles.indexOf("{", printCursor);
  let depth = 0;
  let end = -1;
  for (let index = open; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    else if (styles[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  if (end < 0) break;
  printBlocks.push(styles.slice(open, end));
  printCursor = styles.indexOf("@media print", end);
}
const printBlock = printBlocks.find((entry) => entry.includes(".record-sheet"));
assert(printBlock, "There must be a print block for the record sheet.");
assert(printBlock.includes("display: none !important"), "Printing must hide interface elements.");
for (const hidden of ["nav", "button", ".course-header", ".portfolio-modules", ".portfolio-actions"]) {
  assert(printBlock.includes(hidden), `Printing must hide ${hidden}.`);
}
assert(printBlock.includes(".record-sheet"), "Printing must keep the record sheet.");
assert(styles.includes(".version-code pre {") && /\.version-code pre \{[^}]*overflow: auto/.test(styles), "Long code must scroll inside its own container.");
assert(styles.includes(".portfolio-module-list"), "The module cards need their own layout.");
/* The record sheet prints on white in black, which is deliberate for a printed page, so those two
 * are the only values allowed besides the palette navy. */
assert(!/#[0-9a-f]{6}\b/i.test(printBlock.replace(/#111936|#000000|#ffffff/gi, "")), "Printing must not introduce a new colour.");
/* Green is decided by the channel values, not by a pattern, so a legitimate navy
 * such as #090f26 is not mistaken for it. */
const greenHits = (styles.match(/#[0-9a-f]{3,6}\b/gi) || []).filter((value) => {
  const hex = value.slice(1);
  const full = hex.length === 3 ? hex.split("").map((character) => character + character).join("") : hex;
  if (full.length !== 6) return false;
  const [red, green, blue] = [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16));
  return green > red + 30 && green > blue + 30;
});
assert.equal(greenHits.length, 0, `The palette must not contain green: ${greenHits.join(", ")}`);
for (const source of [portfolioPage, completionModule, read("lib/portfolio.ts")]) {
  assert(!source.includes("\u2014") && !source.includes("\u2013"), "Interface copy must not use a dash.");
  assert(!/\bgreen\b/i.test(source), "No green colour may enter the interface.");
}

/* 20. Accessibility essentials. */
assert(portfolioPage.includes('aria-labelledby="portfolio-modules-heading"'), "The module list needs an accessible name.");
assert(portfolioPage.includes("aria-live=\"polite\""), "Loading states must be announced.");
assert(portfolioPage.includes("role=\"alert\""), "Errors must be announced.");
assert(portfolioPage.includes("<details>"), "Code must sit behind expandable sections.");
assert(portfolioPage.includes('data-testid="portfolio-back"'), "The version view needs a way back.");

console.log("Validated the portfolio and the completion record: three conditions, one calculation, ordering, defensive reads, the privacy boundary, one safe preview and print styles.");
