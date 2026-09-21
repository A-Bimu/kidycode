import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import type { Lesson, WorkspaceFiles } from "@/lib/course";
import { loadLessonEvidence, upsertLessonEvidence } from "@/lib/evidence";
import { recordConceptRecoveries } from "@/lib/review";
import { checkCount, gradeRequirements, masteryFrom, mergeStruggles } from "@/lib/tutor";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const workspaceSchema = z.object({
  html: z.string().max(20000),
  css: z.string().max(20000),
  javascript: z.string().max(20000),
});

const progressSchema = z.object({
  lessonId: z.string().min(1).max(160),
  status: z.enum(["started", "completed"]),
  questionAnswer: z.number().int().min(-1).max(2).default(-1),
  quizAnswers: z.array(z.number().int().min(0).max(2)).max(5).default([]),
  reflection: z.string().max(1200).default(""),
  workspace: workspaceSchema,
});

function codeChecksPass(lesson: Lesson, workspace: WorkspaceFiles): boolean {
  return lesson.tests.length > 0 && lesson.tests.every((test) => {
    try {
      return new RegExp(test.pattern, "i").test(workspace[test.file]);
    } catch {
      return false;
    }
  });
}

async function previousActivityIsComplete(learnerId: string, previousLessonId: string | undefined): Promise<boolean> {
  if (!previousLessonId) return true;
  const previous = await getDatabase()
    .prepare("SELECT status FROM course_progress WHERE learner_id = ? AND lesson_id = ?")
    .bind(learnerId, previousLessonId)
    .first<{ status: string }>();
  return previous?.status === "completed";
}

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const database = getDatabase();
    const [progress, checkpoints, exams] = await Promise.all([
      database.prepare("SELECT lesson_id AS lessonId, status, question_correct AS questionCorrect, reflection, workspace_json AS workspaceJson, updated_at AS updatedAt FROM course_progress WHERE learner_id = ? ORDER BY updated_at").bind(learner.id).all(),
      database.prepare("SELECT id, stage_id AS stageId, version, reflection, created_at AS createdAt FROM project_checkpoints WHERE learner_id = ? ORDER BY created_at DESC").bind(learner.id).all(),
      database.prepare("SELECT id, score, total, passed, created_at AS createdAt FROM exam_attempts WHERE learner_id = ? ORDER BY created_at DESC LIMIT 5").bind(learner.id).all(),
    ]);
    const lessonIds = new Set(course.lessons.map((lesson) => lesson.id));
    const stageIds = new Set(course.stages.map((stage) => stage.id));
    return Response.json({
      learner,
      progress: progress.results.filter((item) => lessonIds.has(String(item.lessonId))),
      checkpoints: checkpoints.results.filter((item) => stageIds.has(String(item.stageId))),
      exams: exams.results,
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = progressSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "This lesson progress could not be saved." }, { status: 400 });
    }

    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });
    const lessonIndex = course.lessons.findIndex((lesson) => lesson.id === parsed.data.lessonId);
    if (lessonIndex < 0) {
      return Response.json({ error: "This lesson does not belong to your learning path." }, { status: 403 });
    }
    const lesson = course.lessons[lessonIndex];
    const previousLesson = course.lessons[lessonIndex - 1];
    if (!(await previousActivityIsComplete(learner.id, previousLesson?.id))) {
      return Response.json({ error: "Complete the previous activity before saving this one." }, { status: 409 });
    }

    const data = parsed.data;
    let knowledgePassed = false;
    let codePassed = false;
    let score: number | null = null;

    if (lesson.activityType === "quiz") {
      const questions = lesson.questions || [];
      if (data.status === "completed" && (questions.length !== 5 || data.quizAnswers.length !== questions.length)) {
        return Response.json({ error: "Answer all five module questions before completing this activity." }, { status: 400 });
      }
      score = questions.reduce((total, question, index) => total + (data.quizAnswers[index] === question.answer ? 1 : 0), 0);
      knowledgePassed = data.quizAnswers.length === questions.length && score >= 4;
      codePassed = true;
    } else {
      codePassed = codeChecksPass(lesson, data.workspace);
      knowledgePassed = Boolean(lesson.question) && data.questionAnswer === lesson.question?.answer;
    }

    const reflectionPassed = lesson.activityType !== "project" || data.reflection.trim().length >= 10;
    const masteryPassed = codePassed && knowledgePassed && reflectionPassed;
    if (data.status === "completed" && !masteryPassed) {
      return Response.json({
        error: lesson.activityType === "quiz"
          ? "Score at least four out of five before completing this module."
          : lesson.activityType === "project"
            ? "Pass the code checks, answer the quick check and explain one project choice."
            : "Pass the code checks and quick check before completing this lesson.",
        result: { codePassed, knowledgePassed, reflectionPassed, score },
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    await getDatabase()
      .prepare(`INSERT INTO course_progress
        (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (learner_id, lesson_id) DO UPDATE SET
          status = CASE WHEN course_progress.status = 'completed' THEN course_progress.status ELSE excluded.status END,
          question_correct = CASE WHEN course_progress.status = 'completed' THEN course_progress.question_correct ELSE excluded.question_correct END,
          reflection = CASE WHEN course_progress.status = 'completed' THEN course_progress.reflection ELSE excluded.reflection END,
          workspace_json = CASE WHEN course_progress.status = 'completed' THEN course_progress.workspace_json ELSE excluded.workspace_json END,
          updated_at = CASE WHEN course_progress.status = 'completed' THEN course_progress.updated_at ELSE excluded.updated_at END`)
      .bind(
        learner.id,
        data.lessonId,
        data.status,
        knowledgePassed ? 1 : 0,
        data.reflection.trim(),
        JSON.stringify(data.workspace),
        now,
      )
      .run();

    /* Completing an activity also records the evidence a tutor needs. Attempts
     * are not counted here, because drafts autosave repeatedly. The completion
     * timestamp is written through a COALESCE guard, so a second completion
     * never overwrites the first one. */
    if (data.status === "completed") {
      const current = await loadLessonEvidence(getDatabase(), learner.id, data.lessonId);
      const quizTotal = lesson.activityType === "quiz" ? (lesson.questions || []).length : 0;
      const bestQuizScore = quizTotal > 0 && score !== null
        ? Math.max(current?.bestQuizScore || 0, score)
        : current?.bestQuizScore || 0;
      const evidenceCodePassed = lesson.tests.length > 0 ? codePassed : (current?.codePassed || false);
      const quickCheckPassed = lesson.question ? knowledgePassed : (current?.quickCheckPassed || false);
      const gradedRequirements = gradeRequirements(lesson, data.workspace);
      const struggles = mergeStruggles(current?.struggles || [], gradedRequirements);
      await recordConceptRecoveries(
        getDatabase(),
        learner.id,
        gradedRequirements.filter((result) => result.passed).map((result) => result.concept),
      );
      await upsertLessonEvidence(getDatabase(), learner.id, data.lessonId, {
        attemptIncrement: 0,
        hintIncrement: 0,
        independentCorrectionIncrement: 0,
        successfulChecks: checkCount({
          codePassed: evidenceCodePassed,
          quickCheckPassed,
          bestQuizScore,
          quizTotal,
          quickCheckOffered: Boolean(lesson.question),
          quizOffered: quizTotal > 0,
        }),
        mastery: masteryFrom({
          requirementsPassed: evidenceCodePassed,
          quickCheckPassed,
          bestQuizScore,
          quizTotal,
          alreadyPassedCode: current?.codePassed || false,
          alreadyPassedQuickCheck: current?.quickCheckPassed || false,
          codeOffered: lesson.tests.length > 0,
          quickCheckOffered: Boolean(lesson.question),
        }),
        bestQuizScore,
        lastInterventionLevel: current?.lastInterventionLevel || 0,
        struggleJson: JSON.stringify(struggles),
        interventionPending: current?.interventionPending || false,
        codePassedAt: lesson.tests.length > 0 && !current?.codePassed ? now : null,
        quickCheckPassedAt: lesson.question && !current?.quickCheckPassed ? now : null,
        completedAt: now,
      }, now);
    }

    return Response.json({ saved: true, updatedAt: now, result: { codePassed, knowledgePassed, reflectionPassed, score } });
  } catch (error) {
    return databaseError(error);
  }
}
