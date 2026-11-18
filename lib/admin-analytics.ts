/*
 * Owner analytics, built only from events that are genuinely recorded.
 *
 * The rule this module exists to enforce: a number is either derived from rows that are in
 * the database, or it is reported as "not tracked yet". There is no third option, and no
 * estimate, projection or back-fill ever appears as a measured value. Every metric carries
 * the table it came from and a plain-language definition of what was counted, so the owner
 * can tell where a figure came from without reading SQL.
 *
 * What is recorded today: learner_profiles (created_at, last_seen_at, course_id), course_progress
 * (status, updated_at), lesson_evidence (attempts, successful_checks), project_checkpoints,
 * exam_attempts, assessment_attempts / assessment_credentials, and the institution cohort tables.
 *
 * What is NOT recorded: any sign-in or session log, any page-view or click event, any
 * per-week activity history. Those appear under `notTracked` with the reason and what would
 * have to be instrumented, and they are never guessed at.
 *
 * Privacy: every figure is an aggregate. Individual learners are never named. Any group
 * smaller than the k-anonymity floor is suppressed rather than shown, so a small cohort
 * cannot be used to infer one child's behaviour.
 */

export const K_ANONYMITY_FLOOR = 5;

export type MetricProvenance = "recorded" | "not-tracked" | "unavailable";

export type Metric = {
  id: string;
  label: string;
  provenance: MetricProvenance;
  value: number | string | null;
  unit?: string;
  definition: string;
  source: string;
  window?: { from: string; to: string };
  denominator?: number;
  note?: string;
};

export type NotTrackedMetric = {
  id: string;
  label: string;
  reason: string;
  toInstrument: string;
};

export type BreakdownRow = {
  label: string;
  count: number | null;
  suppressed: boolean;
};

export type AnalyticsReport = {
  generatedAt: string;
  windowDays: number;
  metrics: Metric[];
  byCourse: BreakdownRow[];
  byCohort: BreakdownRow[];
  strugglingTopics: Array<{ lessonId: string; attempts: number; successRate: number | null; suppressed: boolean }>;
  notTracked: NotTrackedMetric[];
  kAnonymityFloor: number;
  privacyNote: string;
};

export const notTrackedMetrics: NotTrackedMetric[] = [
  {
    id: "verified-sign-ins",
    label: "Verified sign-ins",
    reason: "No authentication event is written to the database. The learner session is a signed cookie and a sign-in leaves no row.",
    toInstrument: "A server-side auth_events table (identity type, coarse timestamp, outcome) written only after consent review.",
  },
  {
    id: "dau-wau",
    label: "Daily and weekly active users",
    reason: "Only the most recent activity per learner is stored, so a day-by-day or week-by-week active count cannot be recovered without inventing it.",
    toInstrument: "One activity_event row per learner per active day, with a documented retention period.",
  },
  {
    id: "retention-cohorts",
    label: "Week-over-week retention cohorts",
    reason: "Retention needs an event history keyed to each learner's first week. The database keeps a single last-seen timestamp, not a history.",
    toInstrument: "Daily activity events joined to an enrolment date, aggregated before it leaves the server.",
  },
  {
    id: "interaction-hotspots",
    label: "Hint usage, failed checks, abandoned steps",
    reason: "lesson_evidence stores attempt and success counts per lesson, but no event-level record of a hint opening, a failed check or an abandoned step.",
    toInstrument: "Coarse, consented interaction events tied to a UI element id, aggregated server-side with a minimum group size. Never keystrokes, never mouse movement, never session replay.",
  },
];

type QueryRunner = {
  prepare(query: string): {
    bind(...values: unknown[]): { all<T>(): Promise<{ results?: T[] }>; first<T>(): Promise<T | null> };
    all<T>(): Promise<{ results?: T[] }>;
    first<T>(): Promise<T | null>;
  };
};

async function countOf(runner: QueryRunner, sql: string, values: unknown[] = []): Promise<number | null> {
  try {
    const statement = runner.prepare(sql);
    const bound = values.length > 0 ? statement.bind(...values) : statement;
    const row = await bound.first<{ value: number | null }>();
    return row?.value === null || row?.value === undefined ? 0 : Number(row.value);
  } catch {
    return null;
  }
}

async function rowsOf<T>(runner: QueryRunner, sql: string, values: unknown[] = []): Promise<T[]> {
  try {
    const statement = runner.prepare(sql);
    const bound = values.length > 0 ? statement.bind(...values) : statement;
    const result = await bound.all<T>();
    return result.results ?? [];
  } catch {
    return [];
  }
}

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function suppressed(count: number): { count: number | null; suppressed: boolean } {
  return count < K_ANONYMITY_FLOOR
    ? { count: null, suppressed: true }
    : { count, suppressed: false };
}

export async function buildAnalytics(database: QueryRunner, now: Date = new Date(), windowDays = 30): Promise<AnalyticsReport> {
  const window = { from: daysAgo(now, windowDays), to: now.toISOString() };

  const totalLearners = await countOf(database, "SELECT COUNT(*) AS value FROM learner_profiles");
  const activeRecently = await countOf(database, "SELECT COUNT(*) AS value FROM learner_profiles WHERE last_seen_at >= ?", [daysAgo(now, 7)]);
  const activeMonthly = await countOf(database, "SELECT COUNT(*) AS value FROM learner_profiles WHERE last_seen_at >= ?", [daysAgo(now, 30)]);
  const lessonsCompleted = await countOf(database, "SELECT COUNT(*) AS value FROM course_progress WHERE status = 'complete'");
  const lessonsStarted = await countOf(database, "SELECT COUNT(*) AS value FROM course_progress");
  const completedInWindow = await countOf(
    database,
    "SELECT COUNT(*) AS value FROM course_progress WHERE status = 'complete' AND updated_at >= ?",
    [window.from],
  );
  const checkpoints = await countOf(database, "SELECT COUNT(*) AS value FROM project_checkpoints");
  const examAttempts = await countOf(database, "SELECT COUNT(*) AS value FROM exam_attempts");
  const examPasses = await countOf(database, "SELECT COUNT(*) AS value FROM exam_attempts WHERE passed = 1");
  const credentials = await countOf(database, "SELECT COUNT(*) AS value FROM assessment_credentials");

  const courseRows = await rowsOf<{ courseId: string; count: number }>(
    database,
    "SELECT course_id AS courseId, COUNT(*) AS count FROM learner_profiles GROUP BY course_id ORDER BY count DESC",
  );
  const cohortRows = await rowsOf<{ cohortId: string; code: string | null; name: string | null; count: number }>(
    database,
    "SELECT c.id AS cohortId, c.code AS code, c.name AS name, COUNT(e.learner_id) AS count FROM cohorts c LEFT JOIN cohort_enrolments e ON e.cohort_id = c.id AND e.status = 'active' GROUP BY c.id ORDER BY count DESC",
  );
  const struggleRows = await rowsOf<{ lessonId: string; attempts: number; successes: number }>(
    database,
    "SELECT lesson_id AS lessonId, SUM(attempts) AS attempts, SUM(successful_checks) AS successes FROM lesson_evidence GROUP BY lesson_id ORDER BY attempts DESC LIMIT 25",
  );

  const metrics: Metric[] = [
    {
      id: "learners-total",
      label: "Learner profiles",
      provenance: totalLearners === null ? "unavailable" : "recorded",
      value: totalLearners,
      unit: "learners",
      definition: "Rows in learner_profiles. This is every profile that was ever created, not every learner who signed in recently.",
      source: "learner_profiles",
    },
    {
      id: "active-7d",
      label: "Active in the last 7 days",
      provenance: activeRecently === null ? "unavailable" : "recorded",
      value: activeRecently,
      unit: "learners",
      definition: "Learner profiles whose last recorded activity is within 7 days. This is last activity, not a sign-in: no sign-in is logged.",
      source: "learner_profiles.last_seen_at",
      window,
      note: "Not a DAU figure. See 'not tracked yet' below.",
    },
    {
      id: "active-30d",
      label: "Active in the last 30 days",
      provenance: activeMonthly === null ? "unavailable" : "recorded",
      value: activeMonthly,
      unit: "learners",
      definition: "Learner profiles whose last recorded activity is within 30 days.",
      source: "learner_profiles.last_seen_at",
      window,
    },
    {
      id: "lessons-completed",
      label: "Lesson completions (all time)",
      provenance: lessonsCompleted === null ? "unavailable" : "recorded",
      value: lessonsCompleted,
      unit: "lessons",
      definition: "course_progress rows with status 'complete'. One row per learner and lesson.",
      source: "course_progress",
    },
    {
      id: "lessons-started",
      label: "Lesson rows started (all time)",
      provenance: lessonsStarted === null ? "unavailable" : "recorded",
      value: lessonsStarted,
      unit: "rows",
      definition: "Every course_progress row, whatever its status. The gap between this and completions is how many lessons were opened and left unfinished.",
      source: "course_progress",
    },
    {
      id: "lessons-completed-window",
      label: `Lesson completions in the last ${windowDays} days`,
      provenance: completedInWindow === null ? "unavailable" : "recorded",
      value: completedInWindow,
      unit: "lessons",
      definition: "course_progress rows that turned 'complete' inside the window, taken from the stored updated_at.",
      source: "course_progress.updated_at",
      window,
    },
    {
      id: "project-checkpoints",
      label: "Project checkpoints saved",
      provenance: checkpoints === null ? "unavailable" : "recorded",
      value: checkpoints,
      unit: "checkpoints",
      definition: "Rows in project_checkpoints: a learner finished a project stage and saved it.",
      source: "project_checkpoints",
    },
    {
      id: "final-assessments",
      label: "Final assessment attempts",
      provenance: examAttempts === null ? "unavailable" : "recorded",
      value: examAttempts,
      unit: "attempts",
      definition: "Rows in exam_attempts, with the number that passed beside it.",
      source: "exam_attempts",
      note: examAttempts === null ? undefined : `${examPasses ?? 0} of ${examAttempts} attempts passed.`,
    },
    {
      id: "credentials",
      label: "Credential records issued",
      provenance: credentials === null ? "unavailable" : "recorded",
      value: credentials,
      unit: "credentials",
      definition: "Rows in assessment_credentials. Read-only here: the console never issues one.",
      source: "assessment_credentials",
    },
  ];

  const byCourse: BreakdownRow[] = courseRows.map(row => ({
    label: row.courseId,
    ...suppressed(Number(row.count)),
  }));

  const byCohort: BreakdownRow[] = cohortRows.map(row => {
    const label = row.name || row.code || row.cohortId;
    return { label, ...suppressed(Number(row.count)) };
  });

  const strugglingTopics = struggleRows.map(row => {
    const attempts = Number(row.attempts) || 0;
    const successes = Number(row.successes) || 0;
    if (attempts < K_ANONYMITY_FLOOR) return { lessonId: row.lessonId, attempts, successRate: null, suppressed: true };
    return { lessonId: row.lessonId, attempts, successRate: Math.round((successes / attempts) * 100), suppressed: false };
  });

  return {
    generatedAt: now.toISOString(),
    windowDays,
    metrics,
    byCourse,
    byCohort,
    strugglingTopics,
    notTracked: notTrackedMetrics,
    kAnonymityFloor: K_ANONYMITY_FLOOR,
    privacyNote:
      "Every figure above is an aggregate read from the database. Learners are never named, and any group below the anonymity floor is suppressed. Metrics with no recorded source are listed under 'not tracked yet' and are never estimated.",
  };
}
