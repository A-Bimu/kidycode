import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import type { Lesson, WorkspaceFiles } from "@/lib/course";
import {
  loadLearnerEvidence,
  loadLessonEvidence,
  insertIntervention,
  markLatestInterventionIndependent,
  upsertLessonEvidence,
  type LessonEvidence,
} from "@/lib/evidence";
import {
  acknowledgementFor,
  checkCount,
  firstFailure,
  failsFor,
  focusArea,
  gradeRequirements,
  lessonExample,
  levelForFails,
  masteryFrom,
  masteryLabel,
  mergeStruggles,
  nudgeFor,
  quizFeedback,
  quickCheckFeedback,
  requirementsPassed,
  termFocus,
  type RequirementResult,
  type StruggleEntry,
  type TutorNudge,
} from "@/lib/tutor";
import { recordConceptFailures, recordConceptRecoveries } from "@/lib/review";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const emptyWorkspace: WorkspaceFiles = { html: "", css: "", javascript: "" };

const workspaceSchema = z.object({
  html: z.string().max(20000),
  css: z.string().max(20000),
  javascript: z.string().max(20000),
});

/* Every field is bounded. Nothing here accepts a claim about whether work
 * passed, so the browser cannot grade its own submission. */
const tutorSchema = z.object({
  lessonId: z.string().min(1).max(160),
  action: z.enum(["nudge", "check", "quickcheck", "quiz"]),
  workspace: workspaceSchema.default(emptyWorkspace),
  questionAnswer: z.number().int().min(-1).max(2).default(-1),
  quizAnswers: z.array(z.number().int().min(0).max(2)).max(5).default([]),
});

function quizTotalFor(lesson: Lesson): number {
  return lesson.activityType === "quiz" ? (lesson.questions || []).length : 0;
}

async function previousActivityIsComplete(learnerId: string, previousLessonId: string | undefined): Promise<boolean> {
  if (!previousLessonId) return true;
  const previous = await getDatabase()
    .prepare("SELECT status FROM course_progress WHERE learner_id = ? AND lesson_id = ?")
    .bind(learnerId, previousLessonId)
    .first<{ status: string }>();
  return previous?.status === "completed";
}

const emptyEvidence = (lessonId: string, now: string): LessonEvidence => ({
  lessonId,
  attempts: 0,
  successfulChecks: 0,
  hintsRequested: 0,
  mastery: 0,
  struggles: [],
  independentCorrections: 0,
  lastInterventionLevel: 0,
  interventionPending: false,
  codePassed: false,
  quickCheckPassed: false,
  bestQuizScore: 0,
  completedAt: null,
  lastActivityAt: now,
});

function evidencePayload(evidence: LessonEvidence, lesson: Lesson) {
  return {
    lessonId: evidence.lessonId,
    attempts: evidence.attempts,
    successfulChecks: evidence.successfulChecks,
    hintsRequested: evidence.hintsRequested,
    mastery: evidence.mastery,
    masteryLabel: masteryLabel(evidence.mastery),
    struggles: evidence.struggles,
    focusArea: focusArea(evidence.struggles),
    independentCorrections: evidence.independentCorrections,
    interventionPending: evidence.interventionPending,
    bestQuizScore: evidence.bestQuizScore,
    checksAvailable: 1 + (lesson.question ? 1 : 0) + (quizTotalFor(lesson) > 0 ? 1 : 0),
    codePassed: evidence.codePassed,
    quickCheckPassed: evidence.quickCheckPassed,
    completedAt: evidence.completedAt,
    lastActivityAt: evidence.lastActivityAt,
  };
}

/* A written question is supported with the lesson term it is about, and the
 * support follows the same three levels as a code requirement. */
function questionNudge(lesson: Lesson, text: string, explanation: string, struggles: StruggleEntry[]): TutorNudge {
  const term = termFocus(lesson, text);
  const focus = term || "Quick check";
  const concept = `question:${focus.toLowerCase()}`;
  const level = levelForFails(failsFor(struggles, concept));
  const message = level === 1
    ? term
      ? `Your answer describes something else in this lesson. Look again at ${term} in the notes before choosing.`
      : "Your answer describes something else in this lesson. Read the sentence in the notes that defines this idea, then choose again."
    : level === 2
      ? explanation
      : `${explanation} Compare it with the worked example in the notes.`;
  return {
    concept,
    focus,
    level,
    message,
    example: level === 3 ? lessonExample(lesson) : "",
    requirement: text.slice(0, 160),
  };
}

/* The learner's own evidence only, filtered to the lessons of the course this
 * learner was assigned so a stale row can never surface. */
export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const evidence = await loadLearnerEvidence(getDatabase(), learner.id);
    const lessonsById = new Map(course.lessons.map((lesson) => [lesson.id, lesson]));
    return Response.json({
      evidence: evidence.flatMap((item) => {
        const lesson = lessonsById.get(item.lessonId);
        return lesson ? [evidencePayload(item, lesson)] : [];
      }),
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = tutorSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "This tutoring request could not be read." }, { status: 400 });
    }

    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });
    const lessonIndex = course.lessons.findIndex((lesson) => lesson.id === parsed.data.lessonId);
    if (lessonIndex < 0) {
      return Response.json({ error: "This lesson does not belong to your learning path." }, { status: 403 });
    }
    const lesson = course.lessons[lessonIndex];
    if (!(await previousActivityIsComplete(learner.id, course.lessons[lessonIndex - 1]?.id))) {
      return Response.json({ error: "Complete the previous activity before working on this one." }, { status: 409 });
    }

    const data = parsed.data;
    const database = getDatabase();
    const now = new Date().toISOString();
    const current = (await loadLessonEvidence(database, learner.id, lesson.id)) || emptyEvidence(lesson.id, now);

    let results: RequirementResult[] = [];
    let passed = false;
    let feedback = "";
    let acknowledgement = "";
    let nudge: TutorNudge | null = null;
    let quickCheck: { correct: boolean; message: string } | null = null;
    let quiz: { correct: number[]; missed: number[]; focus: string[]; score: number; total: number } | null = null;
    const attemptIncrement = 1;
    let hintIncrement = 0;
    let independentCorrectionIncrement = 0;
    let lastInterventionLevel = current.lastInterventionLevel;
    let interventionPending = current.interventionPending;
    let struggles = current.struggles;
    let codePassedAt: string | null = null;
    let quickCheckPassedAt: string | null = null;
    let bestQuizScore = current.bestQuizScore;
    let codePassedNow = false;
    let quickCheckPassedNow = false;

    if (data.action === "check" || data.action === "nudge") {
      if (lesson.tests.length === 0) {
        return Response.json({ error: "This activity is graded by its module check instead." }, { status: 409 });
      }
      results = gradeRequirements(lesson, data.workspace);
      passed = requirementsPassed(results);
      codePassedNow = passed;
      const primary = firstFailure(results);

      if (passed) {
        if (!current.codePassed) codePassedAt = now;
        if (current.interventionPending) {
          independentCorrectionIncrement = 1;
          await markLatestInterventionIndependent(database, learner.id, lesson.id);
        }
        interventionPending = false;
        /* A requirement that now passes is no longer something to work on in
         * this lesson, but it stays on the review list until a later recall. */
        struggles = mergeStruggles(current.struggles, results);
        await recordConceptRecoveries(
          database,
          learner.id,
          results.filter((result) => result.passed).map((result) => result.concept),
        );
        const demonstrated = results.find((result) => result.passed);
        acknowledgement = demonstrated ? acknowledgementFor(demonstrated) : "";
        feedback = "Every requirement passed. Your code does what the task asked.";
      } else if (primary) {
        nudge = nudgeFor(primary, failsFor(current.struggles, primary.concept));
        struggles = mergeStruggles(current.struggles, results);
        /* The concept is remembered beyond this lesson so the tutor can return
         * to it later, even after the learner passes it here. */
        await recordConceptFailures(
          database,
          learner.id,
          lesson.id,
          results.filter((result) => !result.passed).map((result) => ({ concept: result.concept, label: result.label })),
          now,
        );
        lastInterventionLevel = nudge.level;
        interventionPending = true;
        hintIncrement = data.action === "nudge" ? 1 : 0;
        await insertIntervention(database, learner.id, lesson.id, {
          level: nudge.level,
          focus: nudge.focus,
          requirements: results.filter((result) => !result.passed).map((result) => result.label),
          source: data.action === "nudge" ? "nudge" : "check",
        }, now);
        const passingCount = results.filter((result) => result.passed).length;
        feedback = passingCount > 0
          ? `${passingCount} of ${results.length} requirements pass. Start with this one: ${primary.label.toLowerCase()}.`
          : `Start with this requirement: ${primary.label.toLowerCase()}.`;
      }
    }

    if (data.action === "quickcheck") {
      const question = lesson.question;
      if (!question) {
        return Response.json({ error: "This activity has no quick check." }, { status: 409 });
      }
      quickCheck = quickCheckFeedback(question, data.questionAnswer);
      quickCheckPassedNow = quickCheck.correct;
      if (quickCheck.correct) {
        if (!current.quickCheckPassed) quickCheckPassedAt = now;
        if (current.interventionPending) {
          independentCorrectionIncrement = 1;
          await markLatestInterventionIndependent(database, learner.id, lesson.id);
        }
        interventionPending = false;
        const answeredConcept = questionNudge(lesson, question.prompt, question.explanation, current.struggles).concept;
        struggles = current.struggles.filter((entry) => entry.concept !== answeredConcept);
        acknowledgement = "You answered from the idea in the notes rather than guessing.";
      } else {
        nudge = questionNudge(lesson, question.prompt, question.explanation, current.struggles);
        const pseudo: RequirementResult = { label: question.prompt, file: "html", concept: nudge.concept, passed: false };
        struggles = mergeStruggles(current.struggles, [pseudo]);
        await recordConceptFailures(database, learner.id, lesson.id, [{ concept: pseudo.concept, label: pseudo.label }], now);
        lastInterventionLevel = nudge.level;
        interventionPending = true;
        await insertIntervention(database, learner.id, lesson.id, {
          level: nudge.level,
          focus: nudge.focus,
          requirements: [question.prompt],
          source: "quickcheck",
        }, now);
      }
      feedback = quickCheck.message;
    }

    if (data.action === "quiz") {
      const questions = lesson.questions || [];
      if (lesson.activityType !== "quiz" || questions.length === 0) {
        return Response.json({ error: "This activity is not a module check." }, { status: 409 });
      }
      if (data.quizAnswers.length !== questions.length) {
        return Response.json({ error: "Answer every question before submitting this module check." }, { status: 400 });
      }
      const scored = quizFeedback(lesson, questions, data.quizAnswers);
      const score = scored.correct.length;
      quiz = { ...scored, score, total: questions.length };
      bestQuizScore = Math.max(current.bestQuizScore, score);
      const quizPassed = score >= Math.ceil(questions.length * 0.8);
      const missedText = scored.missed.map((index) => questions[index].prompt).join(" ");
      if (quizPassed) {
        if (current.interventionPending) {
          independentCorrectionIncrement = 1;
          await markLatestInterventionIndependent(database, learner.id, lesson.id);
        }
        interventionPending = false;
        acknowledgement = "You answered most questions from the lessons you completed.";
      } else {
        nudge = questionNudge(lesson, missedText, "Each answer comes from a lesson you already finished, so the notes hold the explanation you need.", current.struggles);
        lastInterventionLevel = nudge.level;
        interventionPending = true;
        await insertIntervention(database, learner.id, lesson.id, {
          level: nudge.level,
          focus: nudge.focus,
          requirements: scored.focus,
          source: "quiz",
        }, now);
      }
      struggles = mergeStruggles(current.struggles, questions.map((question, index) => ({
        label: scored.focus[index] || question.prompt,
        file: "html",
        concept: `module-check:${termFocus(lesson, question.prompt) || index}`,
        passed: data.quizAnswers[index] === question.answer,
      })));
      feedback = quizPassed
        ? `${score} of ${questions.length} correct. The next module is open.`
        : `${score} of ${questions.length} correct. Review ${scored.focus.join(", ") || "the lesson examples"}, then try again.`;
    }

    const quizTotal = quizTotalFor(lesson);
    const mastery = Math.max(current.mastery, masteryFrom({
      requirementsPassed: codePassedNow,
      quickCheckPassed: quickCheckPassedNow,
      bestQuizScore,
      quizTotal,
      alreadyPassedCode: current.codePassed,
      alreadyPassedQuickCheck: current.quickCheckPassed,
      codeOffered: lesson.tests.length > 0,
      quickCheckOffered: Boolean(lesson.question),
    }));
    const successfulChecks = Math.max(current.successfulChecks, checkCount({
      codePassed: Boolean(codePassedAt) || current.codePassed,
      quickCheckPassed: Boolean(quickCheckPassedAt) || current.quickCheckPassed,
      bestQuizScore,
      quizTotal,
      quickCheckOffered: Boolean(lesson.question),
      quizOffered: quizTotal > 0,
    }));

    await upsertLessonEvidence(database, learner.id, lesson.id, {
      attemptIncrement,
      hintIncrement,
      independentCorrectionIncrement,
      successfulChecks,
      mastery,
      bestQuizScore,
      lastInterventionLevel,
      struggleJson: JSON.stringify(struggles),
      interventionPending,
      codePassedAt,
      quickCheckPassedAt,
      completedAt: null,
    }, now);

    const saved = (await loadLessonEvidence(database, learner.id, lesson.id)) || {
      ...current,
      lessonId: lesson.id,
      struggles,
      mastery,
      successfulChecks,
      lastActivityAt: now,
    };

    return Response.json({
      action: data.action,
      passed,
      results,
      feedback,
      acknowledgement,
      nudge,
      quickCheck,
      quiz,
      evidence: evidencePayload(saved, lesson),
    });
  } catch (error) {
    return databaseError(error);
  }
}
