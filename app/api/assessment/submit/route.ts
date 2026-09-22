import { z } from "zod";
import {
  answerSchema,
  attemptIdSchema,
  boundedCodeMap,
  gradeSubmission,
  json,
  notReady,
  readJson,
  resultPayload,
  type GradedSubmission,
} from "@/lib/assessment/api";
import { contentFor } from "@/lib/assessment/manifest";
import {
  countSubmittedAttempts,
  finalizeAttempt,
  insertItemResults,
  loadAttempt,
  upsertRevisionItems,
  type AttemptRow,
  type ItemResultRow,
} from "@/lib/assessment/store";
import { recordConceptFailures } from "@/lib/review";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * Submitting an assessment.
 *
 * The form, the item marks, the answer key and the rubric all come from the content the
 * server selected when the attempt started, so nothing in the body can influence a
 * mark. Submission is one conditional update that requires exactly one changed row: a
 * repeated or concurrent request therefore cannot award the marks twice, and the second
 * request is answered with the result that was already stored.
 */

const submitSchema = z.object({
  attemptId: attemptIdSchema,
  answers: answerSchema,
  code: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = submitSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return json({ error: "That submission could not be read. Answer every question and try again." }, 400);
    }

    const database = getDatabase();
    const attempt = await loadAttempt(database, learner.id, parsed.data.attemptId);
    /* Another learner's attempt, or one that does not exist, is the same answer. This is
     * decided before anything else, so ownership is never masked by a content state. */
    if (!attempt || attempt.courseId !== learner.courseId) {
      return json({ error: "That assessment was not found." }, 404);
    }

    const content = contentFor(learner.courseId);
    if (!content) return notReady();

    const code = boundedCodeMap(parsed.data.code);
    const attemptCount = await countSubmittedAttempts(database, learner.id, learner.courseId, attempt.kind);

    if (attempt.status === "submitted") {
      return replay(content, attempt, attemptCount);
    }

    const graded = gradeSubmission(content, attempt, parsed.data.answers, code);
    if (!graded) return notReady();
    const now = new Date().toISOString();

    const won = await finalizeAttempt(database, learner.id, attempt.id, {
      answersJson: JSON.stringify(parsed.data.answers),
      codeJson: JSON.stringify(code),
      knowledgeAwarded: graded.outcome.knowledge.awarded,
      knowledgeTotal: graded.outcome.knowledge.available,
      practicalAwarded: graded.outcome.practical.awarded,
      practicalTotal: graded.outcome.practical.available,
      debugAwarded: graded.outcome.debug.awarded,
      debugTotal: graded.outcome.debug.available,
      buildAwarded: graded.outcome.build.awarded,
      buildTotal: graded.outcome.build.available,
      totalAwarded: graded.outcome.mark.awarded,
      totalAvailable: graded.outcome.mark.available,
      mandatoryPassed: graded.outcome.mandatoryPassed,
      needsVerification: graded.outcome.needsVerification,
      outcome: graded.outcome.outcome,
      stage: graded.outcome.outcome === "passed" ? "done" : "review",
      submittedAt: now,
    });

    if (!won) {
      /* Somebody else's request already submitted this attempt. Report what is stored. */
      const current = await loadAttempt(database, learner.id, attempt.id);
      if (!current) return json({ error: "That assessment was not found." }, 404);
      const freshCount = await countSubmittedAttempts(database, learner.id, learner.courseId, current.kind);
      return replay(content, current, freshCount);
    }

    await insertItemResults(database, graded.results.flatMap((result) => toRows(attempt, result, now)));

    /* The recovery queue is built from the real rubric results, and the same weak
     * concepts are handed to the existing cross-lesson review so the tutor can revisit
     * them. There is no second weakness register. */
    if (graded.revision.length > 0 && graded.outcome.outcome !== "passed") {
      await upsertRevisionItems(
        database,
        learner.id,
        learner.courseId,
        attempt.id,
        attempt.kind,
        graded.revision,
        now,
      );
      await recordConceptFailures(
        database,
        learner.id,
        graded.revision[0].lessonId || attempt.moduleId || attempt.courseId,
        graded.revision.map((entry) => ({
          concept: entry.concept,
          label: entry.mandatory ? `${entry.label} (required)` : entry.label,
        })),
        now,
      );
    }

    const stored = await loadAttempt(database, learner.id, attempt.id);
    return json(resultPayload(content, stored || attempt, graded, attemptCount + 1));
  } catch (error) {
    return databaseError(error);
  }
}

/* A replay never re-grades into the stored marks: the stored attempt is authoritative,
 * and the corrections are recomputed only for display. */
async function replay(content: Parameters<typeof gradeSubmission>[0], attempt: AttemptRow, attemptCount: number) {
  let answers: number[] = [];
  let code: Record<string, ReturnType<typeof boundedCodeMap>[string]> = {};
  try {
    const parsedAnswers = JSON.parse(attempt.answersJson);
    if (Array.isArray(parsedAnswers)) answers = answerSchema.parse(parsedAnswers);
  } catch {
    answers = [];
  }
  try {
    const parsedCode = JSON.parse(attempt.codeJson);
    code = boundedCodeMap(parsedCode);
  } catch {
    code = {};
  }
  const graded = gradeSubmission(content, attempt, answers, code);
  if (!graded) return notReady();
  return json({ ...resultPayload(content, attempt, graded, attemptCount), replay: true });
}

function toRows(
  attempt: AttemptRow,
  result: GradedSubmission["results"][number],
  now: string,
): ItemResultRow[] {
  const base = {
    attemptId: attempt.id,
    learnerId: attempt.learnerId,
    itemId: result.itemId,
    formId: attempt.formId,
    contentVersion: attempt.contentVersion,
    itemType: result.itemType,
    concept: result.concept,
    createdAt: now,
  };
  if (result.requirements.length === 0) {
    return [{
      ...base,
      requirementId: "",
      status: result.status,
      awarded: result.awarded,
      available: result.available,
      mandatory: null,
      detail: result.correct ? "Correct." : "Not correct yet.",
    }];
  }
  return result.requirements.map((requirement) => ({
    ...base,
    requirementId: requirement.requirementId,
    concept: requirement.concept,
    status: requirement.status,
    awarded: requirement.awarded,
    available: requirement.available,
    mandatory: requirement.mandatory,
    detail: requirement.detail,
  }));
}