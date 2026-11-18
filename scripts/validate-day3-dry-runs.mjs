/*
 * The Day 3 dry-run contract.
 *
 * The dry runs themselves need a running server and a real local database, so they are an
 * end-to-end suite rather than a `check` step. What can be checked without a server is that
 * the suite exists, that it is wired into the one command the gate names, that it still
 * covers every pathway and every situation the gate requires, and that it cannot quietly
 * stop proving them.
 *
 * These checks are deliberately about the harness, because a harness that can pass without
 * running an assertion is worse than no harness at all.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import { transferProjectBank, transferContractIssues } from "../lib/transfer-projects.ts";
import { certificateLevelFor } from "../lib/certification.ts";

const root = resolve(import.meta.dirname, "..");
const passed = [];
const failed = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed.push(name);
    console.log(`  ok   ${name}`);
  } else {
    failed.push(detail ? `${name}: ${detail}` : name);
    console.log(`  FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

function read(relativePath) {
  const full = resolve(root, relativePath);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

const suitePath = "scripts/e2e-dry-runs.mjs";
const suite = read(suitePath);
check("the dry-run suite exists", suite.length > 0, `${suitePath} is missing or empty`);

/* ------------------------------------------------------------- wiring --- */

const runner = read("scripts/e2e-all.sh");
const packageJson = JSON.parse(read("package.json"));
check(
  "the dry runs run inside the one end-to-end command",
  runner.includes("scripts/e2e-dry-runs.mjs"),
  "scripts/e2e-all.sh does not invoke the dry-run suite, so `npm run test:e2e` would skip it",
);
check(
  "the end-to-end command is the project's own",
  packageJson.scripts?.["test:e2e"] === "bash scripts/e2e-all.sh",
  "package.json test:e2e no longer runs scripts/e2e-all.sh",
);

/* ------------------------------------------------------- every pathway --- */

for (const courseId of Object.keys(courses)) {
  check(
    `the dry runs cover the ${courseId} pathway`,
    suite.includes(`"${courseId}"`),
    `the suite does not name ${courseId}, so that pathway is never walked`,
  );
  const bank = transferProjectBank(courseId);
  const issues = transferContractIssues(bank);
  check(
    `the ${courseId} transfer bank still meets its contract`,
    issues.length === 0,
    issues.join("; "),
  );
  const changedBrief = bank.scaffolds.find((level) => level.id === "changed-brief");
  check(
    `the ${courseId} bank requires the changed requirement after a working version`,
    Boolean(changedBrief && changedBrief.evidence.includes("changed-requirement") && changedBrief.evidence.includes("independent-start")),
    "the changed-brief level no longer requires the changed-requirement and independent-start evidence",
  );
  check(
    `the ${courseId} pathway has a reviewed certificate level`,
    certificateLevelFor(courseId) !== null,
    `no certificate level is defined for ${courseId}, so its dry run could never certify`,
  );
}

/* ------------------------------------------------------- the situations --- */

const situations = [
  ["an independent start", /independent start/],
  ["a failed first attempt", /not_passed_yet/],
  ["a revision plan with one first action", /firstAction/],
  ["the retake gate refusing while a requirement is outstanding", /409/],
  ["readiness proved one option at a time", /solveReadiness/],
  ["a corrected retry on a different form", /notEqual\(retaken\.body\.attempt\.formVariant/],
  ["the retry scoring above the failure from stored rows", /second\.awarded > first\.awarded/],
  ["work surviving a device transfer", /\/api\/transfer\/claim/],
  ["a one-time code refusing a replay", /replay\.status, 410/],
  ["the certificate staying ineligible without the final assessment", /missing\.map\(\(gate\) => gate\.id\)/],
  ["the certificate issue being refused", /issue\.status, 403/],
  ["the workspace refusing an unsigned identity", /answered \$\{anonymous\.status\}/],
  ["each pilot role kept inside its scope", /workspaceFor\("outsider"\)/],
  ["a role refused an action outside its scope", /an administrator enrolled a learner/],
  ["one durable enrolment row across revoke and reactivate", /reactivate/],
];

for (const [name, pattern] of situations) {
  check(`the dry runs still prove ${name}`, pattern.test(suite), `no assertion matches ${pattern}`);
}

/* ------------------------------------------------------ harness honesty --- */

check(
  "the recorder cannot silently accept a step body",
  suite.includes('if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");'),
  "the check() guard is gone, so a step body could be recorded as passed without running",
);
check(
  "the suite refuses to run without a server",
  suite.includes("No KidyCode server answered") && suite.includes("Start it before running the dry runs"),
  "the suite can start without a server and would report failures as product defects",
);
check(
  "the suite refuses a server that is not KidyCode",
  suite.includes("is not the KidyCode app"),
  "an unrelated server on the port would be walked as if it were KidyCode",
);
check(
  "the suite neither writes nor moves a mark itself",
  !/INSERT INTO assessment_attempts|UPDATE assessment_attempts|INSERT INTO assessment_item_results|INSERT INTO assessment_credentials/.test(suite),
  "the suite writes assessment rows, so its marks would not be the server's",
);
check(
  "every dry-run learner is created fresh, so counts cannot drift between runs",
  /function kidName\(prefix\)/.test(suite) && /newLearner\(/.test(suite) && !/nickname: "DryRun"/.test(suite),
  "a fixed learner identity would carry state from a previous run",
);
check(
  "the suite reads the answer key from the reviewed bank, not from a response",
  /answerKey\(courseId\)/.test(suite) && /contentFor\(courseId\)/.test(suite),
  "the suite guesses answers instead of reading the bank the server marks from",
);
check(
  "the pathway list is built from the course catalogue",
  /courses\[courseId\]/.test(suite) && /const pathways = \[/.test(suite),
  "the suite hardcodes course facts instead of reading the catalogue",
);
check(
  "the suite writes a report whether it passes or fails",
  /checks passed, \$\{failures\.length\} failed/.test(suite) && /process\.exitCode = 1/.test(suite),
  "a failing run would end without a total or a non-zero exit",
);
check(
  "the dry-run copy uses no em dash",
  !suite.includes("\u2014"),
  "the suite copy contains an em dash",
);

console.log(`\nday 3 dry-run contract: ${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const failure of failed) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
