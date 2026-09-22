import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { buildPortfolio, moduleDetail, type CheckpointRow } from "@/lib/portfolio";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * The learner's portfolio.
 *
 * The learner is taken from the session and never from a parameter, so a request
 * cannot ask for anybody else's work. The only parameter accepted is which saved
 * module to open, and it is checked against the learner's own course before any
 * code is read.
 *
 * Code leaves this route only for the authenticated learner. The response carries
 * no access key, no hash, no session value, no internal identifier, and never any
 * stored exam answer or practical-exam code.
 */

const querySchema = z.object({
  module: z.string().min(1).max(120).optional(),
});

type ProgressRow = { lessonId: string; status: string; updatedAt: string };
type ExamRow = { score: number; total: number; passed: number; createdAt: string; answersJson: string };

/* The stored attempt records which course it belongs to. Read defensively, so a
 * malformed row is ignored rather than breaking the page. */
function storedCourseId(value: string): string {
  try {
    const parsed = JSON.parse(value) as { courseId?: unknown };
    return typeof parsed.courseId === "string" ? parsed.courseId : "";
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = querySchema.safeParse({
      module: new URL(request.url).searchParams.get("module") || undefined,
    });
    if (!parsed.success) {
      return Response.json({ error: "That portfolio request could not be read." }, { status: 400 });
    }

    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const database = getDatabase();
    const [checkpointRows, progressRows, examRows] = await Promise.all([
      database
        .prepare(`SELECT stage_id AS stageId, version, project_json AS projectJson, reflection, created_at AS createdAt
          FROM project_checkpoints WHERE learner_id = ? ORDER BY created_at`)
        .bind(learner.id)
        .all<CheckpointRow>(),
      database
        .prepare("SELECT lesson_id AS lessonId, status, updated_at AS updatedAt FROM course_progress WHERE learner_id = ?")
        .bind(learner.id)
        .all<ProgressRow>(),
      /* Only the score and the outcome are used. The stored answers and repaired
       * code are read solely to confirm the attempt belongs to this course, and are
       * never returned. */
      database
        .prepare("SELECT score, total, passed, created_at AS createdAt, answers_json AS answersJson FROM exam_attempts WHERE learner_id = ? ORDER BY created_at")
        .bind(learner.id)
        .all<ExamRow>(),
    ]);

    const courseStageIds = new Set(course.stages.map((stage) => stage.id));
    const courseLessonIds = new Set(course.lessons.map((lesson) => lesson.id));

    /* Rows from another course are dropped, so a learner who changed path cannot
     * see their old work here and cannot be credited for it. */
    const rows = checkpointRows.results.filter((row) => courseStageIds.has(row.stageId));

    const completedLessons = new Map<string, string>();
    for (const row of progressRows.results) {
      if (row.status !== "completed") continue;
      if (!courseLessonIds.has(row.lessonId)) continue;
      const current = completedLessons.get(row.lessonId);
      if (!current || row.updatedAt > current) completedLessons.set(row.lessonId, row.updatedAt);
    }

    const exams = examRows.results
      .filter((row) => storedCourseId(row.answersJson) === learner.courseId)
      .map((row) => ({ score: row.score, passed: Boolean(row.passed), createdAt: row.createdAt }));

    if (parsed.data.module) {
      const detail = moduleDetail(course, rows, parsed.data.module);
      if (!detail) {
        return Response.json({ error: "That saved version is not available for this course." }, { status: 404 });
      }
      return Response.json({ module: detail });
    }

    const portfolio = buildPortfolio(course, { theme: learner.theme, courseId: learner.courseId }, rows, {
      completedLessons,
      exams,
    });

    return Response.json({ portfolio, learner: { nickname: learner.nickname } });
  } catch (error) {
    return databaseError(error);
  }
}