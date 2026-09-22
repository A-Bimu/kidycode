/*
 * The assessment engine.
 *
 * No database, no browser, no network: pure functions over content and submissions, so
 * the marking rules can be tested directly and reasoned about without a running
 * server. The API route calls exactly these functions, so the behaviour the tests
 * prove is the behaviour the learner meets.
 */

import { buildContext, gradeRequirements } from "@/lib/assessment/grading";
import {
  CONTENT_VERSION,
  type AttemptOutcome,
  type CodeFiles,
  type CodeTask,
  type CourseAssessment,
  type ItemResult,
  type KnowledgeItem,
  type ModuleForm,
  type FinalForm,
  type Outcome,
  type ScoreBreakdown,
  type Submission,
} from "@/lib/assessment/types";

export const MODULE_TOTAL = 10;
export const MODULE_PASS_MARK = 7;
export const MODULE_PRACTICAL_MARKS = 5;
export const MODULE_PRACTICAL_MIN = 3;
export const FINAL_TOTAL = 100;
export const FINAL_PASS_MARK = 70;
export const FINAL_KNOWLEDGE_MARKS = 20;
export const FINAL_DEBUG_MARKS = 30;
export const FINAL_BUILD_MARKS = 50;
export const FINAL_BUILD_MIN = 30;
export const DEFENCE_MIN_WORDS = 12;

export const ASSESSMENT_RULES = [
  "This is not timed. You can stop, save and come back to it.",
  "There are no answer-revealing hints and the tutor is switched off while you are being assessed.",
  "The reference sheet button opens general HTML, CSS and JavaScript syntax. It never contains the solution to a task.",
  "Do your certificate work on your own, without AI-generated answers. Ask a person only to check that the page works, never what to write.",
  "Nobody can promise to detect every kind of outside help, and KidyCode does not try to. The code defence is how you show the work is yours.",
  "A tab change or a paste is never treated as cheating and can never fail you. These are only counted so the right defence question can be chosen.",
  "A repeated or interrupted submission is safe: your result is recorded once and cannot be counted twice.",
  "You can retake an assessment as often as you need once the revision work is finished, and each retake asks a genuinely different set of reviewed questions.",
];

/* ------------------------------------------------------------------- scoring -- */

function emptyBreakdown(): ScoreBreakdown {
  return { awarded: 0, available: 0, verifiedAwarded: 0, verifiedAvailable: 0 };
}

export function addToBreakdown(breakdown: ScoreBreakdown, results: ItemResult[]): ScoreBreakdown {
  const next = { ...breakdown };
  for (const result of results) {
    next.awarded += result.awarded;
    next.available += result.available;
    if (result.status !== "needs-verification") {
      next.verifiedAwarded += result.awarded;
      next.verifiedAvailable += result.available;
    }
  }
  return next;
}

function allRequirements(results: ItemResult[]): ItemResult["requirements"] {
  return results.flatMap((result) => result.requirements);
}

/* ------------------------------------------------------------------ knowledge - */

export function gradeKnowledge(items: KnowledgeItem[], answers: Array<number | null | undefined>): ItemResult[] {
  return items.map((item, index) => {
    const chosen = typeof answers[index] === "number" ? answers[index]! : -1;
    const correct = chosen === item.answer;
    return {
      itemId: item.id,
      itemType: "knowledge",
      formVariant: item.formVariant,
      concept: item.concept,
      status: correct ? "met" : "unmet",
      awarded: correct ? item.marks : 0,
      available: item.marks,
      requirements: [],
      correct,
      chosen,
      correctAnswer: item.answer,
      explanation: item.explanation,
      misconception: correct ? undefined : item.misconceptions[chosen] || item.misconceptions[0] || undefined,
    };
  });
}

/* ----------------------------------------------------------------- code tasks - */

export function gradeCodeTask(
  task: CodeTask,
  files: Partial<CodeFiles>,
  baseline?: Partial<CodeFiles>,
): ItemResult {
  const context = buildContext(files, baseline);
  const requirements = gradeRequirements(task.requirements, context);
  const awarded = requirements.reduce((total, entry) => total + entry.awarded, 0);
  const available = requirements.reduce((total, entry) => total + entry.available, 0);
  const status: ItemResult["status"] = requirements.some((entry) => entry.status === "needs-verification")
    ? "needs-verification"
    : awarded === available
      ? "met"
      : "unmet";
  return {
    itemId: task.id,
    itemType: task.type,
    formVariant: task.formVariant,
    concept: task.concept,
    status,
    awarded,
    available,
    requirements,
  };
}

/* -------------------------------------------------------------------- outcome -- */

function outcomeLabel(outcome: Outcome): string {
  return outcome === "passed" ? "Passed" : outcome === "needs_verification" ? "Needs verification" : "Not passed yet";
}

export type OutcomeInput = {
  knowledge: ItemResult[];
  practical?: ItemResult[];
  debug?: ItemResult[];
  build?: ItemResult[];
  /* The code defence, once the learner has reached it. */
  defence?: { status: "pending" | "passed" | "not_passed" | "needs-verification" };
};

export function scoreAttempt(kind: "module" | "final", input: OutcomeInput): AttemptOutcome {
  const knowledge = addToBreakdown(emptyBreakdown(), input.knowledge);
  const practical = addToBreakdown(emptyBreakdown(), input.practical || []);
  const debug = addToBreakdown(emptyBreakdown(), input.debug || []);
  const build = addToBreakdown(emptyBreakdown(), input.build || []);

  const everything = [...input.knowledge, ...(input.practical || []), ...(input.debug || []), ...(input.build || [])];
  const requirements = allRequirements(everything);
  const mark = addToBreakdown(emptyBreakdown(), everything);

  const mandatoryResults = requirements.filter((requirement) => requirement.mandatory);
  const mandatoryUnmet = mandatoryResults.filter((requirement) => requirement.status === "unmet");
  const mandatoryUnverified = mandatoryResults.filter((requirement) => requirement.status === "needs-verification");
  const unverified = everything.filter((result) => result.status === "needs-verification");
  const mandatoryPassed = mandatoryUnmet.length === 0 && mandatoryUnverified.length === 0;
  const neededButUnverified = unverified.reduce((total, result) => {
    const awarded = result.requirements.reduce((sum, entry) => sum + (entry.status === "met" ? entry.awarded : 0), 0);
    return total + awarded;
  }, 0);
  const unverifiedAvailable = unverified.reduce((total, result) => {
    const available = result.requirements.reduce(
      (sum, entry) => sum + (entry.status === "needs-verification" ? entry.available : 0),
      0,
    );
    return total + available;
  }, 0);

  const reasons: string[] = [];
  let outcome: Outcome;
  let nextStep = "";

  if (kind === "module") {
    const practicalAwarded = practical.awarded;
    const passedOnMarks = mark.awarded >= MODULE_PASS_MARK && practicalAwarded >= MODULE_PRACTICAL_MIN;
    const couldPass = mark.awarded + neededButUnverified + unverifiedAvailable >= MODULE_PASS_MARK;

    if (mandatoryUnverified.length > 0) {
      outcome = "needs_verification";
      reasons.push("A mandatory safety, privacy or accessibility requirement could not be confirmed automatically.");
      nextStep = "Ask a grown-up or your teacher to look at that one requirement with you, then submit again.";
    } else if (mandatoryUnmet.length > 0) {
      outcome = "not_passed_yet";
      reasons.push(`A mandatory requirement was not met: ${mandatoryUnmet[0].label}.`);
      nextStep = "Every mandatory safety, privacy and accessibility requirement has to pass, whatever the total says. Fix it first.";
    } else if (passedOnMarks) {
      outcome = "passed";
      reasons.push(`Scored ${mark.awarded} of ${MODULE_TOTAL}, with ${practicalAwarded} of ${MODULE_PRACTICAL_MARKS} on the practical task.`);
    } else if (couldPass && unverifiedAvailable > 0) {
      outcome = "needs_verification";
      reasons.push("The marks are close and one requirement could not be checked automatically.");
      nextStep = "Submit again so the requirement can be checked, or ask a grown-up to confirm it.";
    } else {
      outcome = "not_passed_yet";
      reasons.push(`Scored ${mark.awarded} of ${MODULE_TOTAL}. A pass needs ${MODULE_PASS_MARK}, with at least ${MODULE_PRACTICAL_MIN} of ${MODULE_PRACTICAL_MARKS} on the practical task.`);
      nextStep = "Open the revision plan and work through the first recommended step, then try another form of this assessment.";
    }
    return {
      outcome,
      mark,
      knowledge,
      practical,
      debug,
      build,
      mandatoryPassed,
      needsVerification: unverified.length > 0,
      reasons,
      nextStep,
    };
  }

  const passedOnMarks = mark.awarded >= FINAL_PASS_MARK && build.awarded >= FINAL_BUILD_MIN;
  const couldPass = mark.awarded + neededButUnverified + unverifiedAvailable >= FINAL_PASS_MARK
    && build.awarded + neededButUnverified >= FINAL_BUILD_MIN;

  if (mandatoryUnverified.length > 0) {
    outcome = "needs_verification";
    reasons.push("A mandatory safety, privacy or accessibility requirement could not be confirmed automatically.");
    nextStep = "Ask a grown-up or your teacher to confirm that one requirement with you, then submit again.";
  } else if (mandatoryUnmet.length > 0) {
    outcome = "not_passed_yet";
    reasons.push(`A mandatory requirement was not met: ${mandatoryUnmet[0].label}.`);
    nextStep = "Every mandatory safety, privacy and accessibility requirement has to pass, whatever the total says. Fix it first.";
  } else if (!input.defence || input.defence.status === "pending") {
    outcome = "not_passed_yet";
    reasons.push("The independent build is marked. The code defence is still to be completed.");
    nextStep = "Finish the code defence: explain your project, predict a change, then make one small change.";
  } else if (input.defence.status === "needs-verification") {
    outcome = "needs_verification";
    reasons.push("The code defence could not be confirmed automatically.");
    nextStep = "Ask a grown-up or your teacher to read the explanation with you and confirm the change, then submit again.";
  } else if (input.defence.status === "not_passed" && passedOnMarks) {
    outcome = "not_passed_yet";
    reasons.push("The marks are above the pass mark, but the code defence did not show the work as your own yet.");
    nextStep = "Revise the concept behind the defence questions, then take a fresh form of the assessment.";
  } else if (passedOnMarks) {
    outcome = "passed";
    reasons.push(`Scored ${mark.awarded} of ${FINAL_TOTAL}, with ${build.awarded} of ${FINAL_BUILD_MARKS} on the independent build.`);
  } else if (couldPass && unverifiedAvailable > 0) {
    outcome = "needs_verification";
    reasons.push("The marks are close and one requirement could not be checked automatically.");
    nextStep = "Submit again so the requirement can be checked, or ask a grown-up to confirm it.";
  } else {
    outcome = "not_passed_yet";
    reasons.push(`Scored ${mark.awarded} of ${FINAL_TOTAL}. A pass needs ${FINAL_PASS_MARK}, with at least ${FINAL_BUILD_MIN} of ${FINAL_BUILD_MARKS} on the independent build.`);
    nextStep = "Open the revision plan, work through the first recommended step, then take a fresh form of the assessment.";
  }

  return {
    outcome,
    mark,
    knowledge,
    practical,
    debug,
    build,
    mandatoryPassed,
    needsVerification: unverified.length > 0,
    reasons,
    nextStep,
  };
}

export function markWord(outcome: Outcome): string {
  return outcomeLabel(outcome);
}

/* --------------------------------------------------------------- form rotation */

/*
 * Form selection. A form is never reused while an unused form remains, and the form
 * used for the immediately preceding attempt is never served again. When every form
 * has been used, the least recently used eligible form is chosen.
 */
export function selectForm<T extends { id: string }>(forms: T[], historyNewestFirst: string[]): T | null {
  if (forms.length === 0) return null;
  const previous = historyNewestFirst[0];
  const used = new Set(historyNewestFirst);
  const unused = forms.filter((form) => !used.has(form.id));
  if (unused.length > 0) return unused[0];
  const eligible = forms.filter((form) => form.id !== previous);
  if (eligible.length === 0) return forms[0];
  const lastUsedAt = new Map<string, number>();
  historyNewestFirst.forEach((id, index) => {
    if (!lastUsedAt.has(id)) lastUsedAt.set(id, index);
  });
  return eligible.reduce((best, form) => {
    const bestAge = lastUsedAt.get(best.id) ?? Number.POSITIVE_INFINITY;
    const age = lastUsedAt.get(form.id) ?? Number.POSITIVE_INFINITY;
    return age > bestAge ? form : best;
  }, eligible[0]);
}

/* ------------------------------------------------------------------- content -- */

export function findModuleForm(content: CourseAssessment, moduleId: string, formId?: string): ModuleForm | null {
  const forms = content.moduleForms.filter((form) => form.moduleId === moduleId);
  if (forms.length === 0) return null;
  if (formId) return forms.find((form) => form.id === formId) || null;
  return forms[0];
}

export function moduleFormOf(content: CourseAssessment, formId: string): ModuleForm | null {
  return content.moduleForms.find((form) => form.id === formId) || null;
}

export function finalFormOf(content: CourseAssessment, formId: string): FinalForm | null {
  return content.finalForms.find((form) => form.id === formId) || null;
}

export function contentVersionOf(content: CourseAssessment): string {
  return content.contentVersion || CONTENT_VERSION;
}

/* ---------------------------------------------------- what the client may see -- */

export type ClientKnowledge = { itemId: string; prompt: string; options: string[] };
export type ClientRequirement = { id: string; label: string; marks: number; mandatory: string | null };
export type ClientTask = {
  itemId: string;
  title: string;
  brief: string;
  marks: number;
  editableFiles: string[];
  starterFiles: Partial<CodeFiles>;
  requirements: ClientRequirement[];
};
export type ClientAssessment = {
  attemptId: string;
  courseId: string;
  kind: "module" | "final";
  moduleId: string | null;
  moduleTitle: string;
  formVariant: string;
  contentVersion: string;
  stage: string;
  status: string;
  savedAt: string | null;
  rules: string[];
  knowledge: ClientKnowledge[];
  practical: ClientTask | null;
  debug: ClientTask[];
  build: ClientTask | null;
  defenceRequired: boolean;
};

export function toClientKnowledge(item: KnowledgeItem): ClientKnowledge {
  /* The correct option, the explanation and the misconception tags stay on the server. */
  return { itemId: item.id, prompt: item.prompt, options: [...item.options] };
}

export function toClientTask(task: CodeTask): ClientTask {
  return {
    itemId: task.id,
    title: task.title,
    brief: task.brief,
    marks: task.requirements.reduce((total, requirement) => total + requirement.marks, 0),
    editableFiles: [...task.editableFiles],
    starterFiles: { ...task.starterFiles },
    requirements: task.requirements.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      marks: requirement.marks,
      mandatory: requirement.mandatory ?? null,
    })),
  };
}

/* ------------------------------------------------------------------ revision -- */

export type RevisionConcept = {
  concept: string;
  label: string;
  mandatory: string | null;
  status: string;
  lessonId: string;
};

/*
 * The recovery plan is built from what actually went wrong, in catalog order, and
 * never invents advice. Only weak or mandatorily unmet concepts are listed, so a skill
 * the learner already has is never sent back through revision.
 */
export function revisionConceptsFrom(results: ItemResult[], lessonByConcept: Record<string, string>): RevisionConcept[] {
  const concepts = new Map<string, RevisionConcept>();
  for (const result of results) {
    const weak = result.status !== "met";
    const requirements = result.requirements.filter((entry) => entry.status !== "met");
    if (!weak && requirements.length === 0) continue;
    if (result.requirements.length === 0) {
      if (result.status !== "met") {
        concepts.set(result.concept, {
          concept: result.concept,
          label: result.concept,
          mandatory: null,
          status: result.status,
          lessonId: lessonByConcept[result.concept] || "",
        });
      }
      continue;
    }
    for (const requirement of requirements) {
      if (!concepts.has(requirement.concept)) {
        concepts.set(requirement.concept, {
          concept: requirement.concept,
          label: requirement.label,
          mandatory: requirement.mandatory,
          status: requirement.status,
          lessonId: lessonByConcept[requirement.concept] || "",
        });
      }
    }
  }
  return [...concepts.values()];
}

/* ------------------------------------------------------------------ defence --- */

export function defenceComplete(explain: string, predictChosen: number | null, changeSubmitted: boolean): boolean {
  const words = explain.trim().split(/\s+/).filter((word) => word.length > 0).length;
  return words >= DEFENCE_MIN_WORDS && predictChosen !== null && changeSubmitted;
}

/*
 * The defence signals that choose which task to show. They can only add a check: the
 * score is computed from the answers, never from these counts.
 */
export function escalatedDefence(signals: {
  visibilityChanges: number;
  pasteEvents: number;
  largestPasteChars: number;
}): boolean {
  return signals.pasteEvents >= 2 || signals.largestPasteChars >= 400 || signals.visibilityChanges >= 4;
}

export function submissionFrom(value: { answers?: unknown; code?: unknown }): Submission {
  /* An answer outside the accepted range is treated as unanswered rather than being
   * carried into grading, so a malformed body can never line up with an option. */
  const answers = Array.isArray(value.answers)
    ? value.answers.map((entry) =>
      typeof entry === "number" && Number.isInteger(entry) && entry >= 0 && entry <= 2 ? entry : -1)
    : [];
  const code = value.code && typeof value.code === "object" ? (value.code as Submission["code"]) : {};
  return { answers, code };
}