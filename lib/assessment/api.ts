/*
 * Shared request handling for the assessment routes.
 *
 * Three rules are enforced here rather than in each route:
 *
 *   1. Identity comes from the authenticated learner only. A course id, learner id,
 *      mark or pass status in a body, a query string or a cookie is ignored.
 *   2. Every body is bounded by a schema, and a malformed body becomes a bounded 400
 *      rather than a server error.
 *   3. The client only ever receives the current item, the current task and the
 *      corrections for the form it actually submitted. Answer keys, unused forms and
 *      the rest of the bank never leave the server.
 */

import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import {
  finalFormOf,
  moduleFormOf,
  revisionConceptsFrom,
  scoreAttempt,
  toClientKnowledge,
  toClientTask,
  ASSESSMENT_RULES,
  type ClientAssessment,
} from "@/lib/assessment/engine";
import { gradeCodeTask, gradeKnowledge } from "@/lib/assessment/engine";
import { lessonByConcept } from "@/lib/assessment/manifest";
import { MAX_CODE_BYTES, type AttemptRow } from "@/lib/assessment/store";
import type { CourseAssessment, CodeFiles, ItemResult, AttemptOutcome } from "@/lib/assessment/types";
import type { CourseId } from "@/lib/course";

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function badRequest(message: string): Response {
  return json({ error: message }, 400);
}

export function notFound(message = "That assessment was not found."): Response {
  return json({ error: message }, 404);
}

export function conflict(message: string): Response {
  return json({ error: message }, 409);
}

export function notReady(): Response {
  return json({ error: "This assessment is still being reviewed and is not open yet." }, 503);
}

/* A malformed body must never become a 500: the parse failure is turned into null and
 * the schema answers with a bounded 400. */
export async function readJson(request: Request): Promise<unknown | null> {
  return await request.json().catch(() => null);
}

export function boundedCode(value: unknown): Partial<CodeFiles> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const files: Partial<CodeFiles> = {};
  for (const key of ["html", "css", "javascript"] as const) {
    const entry = record[key];
    if (typeof entry === "string") files[key] = entry.slice(0, MAX_CODE_BYTES);
  }
  return files;
}

/* The submitted code for one task, keyed by item id, with a bound on both how many
 * tasks and how large each file may be. */
export function boundedCodeMap(value: unknown): Record<string, Partial<CodeFiles>> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const map: Record<string, Partial<CodeFiles>> = {};
  let count = 0;
  for (const [key, entry] of Object.entries(record)) {
    if (count >= 6) break;
    if (key.length === 0 || key.length > 120) continue;
    map[key] = boundedCode(entry);
    count += 1;
  }
  return map;
}

export const answerSchema = z.array(z.number().int().min(-1).max(2)).max(20);
export const attemptIdSchema = z.string().min(6).max(64);

export type ClientState = ClientAssessment & {
  /* The learner's own draft, so an interrupted assessment resumes exactly where it
   * was. The draft never contains a mark or an answer key. */
  draft: unknown;
  attemptCount: number;
  resumable: boolean;
};

export function moduleTitleFor(courseId: CourseId, moduleId: string | null): string {
  if (!moduleId) return "Whole course";
  const stage = courses[courseId].stages.find((entry) => entry.id === moduleId);
  return stage ? `Module ${stage.number}: ${stage.title}` : "Whole course";
}

/*
 * The view of the current assessment. Knowledge items are sent without their answer,
 * explanation or misconception tags; tasks are sent as briefs with requirement labels
 * and marks, which the learner needs in order to do the work.
 */
export function clientView(
  attempt: AttemptRow,
  content: CourseAssessment,
): ClientAssessment | null {
  const courseId = attempt.courseId as CourseId;
  const defenceRequired = attempt.kind === "final";
  if (attempt.kind === "module") {
    const form = moduleFormOf(content, attempt.formId);
    if (!form) return null;
    return {
      attemptId: attempt.id,
      courseId,
      kind: "module",
      moduleId: attempt.moduleId,
      moduleTitle: moduleTitleFor(courseId, attempt.moduleId),
      formVariant: form.variant,
      contentVersion: attempt.contentVersion,
      stage: attempt.stage,
      status: attempt.status,
      savedAt: attempt.savedAt,
      rules: [...ASSESSMENT_RULES],
      knowledge: form.knowledge.map(toClientKnowledge),
      practical: toClientTask(form.practical),
      debug: [],
      build: null,
      defenceRequired: false,
    };
  }
  const form = finalFormOf(content, attempt.formId);
  if (!form) return null;
  return {
    attemptId: attempt.id,
    courseId,
    kind: "final",
    moduleId: null,
    moduleTitle: moduleTitleFor(courseId, null),
    formVariant: form.variant,
    contentVersion: attempt.contentVersion,
    stage: attempt.stage,
    status: attempt.status,
    savedAt: attempt.savedAt,
    rules: [...ASSESSMENT_RULES],
    knowledge: form.knowledge.map(toClientKnowledge),
    practical: null,
    debug: form.debug.map(toClientTask),
    build: toClientTask(form.build),
    defenceRequired,
  };
}

export type GradedSubmission = {
  results: ItemResult[];
  outcome: ReturnType<typeof scoreAttempt>;
  revision: ReturnType<typeof revisionConceptsFrom>;
};

/*
 * Grading. The form, the item marks and the answer key all come from the content the
 * server selected when the attempt started, so a client cannot influence any of them.
 */
export function gradeSubmission(
  content: CourseAssessment,
  attempt: AttemptRow,
  answers: number[],
  code: Record<string, Partial<CodeFiles>>,
  baseline?: Partial<CodeFiles>,
): GradedSubmission | null {
  if (attempt.kind === "module") {
    const form = moduleFormOf(content, attempt.formId);
    if (!form) return null;
    const knowledge = gradeKnowledge(form.knowledge, answers);
    const practical = gradeCodeTask(form.practical, code[form.practical.id] || {}, baseline);
    const outcome = scoreAttempt("module", { knowledge, practical: [practical] });
    const results = [...knowledge, practical];
    return { results, outcome, revision: revisionConceptsFrom(results, lessonByConcept(content)) };
  }
  const form = finalFormOf(content, attempt.formId);
  if (!form) return null;
  const knowledge = gradeKnowledge(form.knowledge, answers);
  const debug = form.debug.map((task) => gradeCodeTask(task, code[task.id] || {}, baseline));
  const build = gradeCodeTask(form.build, code[form.build.id] || {}, baseline);
  const defenceStatus = attempt.status === "submitted" && attempt.defencePassed ? "passed" : attempt.status === "submitted" ? "not_passed" : "pending";
  const outcome = scoreAttempt("final", { knowledge, debug, build: [build], defence: { status: timeSafeDefence(defenceStatus) } });
  const results = [...knowledge, ...debug, build];
  return { results, outcome, revision: revisionConceptsFrom(results, lessonByConcept(content)) };
}

function timeSafeDefence(value: string): "pending" | "passed" | "not_passed" | "needs-verification" {
  return value === "passed" || value === "not_passed" || value === "needs-verification" ? value : "pending";
}

/*
 * What the learner sees after submitting. Only the form they actually sat is
 * corrected, so an unused form is never revealed, and the corrections are served after
 * submission only.
 */
export function correctionPayload(results: ItemResult[]): Array<{
  itemId: string;
  correct: boolean;
  correctAnswer: number | null;
  explanation: string;
  chosen: number | null;
  misconception: string | null;
}> {
  return results
    .filter((result) => result.itemType === "knowledge")
    .map((result) => ({
      itemId: result.itemId,
      correct: Boolean(result.correct),
      correctAnswer: typeof result.correctAnswer === "number" ? result.correctAnswer : null,
      explanation: result.explanation || "",
      chosen: typeof result.chosen === "number" && result.chosen >= 0 ? result.chosen : null,
      misconception: result.misconception || null,
    }));
}

export type PublicRequirement = {
  label: string;
  status: string;
  awarded: number;
  available: number;
  mandatory: string | null;
  detail: string;
};

export function publicRequirements(results: ItemResult[]): Record<string, PublicRequirement[]> {
  const map: Record<string, PublicRequirement[]> = {};
  for (const result of results) {
    map[result.itemId] = result.requirements.map((requirement) => ({
      label: requirement.label,
      status: requirement.status,
      awarded: requirement.awarded,
      available: requirement.available,
      mandatory: requirement.mandatory,
      detail: requirement.detail,
    }));
  }
  return map;
}

/*
 * The learner-facing result of one attempt.
 *
 * The marks are the ones stored on the attempt row, so a later content edit cannot
 * silently change an old result. The corrections are recomputed from the stored answers
 * for display, and they only ever cover the form the learner actually sat.
 */
export type ResultPayload = {
  attempt: {
    id: string;
    kind: string;
    courseId: string;
    moduleId: string | null;
    moduleTitle: string;
    outcome: string;
    mark: AttemptOutcome["mark"];
    knowledge: AttemptOutcome["knowledge"];
    practical: AttemptOutcome["practical"];
    debug: AttemptOutcome["debug"];
    build: AttemptOutcome["build"];
    mandatoryPassed: boolean;
    needsVerification: boolean;
    reasons: string[];
    nextStep: string;
    submittedAt: string | null;
    attemptCount: number;
  };
  corrections: ReturnType<typeof correctionPayload>;
  requirements: Record<string, PublicRequirement[]>;
  revision: Array<{ concept: string; label: string; lessonId: string; mandatory: string | null }>;
  defenceRequired: boolean;
};

export function resultPayload(
  content: CourseAssessment,
  attempt: AttemptRow,
  graded: GradedSubmission,
  attemptCount: number,
): ResultPayload {
  return {
    attempt: {
      id: attempt.id,
      kind: attempt.kind,
      courseId: attempt.courseId,
      moduleId: attempt.moduleId,
      moduleTitle: moduleTitleFor(attempt.courseId as CourseId, attempt.moduleId),
      outcome: attempt.outcome || graded.outcome.outcome,
      mark: graded.outcome.mark,
      knowledge: graded.outcome.knowledge,
      practical: graded.outcome.practical,
      debug: graded.outcome.debug,
      build: graded.outcome.build,
      mandatoryPassed: Boolean(attempt.mandatoryPassed),
      needsVerification: Boolean(attempt.needsVerification),
      reasons: graded.outcome.reasons,
      nextStep: graded.outcome.nextStep,
      submittedAt: attempt.submittedAt,
      attemptCount,
    },
    corrections: correctionPayload(graded.results),
    requirements: publicRequirements(graded.results),
    revision: graded.revision.map((entry) => ({
      concept: entry.concept,
      label: entry.label,
      lessonId: entry.lessonId,
      mandatory: entry.mandatory,
    })),
    defenceRequired: attempt.kind === "final",
  };
}