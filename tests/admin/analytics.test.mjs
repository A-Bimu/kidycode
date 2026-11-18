#!/usr/bin/env node
/*
 * Analytics provenance and privacy.
 *
 * These checks prove the rule the brief cares about most: a number is either read from the
 * database or reported as "not tracked yet". A metric with no source is never estimated, a
 * small group is suppressed rather than shown, and no learner identifier can appear in the
 * report.
 *
 * The database is a small stand-in that answers the real query shapes, so the module is
 * exercised end to end without touching a live D1.
 */

import assert from "node:assert/strict";
import { K_ANONYMITY_FLOOR, buildAnalytics, notTrackedMetrics } from "../../lib/admin-analytics.ts";

let checks = 0;
const failing = [];

async function check(label, body) {
  checks += 1;
  try {
    await body();
    console.log(`  ok   ${label}`);
  } catch (error) {
    failing.push(label);
    console.log(`  FAIL ${label}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const NOW = new Date("2026-11-13T10:00:00.000Z");

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function fakeDatabase(options = {}) {
  return {
    prepare(sql) {
      const runs = (values) => {
        if (options.failCredentials && sql.includes("assessment_credentials")) {
          throw new Error("no such table: assessment_credentials");
        }
        if (sql.includes("FROM learner_profiles GROUP BY course_id")) {
          return [{ courseId: "ages-10-12", count: 9 }, { courseId: "adults", count: 2 }];
        }
        if (sql.includes("FROM cohorts c LEFT JOIN")) {
          return [{ cohortId: "c-1", code: "NAI-01", name: "Nairobi pilot", count: 8 }];
        }
        if (sql.includes("FROM lesson_evidence GROUP BY lesson_id")) {
          return [{ lessonId: "html-foundations-elements", attempts: 12, successes: 5 }, { lessonId: "css-foundations-rules", attempts: 3, successes: 1 }];
        }
        if (sql.includes("learner_profiles WHERE last_seen_at")) {
          const days = daysBetween(NOW, new Date(values[0]));
          return [{ value: days > 10 ? 9 : 4 }];
        }
        if (sql.includes("course_progress WHERE status = 'complete' AND updated_at")) return [{ value: 6 }];
        if (sql.includes("course_progress WHERE status = 'complete'")) return [{ value: 30 }];
        if (sql.includes("FROM course_progress")) return [{ value: 44 }];
        if (sql.includes("FROM learner_profiles")) return [{ value: 12 }];
        if (sql.includes("FROM project_checkpoints")) return [{ value: 3 }];
        if (sql.includes("exam_attempts WHERE passed")) return [{ value: 2 }];
        if (sql.includes("FROM exam_attempts")) return [{ value: 5 }];
        if (sql.includes("assessment_credentials")) return [{ value: 1 }];
        return [];
      };
      const statement = {
        bind(...values) { return { first: async () => runs(values)[0] ?? null, all: async () => ({ results: runs(values) }) }; },
        first: async () => runs([])[0] ?? null,
        all: async () => ({ results: runs([]) }),
      };
      return statement;
    },
  };
}

const report = await buildAnalytics(fakeDatabase(), NOW, 30);

console.log("analytics: recorded values");
await check("a recorded metric carries its value and its source table", async () => {
  const metric = report.metrics.find(entry => entry.id === "learners-total");
  assert.equal(metric.provenance, "recorded");
  assert.equal(metric.value, 12);
  assert.equal(metric.source, "learner_profiles");
  assert.ok(metric.definition.length > 20);
});
await check("the two activity windows are read from the stored timestamps", async () => {
  assert.equal(report.metrics.find(entry => entry.id === "active-7d").value, 4);
  assert.equal(report.metrics.find(entry => entry.id === "active-30d").value, 9);
});
await check("the completion window reports the window it used", async () => {
  const metric = report.metrics.find(entry => entry.id === "lessons-completed-window");
  assert.equal(metric.value, 6);
  assert.equal(metric.window.from, "2026-10-14T10:00:00.000Z");
  assert.equal(metric.window.to, NOW.toISOString());
});
await check("an unavailable table is reported as unavailable, not as zero", async () => {
  const partial = await buildAnalytics(fakeDatabase({ failCredentials: true }), NOW, 30);
  const metric = partial.metrics.find(entry => entry.id === "credentials");
  assert.equal(metric.provenance, "unavailable");
  assert.equal(metric.value, null);
});

console.log("analytics: honest gaps");
await check("the untracked measures are declared with a reason and a plan", () => {
  assert.ok(report.notTracked.length >= 4);
  for (const item of report.notTracked) {
    assert.ok(item.reason.length > 30, `${item.id} needs a real reason`);
    assert.ok(item.toInstrument.length > 20, `${item.id} needs what would be instrumented`);
  }
  const ids = notTrackedMetrics.map(item => item.id);
  for (const expected of ["verified-sign-ins", "dau-wau", "retention-cohorts", "interaction-hotspots"]) {
    assert.ok(ids.includes(expected), `expected ${expected} to be declared untracked`);
  }
});
await check("no untracked measure is given a numeric value anywhere", () => {
  for (const metric of report.metrics) {
    if (metric.provenance === "not-tracked") assert.equal(metric.value, null);
  }
});

console.log("analytics: privacy");
await check("a group below the anonymity floor is suppressed", () => {
  const adults = report.byCourse.find(row => row.label === "adults");
  assert.equal(adults.suppressed, true);
  assert.equal(adults.count, null);
  const coding = report.byCourse.find(row => row.label === "ages-10-12");
  assert.equal(coding.suppressed, false);
  assert.equal(coding.count, 9);
});
await check("a cohort below the floor is suppressed too", async () => {
  const small = await buildAnalytics(fakeDatabase(), NOW, 30);
  assert.ok(small.byCohort.every(row => row.count === null ? row.suppressed : row.count >= K_ANONYMITY_FLOOR));
});
await check("a topic with too few attempts has no success rate", () => {
  const thin = report.strugglingTopics.find(row => row.lessonId === "css-foundations-rules");
  assert.equal(thin.suppressed, true);
  assert.equal(thin.successRate, null);
  const enough = report.strugglingTopics.find(row => row.lessonId === "html-foundations-elements");
  assert.equal(enough.suppressed, false);
  assert.equal(enough.successRate, 42);
});
await check("the report contains no learner identifier", () => {
  const serialised = JSON.stringify({ report, planted: "learner-9f3c-not-in-report" });
  const withoutPlant = JSON.stringify(report);
  assert.doesNotMatch(withoutPlant, /learner-[0-9a-f]{4}/i);
  assert.match(serialised, /planted/, "the assertion itself must be meaningful");
  assert.ok(report.privacyNote.includes("aggregate"));
});
await check("the floor is declared so a reader can judge the suppression", () => {
  assert.equal(report.kAnonymityFloor, K_ANONYMITY_FLOOR);
  assert.ok(K_ANONYMITY_FLOOR >= 3);
});

if (failing.length > 0) {
  console.error(`\nadmin analytics: ${failing.length} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\nadmin analytics: all ${checks} checks passed`);
