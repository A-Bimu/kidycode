/*
 * The content factory.
 *
 * Every reviewed item in every bank is built here, so the metadata an item must carry
 * (stable id, content version, course, module, assessed objective, concept key, form,
 * difficulty, cognitive level, marks, rubric, answer, explanation, misconception tags,
 * revision link) can never be forgotten by hand. The author supplies the teaching
 * content and the choices; the factory supplies the contract.
 *
 * The assessed objective is always a real lesson of the module taken from the course
 * catalogue, which is what makes "nothing is tested before it is taught" checkable
 * rather than a promise.
 */

import { courses } from "@/lib/course-catalog";
import {
  CONTENT_VERSION,
  type CodeTask,
  type CssValueClass,
  type Difficulty,
  type CognitiveLevel,
  type FileKey,
  type JsFact,
  type KnowledgeItem,
  type MandatoryKind,
  type Requirement,
  type RequirementCheck,
} from "@/lib/assessment/types";
import type { CourseId } from "@/lib/course";
import type { ModuleForm } from "@/lib/assessment/types";

export type Idea = {
  slug: string;
  lesson: string;
  difficulty: Difficulty;
  cognitive: CognitiveLevel;
  mandatory?: MandatoryKind;
};

export type AuthoredQuestion = [idea: string, prompt: string, correct: string, wrongOne: string, wrongTwo: string, explanation: string, tags: string];

export type AuthoredRequirement = [label: string, check: RequirementCheck, idea: string, mandatory?: MandatoryKind];

export type PracticalSpec = {
  title: string;
  brief: string;
  requirements: AuthoredRequirement[];
  editable?: FileKey[];
  starter?: { html?: string; css?: string; javascript?: string };
  /* The idea the whole task is about, used for the revision link and the defence. */
  focus: string;
};

export const FORM_VARIANTS = ["A", "B", "C"] as const;

export function moduleOf(courseId: CourseId, moduleId: string) {
  const course = courses[courseId];
  const stage = course.stages.find((entry) => entry.id === moduleId);
  if (!stage) throw new Error(`Module ${moduleId} does not belong to ${courseId}.`);
  return stage;
}

/* The real lesson a concept is taught in, resolved from the catalogue. */
export function lessonFor(courseId: CourseId, moduleId: string, slug: string) {
  const stage = moduleOf(courseId, moduleId);
  const lesson = stage.lessons.find((entry) => entry.id === `${moduleId}-${slug}` || entry.id.endsWith(`-${slug}`));
  if (!lesson) throw new Error(`Lesson ${slug} does not belong to module ${moduleId}.`);
  return lesson;
}

/* The module's own project starter, so a practical task always begins from code the
   learner has already met rather than unfamiliar material. */
export function projectStarter(courseId: CourseId, moduleId: string): { html: string; css: string; javascript: string } {
  const stage = moduleOf(courseId, moduleId);
  const project = stage.lessons.find((entry) => entry.activityType === "project");
  return {
    html: project?.starterFiles.html ?? "",
    css: project?.starterFiles.css ?? "",
    javascript: project?.starterFiles.javascript ?? "",
  };
}

export function conceptKey(courseId: CourseId, moduleId: string, slug: string): string {
  return `${courseId}:${moduleId}:${slug}`;
}

/* The pathway courses already carry their course id in the module id, so the prefix is
 * normalised once rather than repeated in every identifier. */
function idPrefix(courseId: CourseId, moduleId: string): string {
  return moduleId.startsWith(`${courseId}-`) ? moduleId : `${courseId}-${moduleId}`;
}

export function itemId(courseId: CourseId, moduleId: string, variant: string, kind: string, index: number): string {
  return `${idPrefix(courseId, moduleId)}-${variant}-${kind}${index}`;
}

/* The answer position is derived from the question itself, so the correct option is
 * never always first and a learner cannot learn a positional shortcut. */
function answerIndex(prompt: string): number {
  return Array.from(prompt).reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
}

export function buildQuestion(
  courseId: CourseId,
  moduleId: string,
  variant: string,
  index: number,
  spec: AuthoredQuestion,
  ideas: Record<string, Idea>,
  marks = 1,
): KnowledgeItem {
  const [ideaSlug, prompt, correct, wrongOne, wrongTwo, explanation, tagSource] = spec;
  const idea = ideas[ideaSlug];
  if (!idea) throw new Error(`Unknown idea ${ideaSlug} in ${moduleId} form ${variant}.`);
  const lesson = lessonFor(courseId, moduleId, idea.lesson);
  const tags = tagSource.split("|").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  if (tags.length < 2) throw new Error(`Question ${index} in ${moduleId} form ${variant} needs a tag for each wrong option.`);
  const answer = answerIndex(prompt);
  const ordered: [string, string, string] = answer === 0
    ? [correct, wrongOne, wrongTwo]
    : answer === 1
      ? [wrongOne, correct, wrongTwo]
      : [wrongOne, wrongTwo, correct];
  const misconceptionAt = [tags[0], tags[1]];
  const misconceptions = answer === 0
    ? ["", misconceptionAt[0], misconceptionAt[1]]
    : answer === 1
      ? [misconceptionAt[0], "", misconceptionAt[1]]
      : [misconceptionAt[0], misconceptionAt[1], ""];
  const options = ordered.map((option) => option.trim());
  return {
    id: itemId(courseId, moduleId, variant, "k", index),
    version: CONTENT_VERSION,
    courseId,
    moduleId,
    formVariant: variant,
    objective: lesson.id,
    concept: conceptKey(courseId, moduleId, ideaSlug),
    difficulty: idea.difficulty,
    cognitive: idea.cognitive,
    type: "knowledge",
    marks,
    prompt: prompt.trim(),
    options: [options[0], options[1], options[2]],
    answer,
    explanation: explanation.trim(),
    misconceptions,
    revision: lesson.id,
  };
}

export function buildPractical(
  courseId: CourseId,
  moduleId: string,
  variant: string,
  spec: PracticalSpec,
  ideas: Record<string, Idea>,
): CodeTask {
  const focus = ideas[spec.focus];
  if (!focus) throw new Error(`Unknown focus idea ${spec.focus} in ${moduleId} form ${variant}.`);
  const lesson = lessonFor(courseId, moduleId, focus.lesson);
  const starter = spec.starter
    ? { html: spec.starter.html ?? "", css: spec.starter.css ?? "", javascript: spec.starter.javascript ?? "" }
    : projectStarter(courseId, moduleId);
  const requirements: Requirement[] = spec.requirements.map((entry, index) => {
    const [label, check, ideaSlug, mandatory] = entry;
    const idea = ideas[ideaSlug];
    if (!idea) throw new Error(`Unknown requirement idea ${ideaSlug} in ${moduleId} form ${variant}.`);
    return {
      id: `${itemId(courseId, moduleId, variant, "p", 1)}-r${index + 1}`,
      label: label.trim(),
      marks: 1,
      check,
      concept: conceptKey(courseId, moduleId, ideaSlug),
      revision: lessonFor(courseId, moduleId, idea.lesson).id,
      ...(mandatory || idea.mandatory ? { mandatory: mandatory || idea.mandatory } : {}),
    };
  });
  return {
    id: itemId(courseId, moduleId, variant, "p", 1),
    version: CONTENT_VERSION,
    courseId,
    moduleId,
    formVariant: variant,
    type: "practical",
    title: spec.title.trim(),
    brief: spec.brief.trim(),
    objective: lesson.id,
    concept: conceptKey(courseId, moduleId, spec.focus),
    difficulty: focus.difficulty,
    cognitive: "apply",
    marks: requirements.reduce((total, requirement) => total + requirement.marks, 0),
    editableFiles: spec.editable ?? ["html", "css"],
    starterFiles: starter,
    requirements,
    revision: lesson.id,
    allowedSkills: [lesson.language],
  };
}

export function difficultyProfile(items: Array<{ difficulty: Difficulty }>): Record<Difficulty, number> {
  const profile: Record<Difficulty, number> = { foundation: 0, developing: 0, secure: 0, advanced: 0 };
  for (const item of items) profile[item.difficulty] += 1;
  return profile;
}

/* ------------------------------------------------------------------- course ---- */

export type AuthoredForm = { questions: AuthoredQuestion[]; practical: PracticalSpec };
export type AuthoredModule = { ideas: Record<string, Idea>; forms: Record<string, AuthoredForm> };

/*
 * Builds the module forms of one course from the reviewed material. The module number,
 * the variants, the marks and the difficulty profile all come from the blueprint rather
 * than from the author, so two forms of the same module cannot drift apart by accident.
 */
export function buildModuleForms(courseId: CourseId, authored: Record<string, AuthoredModule>): ModuleForm[] {
  const forms: ModuleForm[] = [];
  for (const [moduleId, entry] of Object.entries(authored)) {
    const stage = moduleOf(courseId, moduleId);
    for (const variant of FORM_VARIANTS) {
      const form = entry.forms[variant];
      if (!form) throw new Error(`Module ${moduleId} has no form ${variant}.`);
      const knowledge = form.questions.map((question, index) =>
        buildQuestion(courseId, moduleId, variant, index + 1, question, entry.ideas, 1));
      const practical = buildPractical(courseId, moduleId, variant, form.practical, entry.ideas);
      forms.push({
        id: `${idPrefix(courseId, moduleId)}-form-${variant}`,
        courseId,
        moduleId,
        moduleNumber: stage.number,
        variant,
        knowledge,
        practical,
        difficultyProfile: difficultyProfile([...knowledge, practical]),
        objectives: [...new Set(knowledge.map((item) => item.objective))].sort(),
      });
    }
  }
  return forms;
}

/* ------------------------------------------------------------------- checks ---- */

export const el = (tag: string, min = 1, max?: number): RequirementCheck => ({ kind: "html-element", file: "html", tag, min, ...(max === undefined ? {} : { max }) });
export const attr = (tag: string, attribute: string, minLength?: number, values?: string[]): RequirementCheck => ({ kind: "html-attribute", file: "html", tag, attr: attribute, ...(minLength === undefined ? {} : { minLength }), ...(values === undefined ? {} : { values }) });
export const labelledControls = (): RequirementCheck => ({ kind: "html-labelled-control", file: "html" });
export const fragmentLink = (): RequirementCheck => ({ kind: "html-fragment-link", file: "html" });
export const headingOrder = (): RequirementCheck => ({ kind: "html-heading-order", file: "html" });
export const documentMeta = (): RequirementCheck => ({ kind: "html-document-meta", file: "html" });
export const imageAlt = (): RequirementCheck => ({ kind: "html-image-alt", file: "html" });
export const landmarks = (...tags: string[]): RequirementCheck => ({ kind: "html-landmarks", file: "html", tags });
export const list = (minItems: number): RequirementCheck => ({ kind: "html-list", file: "html", minItems });
export const statusRegion = (): RequirementCheck => ({ kind: "html-status-region", file: "html" });
export const documentLanguage = (): RequirementCheck => ({ kind: "html-language", file: "html" });
export const freeOf = (catalogue: "personal-contact" | "private-location"): RequirementCheck => ({ kind: "html-text-free-of", file: "html", catalogue });
export const decl = (property: string, value: CssValueClass, selector?: string): RequirementCheck => ({ kind: "css-declaration", file: "css", property, value, ...(selector ? { selector } : {}) });
export const breakpoint = (minWidth: number): RequirementCheck => ({ kind: "css-at-rule", file: "css", at: "media", minWidth });
export const namedValues = (min: number): RequirementCheck => ({ kind: "css-custom-properties", file: "css", min });
export const usesVar = (min: number): RequirementCheck => ({ kind: "css-var-usage", file: "css", min });
export const focusRing = (): RequirementCheck => ({ kind: "css-focus-visible", file: "css" });
export const fluidWidth = (): RequirementCheck => ({ kind: "css-fluid-width", file: "css" });
export const readableText = (): RequirementCheck => ({ kind: "css-readability", file: "css" });
export const gridTracks = (minTracks: number): RequirementCheck => ({ kind: "css-grid-tracks", file: "css", minTracks });
export const declaresFunction = (paramsMin = 0, min = 1): RequirementCheck => ({ kind: "js-function", file: "javascript", min, paramsMin });
export const calls = (method: string, min = 1): RequirementCheck => ({ kind: "js-call", file: "javascript", method, min });
export const callback = (method: string, options: { needsReturn?: boolean; needsComparison?: boolean } = {}): RequirementCheck => ({ kind: "js-callback", file: "javascript", method, ...options });
export const js = (fact: JsFact, min = 1): RequirementCheck => ({ kind: "js-structural", file: "javascript", fact, min });
export const assigns = (property: string): RequirementCheck => ({ kind: "js-member-assignment", file: "javascript", property });
export const storage = (method: "setItem" | "getItem" | "removeItem"): RequirementCheck => ({ kind: "js-storage", file: "javascript", method });
export const showsMessage = (...values: string[]): RequirementCheck => ({ kind: "js-literal-any", file: "javascript", values });
export const currentRequestGuard = (): RequirementCheck => ({ kind: "js-request-id", file: "javascript" });
export const avoids = (fact: Extract<JsFact, "innerhtml-assignment" | "eval" | "document-write">): RequirementCheck => ({ kind: "js-absent", file: "javascript", fact });
export const needsPerson = (reason: string): RequirementCheck => ({ kind: "cannot-verify", reason });