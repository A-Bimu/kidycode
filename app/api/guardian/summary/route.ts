import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { establishGuardian, guardianUnauthorized } from "@/lib/guardian-auth";
import { resolveGuardianLink } from "@/lib/guardian-links";
import { readCheckpointFiles } from "@/lib/portfolio";
import { toGuardianSummary } from "@/lib/guardian-view";
import { buildSummary, type EvidenceInput, type ProgressInput, type ReviewSummaryInput } from "@/lib/summary";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * The guardian's read of one learner's progress.
 *
 * Three conditions are checked on the server before any learner data is read:
 * a guardian is authenticated, an active link exists between that guardian and
 * the learner, and the learner belongs to the course the summary is built from.
 * The learner is only ever reached through the guardian's own link, so knowing a
 * learner identifier is never enough.
 */

const querySchema = z.object({ link: z.string().min(1).max(64) });

type ReviewRow = Omit<ReviewSummaryInput, "due"> & { due: number };

export async function GET(request: Request) {
  try {
    const established = await establishGuardian(request);
    if (!established) return guardianUnauthorized();

    const parsed = querySchema.safeParse({
      link: new URL(request.url).searchParams.get("link") || "",
    });
    if (!parsed.success) {
      return Response.json({ error: "Choose a learner from your list." }, { status: 400 });
    }

    const database = getDatabase();
    const link = await resolveGuardianLink(database, established.account.id, parsed.data.link);
    if (!link) {
      return Response.json({ error: "That learner is not connected to you." }, { status: 403 });
    }

    /* Third condition: the learner must belong to the course used for the
     * summary. The course comes from the learner's own record. */
    const course = courses[link.courseId as keyof typeof courses];
    if (!course) {
      return Response.json({ error: "This learning path is not available." }, { status: 409 });
    }

    const [progressRows, evidenceRows, reviewRows, checkpointRows, examRows, learnerRows] = await Promise.all([
      database
        .prepare("SELECT lesson_id AS lessonId, status, updated_at AS updatedAt FROM course_progress WHERE learner_id = ? ORDER BY updated_at")
        .bind(link.learnerId)
        .all<ProgressInput>(),
      database
        .prepare(`SELECT lesson_id AS lessonId, mastery, successful_checks AS successfulChecks, attempts,
          hints_requested AS hintsRequested, independent_corrections AS independentCorrections,
          last_activity_at AS lastActivityAt, completed_at AS completedAt
          FROM lesson_evidence WHERE learner_id = ? ORDER BY last_activity_at`)
        .bind(link.learnerId)
        .all<EvidenceInput>(),
      database
        .prepare(`SELECT concept, label, lesson_id AS lessonId, times_failed AS timesFailed,
          times_recovered AS timesRecovered, review_streak AS reviewStreak, due
          FROM concept_review WHERE learner_id = ?`)
        .bind(link.learnerId)
        .all<ReviewRow>(),
      database
        .prepare("SELECT stage_id AS stageId, version, created_at AS createdAt, project_json AS projectJson FROM project_checkpoints WHERE learner_id = ? ORDER BY created_at")
        .bind(link.learnerId)
        .all<{ stageId: string; version: number; createdAt: string; projectJson: string }>(),
      database
        .prepare("SELECT score, total, passed, created_at AS createdAt, answers_json AS answersJson FROM exam_attempts WHERE learner_id = ? ORDER BY created_at")
        .bind(link.learnerId)
        .all<{ score: number; total: number; passed: number; createdAt: string; answersJson: string }>(),
      /* The project the learner chose, so the record can name it. No other
       * learner field is read here. */
      database
        .prepare("SELECT theme FROM learner_profiles WHERE id = ?")
        .bind(link.learnerId)
        .first<{ theme: string }>(),
    ]);

    const courseLessonIds = new Set(course.lessons.map((lesson) => lesson.id));
    const courseStageIds = new Set(course.stages.map((stage) => stage.id));
    const exams = examRows.results
      .filter((row) => storedCourseId(row.answersJson) === link.courseId)
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
      theme: learnerRows?.theme || "",
      exams,
    });

    return Response.json({
      summary: toGuardianSummary(summary, {
        firstName: link.learnerName,
        courseGroup: course.courseFacts.ageRange,
      }),
    });
  } catch (error) {
    return databaseError(error);
  }
}

function storedCourseId(value: string): string {
  try {
    const parsed = JSON.parse(value) as { courseId?: unknown };
    return typeof parsed.courseId === "string" ? parsed.courseId : "";
  } catch {
    return "";
  }
}
