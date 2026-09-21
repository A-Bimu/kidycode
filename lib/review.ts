/*
 * Cross lesson review store.
 *
 * A weak concept is remembered independently of the lesson where it was first
 * missed, so the tutor can come back to it later. Only requirement labels,
 * concept keys and counts are stored. Learner code is never stored here.
 */

export const RETIRE_STREAK = 2;
export const MAX_DUE_ITEMS = 3;
export const MAX_FAILURES = 99;

export type ReviewRow = {
  concept: string;
  label: string;
  lessonId: string;
  timesFailed: number;
  timesRecovered: number;
  reviewStreak: number;
  due: number;
  firstFailedAt: string;
  lastFailedAt: string;
  lastReviewedAt: string | null;
};

export type ReviewEntry = { concept: string; label: string };

const reviewColumns = `concept, label, lesson_id AS lessonId, times_failed AS timesFailed,
  times_recovered AS timesRecovered, review_streak AS reviewStreak, due,
  first_failed_at AS firstFailedAt, last_failed_at AS lastFailedAt,
  last_reviewed_at AS lastReviewedAt`;

/* A missed requirement is remembered against the learner. The lesson where it was
 * first missed is kept, and a repeat failure resets any progress towards
 * retiring it. */
export async function recordConceptFailures(
  database: D1Database,
  learnerId: string,
  lessonId: string,
  entries: ReviewEntry[],
  now: string,
): Promise<void> {
  for (const entry of entries.slice(0, 6)) {
    await database
      .prepare(`INSERT INTO concept_review
        (learner_id, concept, label, lesson_id, times_failed, times_recovered, review_streak, due,
         first_failed_at, last_failed_at, last_reviewed_at)
        VALUES (?, ?, ?, ?, 1, 0, 0, 1, ?, ?, NULL)
        ON CONFLICT (learner_id, concept) DO UPDATE SET
          label = excluded.label,
          times_failed = MIN(concept_review.times_failed + 1, ${MAX_FAILURES}),
          review_streak = 0,
          due = 1,
          last_failed_at = excluded.last_failed_at`)
      .bind(
        learnerId,
        entry.concept.slice(0, 60),
        entry.label.slice(0, 140),
        lessonId.slice(0, 160),
        now,
        now,
      )
      .run();
  }
}

/* Meeting a requirement correctly in its own lesson is worth recording, but it
 * does not retire the concept: only a later recall does that. */
export async function recordConceptRecoveries(
  database: D1Database,
  learnerId: string,
  concepts: string[],
): Promise<void> {
  const unique = [...new Set(concepts.map((concept) => concept.slice(0, 60)))].slice(0, 20);
  if (unique.length === 0) return;
  const placeholders = unique.map(() => "?").join(", ");
  await database
    .prepare(`UPDATE concept_review
      SET times_recovered = MIN(times_recovered + 1, ${MAX_FAILURES})
      WHERE learner_id = ? AND concept IN (${placeholders})`)
    .bind(learnerId, ...unique)
    .run();
}

/* The oldest and most repeated weaknesses come first, because those are the ones
 * the learner has had least chance to settle. */
export async function loadDueReviews(
  database: D1Database,
  learnerId: string,
  limit = MAX_DUE_ITEMS,
): Promise<ReviewRow[]> {
  const rows = await database
    .prepare(`SELECT ${reviewColumns} FROM concept_review
      WHERE learner_id = ? AND due = 1
      ORDER BY times_failed DESC, last_failed_at ASC
      LIMIT ?`)
    .bind(learnerId, Math.max(1, Math.min(limit, MAX_DUE_ITEMS)))
    .all<ReviewRow>();
  return rows.results;
}

export async function loadReview(
  database: D1Database,
  learnerId: string,
  concept: string,
): Promise<ReviewRow | null> {
  const row = await database
    .prepare(`SELECT ${reviewColumns} FROM concept_review WHERE learner_id = ? AND concept = ?`)
    .bind(learnerId, concept.slice(0, 60))
    .first<ReviewRow>();
  return row || null;
}

/*
 * A recall is recorded against the learner's own row only. Recalling the same
 * concept twice retires it, and a miss puts it straight back in the queue with a
 * higher failure count, so an item can never be cleared by one lucky answer.
 */
export async function recordReviewOutcome(
  database: D1Database,
  learnerId: string,
  concept: string,
  recalled: boolean,
  now: string,
): Promise<ReviewRow | null> {
  const key = concept.slice(0, 60);
  if (recalled) {
    await database
      .prepare(`UPDATE concept_review SET
        review_streak = MIN(review_streak + 1, 9),
        due = CASE WHEN review_streak + 1 >= ${RETIRE_STREAK} THEN 0 ELSE 1 END,
        last_reviewed_at = ?
        WHERE learner_id = ? AND concept = ?`)
      .bind(now, learnerId, key)
      .run();
  } else {
    await database
      .prepare(`UPDATE concept_review SET
        review_streak = 0,
        times_failed = MIN(times_failed + 1, ${MAX_FAILURES}),
        due = 1,
        last_reviewed_at = ?,
        last_failed_at = ?
        WHERE learner_id = ? AND concept = ?`)
      .bind(now, now, learnerId, key)
      .run();
  }
  return loadReview(database, learnerId, key);
}

export async function countDueReviews(database: D1Database, learnerId: string): Promise<number> {
  const row = await database
    .prepare("SELECT COUNT(*) AS total FROM concept_review WHERE learner_id = ? AND due = 1")
    .bind(learnerId)
    .first<{ total: number }>();
  return row?.total || 0;
}