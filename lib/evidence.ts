import type { StruggleEntry } from "@/lib/tutor";
import { MAX_REQUESTS_PER_LESSON, MAX_STRUGGLES } from "@/lib/tutor";

/*
 * Every read and write in this module is scoped to one authenticated learner id.
 * The update statement itself enforces the rules that protect a learner's
 * mastery: counters only rise, milestone flags are set once, and lesson
 * completion is recorded a single time.
 */

export const MAX_ATTEMPTS_PER_LESSON = 999;
export const MAX_INDEPENDENT_CORRECTIONS = 999;

export type LessonEvidence = {
  lessonId: string;
  attempts: number;
  successfulChecks: number;
  hintsRequested: number;
  mastery: number;
  struggles: StruggleEntry[];
  independentCorrections: number;
  lastInterventionLevel: number;
  interventionPending: boolean;
  codePassed: boolean;
  quickCheckPassed: boolean;
  bestQuizScore: number;
  completedAt: string | null;
  lastActivityAt: string;
};

type EvidenceRow = {
  lessonId: string;
  attempts: number;
  successfulChecks: number;
  hintsRequested: number;
  mastery: number;
  struggleJson: string;
  independentCorrections: number;
  lastInterventionLevel: number;
  interventionPending: number;
  codePassedAt: string | null;
  quickCheckPassedAt: string | null;
  bestQuizScore: number;
  completedAt: string | null;
  lastActivityAt: string;
};

/* Stored labels are untrusted input as far as this module is concerned, so the
 * shape, count and length are all checked again on the way out. */
export function parseStruggles(value: string): StruggleEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const entries: StruggleEntry[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as { concept?: unknown; label?: unknown; fails?: unknown };
    if (typeof record.concept !== "string" || typeof record.label !== "string") continue;
    const fails = typeof record.fails === "number" && Number.isFinite(record.fails) ? Math.floor(record.fails) : 0;
    entries.push({
      concept: record.concept.slice(0, 60),
      label: record.label.slice(0, 160),
      fails: Math.max(0, Math.min(fails, 99)),
    });
    if (entries.length >= MAX_STRUGGLES) break;
  }
  return entries;
}

function toEvidence(row: EvidenceRow): LessonEvidence {
  return {
    lessonId: row.lessonId,
    attempts: row.attempts,
    successfulChecks: row.successfulChecks,
    hintsRequested: row.hintsRequested,
    mastery: row.mastery,
    struggles: parseStruggles(row.struggleJson),
    independentCorrections: row.independentCorrections,
    lastInterventionLevel: row.lastInterventionLevel,
    interventionPending: Boolean(row.interventionPending),
    codePassed: Boolean(row.codePassedAt),
    quickCheckPassed: Boolean(row.quickCheckPassedAt),
    bestQuizScore: row.bestQuizScore,
    completedAt: row.completedAt,
    lastActivityAt: row.lastActivityAt,
  };
}

const evidenceColumns = `lesson_id AS lessonId, attempts, successful_checks AS successfulChecks,
  hints_requested AS hintsRequested, mastery, struggle_json AS struggleJson,
  independent_corrections AS independentCorrections, last_intervention_level AS lastInterventionLevel,
  intervention_pending AS interventionPending, code_passed_at AS codePassedAt,
  quick_check_passed_at AS quickCheckPassedAt, best_quiz_score AS bestQuizScore,
  completed_at AS completedAt, last_activity_at AS lastActivityAt`;

export async function loadLessonEvidence(
  database: D1Database,
  learnerId: string,
  lessonId: string,
): Promise<LessonEvidence | null> {
  const row = await database
    .prepare(`SELECT ${evidenceColumns} FROM lesson_evidence WHERE learner_id = ? AND lesson_id = ?`)
    .bind(learnerId, lessonId)
    .first<EvidenceRow>();
  return row ? toEvidence(row) : null;
}

export async function loadLearnerEvidence(database: D1Database, learnerId: string): Promise<LessonEvidence[]> {
  const rows = await database
    .prepare(`SELECT ${evidenceColumns} FROM lesson_evidence WHERE learner_id = ? ORDER BY last_activity_at`)
    .bind(learnerId)
    .all<EvidenceRow>();
  return rows.results.map(toEvidence);
}

export type EvidenceUpdate = {
  /* Counters are passed as increments and merged additively. */
  attemptIncrement: number;
  hintIncrement: number;
  independentCorrectionIncrement: number;
  /* These are absolute values and are merged so they can never go backwards. */
  successfulChecks: number;
  mastery: number;
  bestQuizScore: number;
  lastInterventionLevel: number;
  struggleJson: string;
  interventionPending: boolean;
  /* These are written at most once in the lifetime of the row. */
  codePassedAt: string | null;
  quickCheckPassedAt: string | null;
  completedAt: string | null;
};

/*
 * The conflict clause is the enforcement point. Counters rise but never fall,
 * mastery takes the highest value ever earned, milestone timestamps and the
 * completion date are only ever filled in the first time, and a repeated
 * successful submission therefore cannot raise mastery again.
 */
export async function upsertLessonEvidence(
  database: D1Database,
  learnerId: string,
  lessonId: string,
  update: EvidenceUpdate,
  now: string,
): Promise<void> {
  await database
    .prepare(`INSERT INTO lesson_evidence
      (learner_id, lesson_id, attempts, successful_checks, hints_requested, mastery,
       struggle_json, independent_corrections, last_intervention_level, intervention_pending,
       code_passed_at, quick_check_passed_at, best_quiz_score, completed_at, created_at, last_activity_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (learner_id, lesson_id) DO UPDATE SET
        attempts = MIN(lesson_evidence.attempts + excluded.attempts, ${MAX_ATTEMPTS_PER_LESSON}),
        successful_checks = MAX(lesson_evidence.successful_checks, excluded.successful_checks),
        hints_requested = MIN(lesson_evidence.hints_requested + excluded.hints_requested, ${MAX_REQUESTS_PER_LESSON}),
        mastery = MAX(lesson_evidence.mastery, excluded.mastery),
        struggle_json = excluded.struggle_json,
        independent_corrections = MIN(lesson_evidence.independent_corrections + excluded.independent_corrections, ${MAX_INDEPENDENT_CORRECTIONS}),
        last_intervention_level = MAX(lesson_evidence.last_intervention_level, excluded.last_intervention_level),
        intervention_pending = excluded.intervention_pending,
        code_passed_at = COALESCE(lesson_evidence.code_passed_at, excluded.code_passed_at),
        quick_check_passed_at = COALESCE(lesson_evidence.quick_check_passed_at, excluded.quick_check_passed_at),
        best_quiz_score = MAX(lesson_evidence.best_quiz_score, excluded.best_quiz_score),
        completed_at = COALESCE(lesson_evidence.completed_at, excluded.completed_at),
        last_activity_at = excluded.last_activity_at`)
    .bind(
      learnerId,
      lessonId,
      Math.max(0, Math.min(update.attemptIncrement, MAX_ATTEMPTS_PER_LESSON)),
      Math.max(0, Math.min(update.successfulChecks, 3)),
      Math.max(0, Math.min(update.hintIncrement, MAX_REQUESTS_PER_LESSON)),
      Math.max(0, Math.min(update.mastery, 100)),
      update.struggleJson.slice(0, 2000),
      Math.max(0, Math.min(update.independentCorrectionIncrement, MAX_INDEPENDENT_CORRECTIONS)),
      Math.max(0, Math.min(update.lastInterventionLevel, 3)),
      update.interventionPending ? 1 : 0,
      update.codePassedAt,
      update.quickCheckPassedAt,
      Math.max(0, Math.min(update.bestQuizScore, 5)),
      update.completedAt,
      now,
      now,
    )
    .run();
}

export type InterventionRecord = {
  level: number;
  focus: string;
  requirements: string[];
  source: "nudge" | "check" | "quickcheck" | "quiz";
};

/* Tutoring history keeps the requirement labels that were missed and the level
 * of support given. It never receives the learner's code. */
export async function insertIntervention(
  database: D1Database,
  learnerId: string,
  lessonId: string,
  intervention: InterventionRecord,
  now: string,
): Promise<string> {
  const id = crypto.randomUUID();
  await database
    .prepare(`INSERT INTO tutor_interventions
      (id, learner_id, lesson_id, level, focus, requirement_json, source, resolved_independently, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`)
    .bind(
      id,
      learnerId,
      lessonId,
      Math.max(1, Math.min(intervention.level, 3)),
      intervention.focus.slice(0, 120),
      JSON.stringify(intervention.requirements.slice(0, 6).map((label) => label.slice(0, 160))),
      intervention.source,
      now,
    )
    .run();
  return id;
}

/* A learner who fixes the problem after support, without asking for more
 * support in between, is credited with an independent correction. */
export async function markLatestInterventionIndependent(
  database: D1Database,
  learnerId: string,
  lessonId: string,
): Promise<void> {
  await database
    .prepare(`UPDATE tutor_interventions SET resolved_independently = 1
      WHERE id = (
        SELECT id FROM tutor_interventions
        WHERE learner_id = ? AND lesson_id = ? AND resolved_independently = 0
        ORDER BY created_at DESC LIMIT 1
      )`)
    .bind(learnerId, lessonId)
    .run();
}

export async function loadRecentInterventions(
  database: D1Database,
  learnerId: string,
  lessonId: string,
  limit = 20,
): Promise<Array<{ level: number; focus: string; source: string; resolvedIndependently: boolean; createdAt: string }>> {
  const rows = await database
    .prepare(`SELECT level, focus, source, resolved_independently AS resolvedIndependently, created_at AS createdAt
      FROM tutor_interventions WHERE learner_id = ? AND lesson_id = ?
      ORDER BY created_at DESC LIMIT ?`)
    .bind(learnerId, lessonId, Math.max(1, Math.min(limit, 50)))
    .all<{ level: number; focus: string; source: string; resolvedIndependently: number; createdAt: string }>();
  return rows.results.map((row) => ({
    level: row.level,
    focus: row.focus,
    source: row.source,
    resolvedIndependently: Boolean(row.resolvedIndependently),
    createdAt: row.createdAt,
  }));
}
