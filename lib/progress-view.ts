import { loadCredential, loadFinalAttemptEvidence, loadSecuredConcepts } from "@/lib/assessment/store";
import { courses } from "@/lib/course-catalog";
import { readCheckpointFiles } from "@/lib/portfolio";
import { buildSummary, type EvidenceInput, type ProgressInput, type ReviewSummaryInput, type Summary } from "@/lib/summary";

/*
 * One way to read a learner's progress.
 *
 * The progress page, the Skills Passport, the certificate and the guardian summary all read
 * through this function, so the completion record, the certification gates and the passport can
 * never drift apart. Nothing is stored: every figure is derived from the rows the app already
 * wrote, and only server-written figures are selected (no answers, no repaired code, no
 * integrity signals).
 */

type ReviewRow = Omit<ReviewSummaryInput, "due"> & { due: number };

/* The three learner fields this view needs. Nothing else about the learner is read. */
export type LearnerViewSubject = { id: string; courseId: string; theme: string };

export async function loadLearnerSummary(
  database: D1Database,
  learner: LearnerViewSubject,
): Promise<Summary | null> {
  const course = courses[learner.courseId as keyof typeof courses];
  if (!course) return null;

  const [progressRows, evidenceRows, reviewRows, checkpointRows, examRows, attemptRows, conceptRows, credential] = await Promise.all([
    database
      .prepare("SELECT lesson_id AS lessonId, status, updated_at AS updatedAt FROM course_progress WHERE learner_id = ? ORDER BY updated_at")
      .bind(learner.id)
      .all<ProgressInput>(),
    database
      .prepare(`SELECT lesson_id AS lessonId, mastery, successful_checks AS successfulChecks, attempts,
        hints_requested AS hintsRequested, independent_corrections AS independentCorrections,
        last_activity_at AS lastActivityAt, completed_at AS completedAt
        FROM lesson_evidence WHERE learner_id = ? ORDER BY last_activity_at`)
      .bind(learner.id)
      .all<EvidenceInput>(),
    database
      .prepare(`SELECT concept, label, lesson_id AS lessonId, times_failed AS timesFailed,
        times_recovered AS timesRecovered, review_streak AS reviewStreak, due
        FROM concept_review WHERE learner_id = ?`)
      .bind(learner.id)
      .all<ReviewRow>(),
    database
      .prepare("SELECT stage_id AS stageId, version, created_at AS createdAt, project_json AS projectJson FROM project_checkpoints WHERE learner_id = ? ORDER BY created_at")
      .bind(learner.id)
      .all<{ stageId: string; version: number; createdAt: string; projectJson: string }>(),
    /* Only the score and outcome are read. The stored answers and repaired code are never
     * selected, and never leave the database through this path. */
    database
      .prepare("SELECT score, total, passed, created_at AS createdAt, answers_json AS answersJson FROM exam_attempts WHERE learner_id = ? ORDER BY created_at")
      .bind(learner.id)
      .all<{ score: number; total: number; passed: number; createdAt: string; answersJson: string }>(),
    /* Assessment V2 evidence for the certificate: server-written figures only. */
    loadFinalAttemptEvidence(database, learner.id, learner.courseId),
    loadSecuredConcepts(database, learner.id, learner.courseId),
    loadCredential(database, learner.id, learner.courseId),
  ]);

  const courseLessonIds = new Set(course.lessons.map((lesson) => lesson.id));
  const courseStageIds = new Set(course.stages.map((stage) => stage.id));
  /* A learner who moved course keeps their old rows, so every figure is also filtered by the
   * course the learner is on now. */
  const exams = examRows.results
    .filter((row) => storedCourseId(row.answersJson) === learner.courseId)
    .map((row) => ({ score: row.score, total: row.total, passed: Boolean(row.passed), createdAt: row.createdAt }));

  return buildSummary(course, {
    progress: progressRows.results.filter((row) => courseLessonIds.has(row.lessonId)),
    evidence: evidenceRows.results.filter((row) => courseLessonIds.has(row.lessonId)),
    reviews: reviewRows.results
      .filter((row) => courseLessonIds.has(row.lessonId))
      .map((row) => ({ ...row, due: Boolean(row.due) })),
    checkpoints: checkpointRows.results
      .filter((row) => courseStageIds.has(row.stageId))
      .map((row) => ({
        stageId: row.stageId,
        version: row.version,
        createdAt: row.createdAt,
        readable: readCheckpointFiles(row.projectJson) !== null,
      })),
    theme: learner.theme,
    exams,
    certificationEvidence: {
      attempts: attemptRows,
      securedConcepts: conceptRows,
      credential: credential ? { issuedAt: credential.issuedAt } : null,
    },
  });
}

/* The stored attempt records which course it belongs to, read defensively so a malformed row is
 * simply ignored instead of breaking the page. */
function storedCourseId(value: string): string {
  try {
    const parsed = JSON.parse(value) as { courseId?: unknown };
    return typeof parsed.courseId === "string" ? parsed.courseId : "";
  } catch {
    return "";
  }
}