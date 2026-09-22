import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { readCheckpointFiles } from "@/lib/portfolio";
import { buildSummary, type EvidenceInput, type ProgressInput, type ReviewSummaryInput } from "@/lib/summary";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/* The only input is an optional learner id, which must match the authenticated
 * learner. That makes an attempt to read someone else's progress an explicit,
 * testable rejection rather than a silent empty answer. */
const querySchema = z.object({
  learnerId: z.string().min(1).max(64).optional(),
});

/* D1 stores the flag as 0 or 1, so the row type is narrowed before the summary
 * sees a real boolean. */
type ReviewRow = Omit<ReviewSummaryInput, "due"> & { due: number };

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = querySchema.safeParse({
      learnerId: new URL(request.url).searchParams.get("learnerId") || undefined,
    });
    if (!parsed.success) {
      return Response.json({ error: "This progress request could not be read." }, { status: 400 });
    }
    if (parsed.data.learnerId && parsed.data.learnerId !== learner.id) {
      return Response.json({ error: "This progress belongs to another learner." }, { status: 403 });
    }

    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const database = getDatabase();
    const [progressRows, evidenceRows, reviewRows, checkpointRows, examRows] = await Promise.all([
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
      /* Only the score and outcome are read. The stored answers and repaired code
       * are never selected, and never leave the database through this route. */
      database
        .prepare("SELECT score, total, passed, created_at AS createdAt, answers_json AS answersJson FROM exam_attempts WHERE learner_id = ? ORDER BY created_at")
        .bind(learner.id)
        .all<{ score: number; total: number; passed: number; createdAt: string; answersJson: string }>(),
    ]);

    const courseLessonIds = new Set(course.lessons.map((lesson) => lesson.id));
    const courseStageIds = new Set(course.stages.map((stage) => stage.id));
    /* A learner who moved course keeps their old rows, so every figure is also
     * filtered by the course the learner is on now. */
    const exams = examRows.results
      .filter((row) => storedCourseId(row.answersJson) === learner.courseId)
      .map((row) => ({ score: row.score, total: row.total, passed: Boolean(row.passed), createdAt: row.createdAt }));

    const summary = buildSummary(course, {
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
    });

    return Response.json({ summary });
  } catch (error) {
    return databaseError(error);
  }
}

/* The stored attempt records which course it belongs to, read defensively so a
 * malformed row is simply ignored instead of breaking the page. */
function storedCourseId(value: string): string {
  try {
    const parsed = JSON.parse(value) as { courseId?: unknown };
    return typeof parsed.courseId === "string" ? parsed.courseId : "";
  } catch {
    return "";
  }
}
