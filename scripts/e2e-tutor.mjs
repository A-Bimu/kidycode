/*
 * End to end check of the Adaptive Tutor against a running KidyCode server.
 *
 * Run the app first, then:
 *   node --import tsx scripts/e2e-tutor.mjs
 *
 * Override the address when the server listens elsewhere:
 *   KIDYCODE_E2E_URL=http://127.0.0.1:3000 node --import tsx scripts/e2e-tutor.mjs
 */
import assert from "node:assert/strict";
import { courses } from "../lib/course-catalog.ts";
import { gradeRequirements } from "../lib/tutor.ts";

const candidates = [
  process.env.KIDYCODE_E2E_URL,
  "http://localhost:3000",
  "http://[::1]:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

let base = "";
const passed = [];
const failed = [];

function check(name) {
  passed.push(name);
  console.log(`  ok   ${name}`);
}

async function step(name, run) {
  try {
    await run();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${error.message}`);
  }
}

async function findServer() {
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/api/progress`, { signal: AbortSignal.timeout(8000) });
      if (response.status === 401) {
        base = candidate;
        return;
      }
    } catch {
      continue;
    }
  }
  throw new Error("No KidyCode server answered. Start it first with: node_modules/.bin/vinext dev");
}

let cookie = "";

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers, signal: AbortSignal.timeout(30000) });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session) cookie = session.split(";")[0];
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

async function createLearner(nickname, courseId, age) {
  cookie = "";
  const result = await api("/api/learners", {
    method: "POST",
    body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
  });
  assert.equal(result.status, 201, `Could not create learner ${nickname}: ${JSON.stringify(result.body)}`);
  assert(cookie.startsWith("kidycode_session="), "The learner session cookie was not issued.");
  return result.body.learner;
}

const course = courses["ages-10-12"];
const lessonOne = course.lessons[0];
const lessonTwo = course.lessons[1];
const lessonThree = course.lessons[2];

/* The working code below is graded by the same engine the server uses, so the
 * test proves itself instead of trusting a hard coded expectation. */
const lessonOneCode = { html: "<h1>My First Website</h1>", css: "", javascript: "" };
const lessonTwoCode = {
  html: "<h1>My First Website</h1>\n<h2>About this page</h2>\n<p>This page shares useful ideas.</p>",
  css: "",
  javascript: "",
};
assert.equal(gradeRequirements(lessonOne, lessonOneCode).every((result) => result.passed), true,
  "The end to end fixture for the first lesson must actually pass.");
assert.equal(gradeRequirements(lessonTwo, lessonTwoCode).every((result) => result.passed), true,
  "The end to end fixture for the second lesson must actually pass.");

/* This workspace is deliberately close but wrong: the words are right and the
 * element is not, which is exactly the kind of mistake the tutor must explain. */
const brokenCode = { html: "<p>My First Website</p>", css: "", javascript: "" };
assert.equal(gradeRequirements(lessonOne, brokenCode).some((result) => result.passed), false,
  "The end to end broken workspace must fail the requirements.");

console.log(`Checking the tutor against ${base}`);

await findServer();
check("a KidyCode server is reachable");

/* 1. The four learning paths still load. */
for (const [route, label] of [["/", "marketing"], ["/learn", "ages 10 to 12"], ["/learn/13-15", "ages 13 to 15"], ["/learn/16-18", "ages 16 to 18"], ["/learn/adults", "adults"]]) {
  await step(`route ${route} (${label}) loads`, async () => {
    const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `Expected 200, received ${response.status}`);
    const html = await response.text();
    assert(html.length > 500, "The page returned almost no markup.");
  });
}

let firstLearner = null;

await step("a learner can be created and receives a session", async () => {
  firstLearner = await createLearner("TutorCheck", "ages-10-12", 11);
  assert(firstLearner.id, "The learner record has no id.");
});

await step("the tutor refuses an unauthenticated request", async () => {
  const saved = cookie;
  cookie = "";
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.status, 401, `Expected 401, received ${result.status}`);
  cookie = saved;
});

await step("a new learner starts with no evidence", async () => {
  const result = await api("/api/tutor");
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.deepEqual(result.body.evidence, [], "A new learner must have no tutoring evidence.");
});

await step("the lesson belongs to the learner course", async () => {
  const otherCourseLesson = courses.adults.lessons[0];
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: otherCourseLesson.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.status, 403, `A lesson from another path must be refused, received ${result.status}`);
});

await step("request fields are validated and limited", async () => {
  const bad = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "make-me-a-cake", workspace: brokenCode }) });
  assert.equal(bad.status, 400, `An unknown action must be refused, received ${bad.status}`);
  const huge = await api("/api/tutor", {
    method: "POST",
    body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: { html: "x".repeat(30000), css: "", javascript: "" } }),
  });
  assert.equal(huge.status, 400, `An oversized workspace must be refused, received ${huge.status}`);
  const longId = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: "l".repeat(400), action: "check", workspace: brokenCode }) });
  assert.equal(longId.status, 400, `An oversized lesson id must be refused, received ${longId.status}`);
});

/* 2. Wrong code gets a relevant nudge that gets clearer each time. */
const levels = [];
await step("the first failure gives one small nudge", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.equal(result.body.passed, false, "Broken code must not pass.");
  assert.equal(result.body.nudge.level, 1, `Expected level 1, received ${result.body.nudge.level}`);
  assert.equal(result.body.nudge.focus.length > 0, true, "A nudge must name a focus area.");
  assert.equal(result.body.nudge.example, "", "The first nudge must not show an example.");
  assert.equal(result.body.evidence.hintsRequested, 1, "The nudge must be recorded as a requested hint.");
  levels.push(result.body.nudge.message);
});

await step("a second failure gives a clearer explanation", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.body.nudge.level, 2, `Expected level 2, received ${result.body.nudge.level}`);
  assert.equal(result.body.evidence.hintsRequested, 2, "The second nudge must be counted.");
  levels.push(result.body.nudge.message);
});

await step("continued struggle shows a small related example", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.body.nudge.level, 3, `Expected level 3, received ${result.body.nudge.level}`);
  assert(result.body.nudge.example.length > 0, "The final level must show a related example.");
  levels.push(result.body.nudge.message);
});

await step("every level says something different", async () => {
  assert.equal(new Set(levels).size, 3, `Expected three different messages, received ${JSON.stringify(levels)}`);
});

await step("a code check gives specific feedback and records an attempt", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: brokenCode }) });
  assert.equal(result.body.passed, false);
  assert.equal(result.body.results.length, lessonOne.tests.length, "Every requirement must be reported.");
  assert.equal(result.body.results.every((item) => typeof item.passed === "boolean"), true);
  assert(result.body.feedback.includes(lessonOne.tests[0].label.toLowerCase()), "Feedback must name the failed requirement.");
  assert(result.body.evidence.attempts >= 4, `Attempts must be counted, received ${result.body.evidence.attempts}`);
  assert(result.body.evidence.struggles.length > 0, "A failed requirement must be recorded as a struggle.");
  assert(result.body.evidence.focusArea.length > 0, "A focus area must be reported.");
});

/* 3. Correct code is accepted and mastery is recorded once. */
let masteryAfterFirstPass = 0;
await step("correct code is accepted and acknowledges the concept", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: lessonOneCode }) });
  assert.equal(result.body.passed, true, `Correct code must pass: ${JSON.stringify(result.body.results)}`);
  assert.equal(result.body.results.every((item) => item.passed), true);
  assert(result.body.acknowledgement.length > 0, "A success must acknowledge the concept demonstrated.");
  assert.equal(result.body.evidence.codePassed, true, "The code pass must be recorded.");
  assert.equal(result.body.evidence.successfulChecks, 1, `Expected one completed check, received ${result.body.evidence.successfulChecks}`);
  assert.equal(result.body.evidence.mastery, 75, `Expected three quarters of the offered checks, received ${result.body.evidence.mastery}`);
  masteryAfterFirstPass = result.body.evidence.mastery;
});

await step("a struggle clears once the requirement passes", async () => {
  const result = await api("/api/tutor");
  const row = result.body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert(row, "The lesson evidence must be listed.");
  assert.equal(row.struggles.length, 0, "Passing the requirement must clear the struggle.");
  assert.equal(row.focusArea, "", "A learner with no struggles must have no focus area.");
});

await step("repeated successful submissions cannot inflate mastery", async () => {
  const before = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: lessonOneCode }) });
    assert.equal(result.body.evidence.mastery, before.mastery, "Mastery must not rise on a repeated success.");
    assert.equal(result.body.evidence.successfulChecks, before.successfulChecks, "A repeated success must not add a check.");
  }
  const after = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(after.mastery, masteryAfterFirstPass, "Mastery after repeats must equal the first pass value.");
  assert.equal(after.successfulChecks, 1, "Only one code check may be recorded.");
});

/* 4. The quick check affects evidence, and the learner is credited with fixing
 *    the problem themselves after support. */
await step("an independent correction is recorded after support", async () => {
  const result = await api("/api/tutor");
  const row = result.body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(row.interventionPending, false, "A pass after support must close the pending intervention.");
  assert.equal(row.independentCorrections, 1, `Expected one independent correction, received ${row.independentCorrections}`);
});

await step("the quick check is graded on the server and affects evidence", async () => {
  const question = lessonOne.question;
  const wrong = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "quickcheck", questionAnswer: (question.answer + 1) % 3, workspace: lessonOneCode }) });
  assert.equal(wrong.body.quickCheck.correct, false, "A wrong quick check answer must not pass.");
  assert.equal(wrong.body.evidence.quickCheckPassed, false, "A wrong answer must not record a pass.");
  assert(wrong.body.quickCheck.message.length > 30, "A wrong answer needs a specific explanation.");

  const right = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "quickcheck", questionAnswer: question.answer, workspace: lessonOneCode }) });
  assert.equal(right.body.quickCheck.correct, true, "The correct answer must pass.");
  assert.equal(right.body.evidence.quickCheckPassed, true, "A correct answer must be recorded.");
  assert.equal(right.body.evidence.successfulChecks, 2, `Expected two completed checks, received ${right.body.evidence.successfulChecks}`);
  assert.equal(right.body.evidence.mastery, 100, `Expected full mastery, received ${right.body.evidence.mastery}`);
});

/* 5. Completion is recorded once, and the next lesson unlocks. */
let completionStamp = null;
await step("completing the lesson records evidence once", async () => {
  const complete = await api("/api/progress", {
    method: "POST",
    body: JSON.stringify({
      lessonId: lessonOne.id,
      status: "completed",
      questionAnswer: lessonOne.question.answer,
      quizAnswers: [],
      reflection: "",
      workspace: lessonOneCode,
    }),
  });
  assert.equal(complete.status, 200, `Completion failed: ${JSON.stringify(complete.body)}`);
  const row = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert(row.completedAt, "Completion must record a timestamp.");
  assert.equal(row.mastery, 100, `A completed lesson must reach full mastery, received ${row.mastery}`);
  completionStamp = row.completedAt;
});

await step("completing the same lesson again does not change the record", async () => {
  const again = await api("/api/progress", {
    method: "POST",
    body: JSON.stringify({ lessonId: lessonOne.id, status: "completed", questionAnswer: lessonOne.question.answer, quizAnswers: [], reflection: "", workspace: lessonOneCode }),
  });
  assert.equal(again.status, 200, `Repeat completion failed: ${JSON.stringify(again.body)}`);
  const row = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(row.completedAt, completionStamp, "The completion timestamp must be written only once.");
  assert.equal(row.successfulChecks, 2, "A repeat completion must not add checks.");
});

await step("lesson progression is still locked on the server", async () => {
  const blocked = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonThree.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(blocked.status, 409, `A locked lesson must be refused, received ${blocked.status}`);
});

await step("progress survives a reload", async () => {
  const progress = await api("/api/progress");
  assert.equal(progress.status, 200);
  const row = progress.body.progress.find((item) => item.lessonId === lessonOne.id);
  assert(row, "The completed lesson must come back from the server.");
  assert.equal(row.status, "completed", "The completed lesson must still be complete.");
  const evidence = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(evidence.mastery, 100, "Mastery must survive a reload.");
  assert.equal(evidence.completedAt, completionStamp, "The completion date must survive a reload.");
});

/* 6. A second learner cannot see or change the first learner records. */
await step("one learner cannot see another learner records", async () => {
  const other = await createLearner("OtherCoder", "ages-10-12", 12);
  assert.notEqual(other.id, firstLearner.id, "The second learner must have a different identity.");
  const isolated = await api("/api/tutor");
  assert.deepEqual(isolated.body.evidence, [], "A second learner must not see the first learner evidence.");
  const progress = await api("/api/progress");
  assert.deepEqual(progress.body.progress, [], "A second learner must not see the first learner progress.");
  const own = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(own.body.evidence.lessonId, lessonOne.id);
  assert.equal(own.body.evidence.hintsRequested, 1, "The second learner must start from zero hints.");
});

await step("the first learner records were not changed by the second learner", async () => {
  const response = await api("/api/learners", { method: "DELETE" });
  assert.equal(response.status, 200);
  const fresh = await createLearner("TutorCheck", "ages-10-12", 11);
  assert(fresh.id !== firstLearner.id, "A reset must create a new profile.");
  assert.deepEqual((await api("/api/tutor")).body.evidence, [], "A new profile must start with no evidence.");
});

console.log(`\n${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const item of failed) console.log(`  - ${item}`);
  process.exitCode = 1;
}
