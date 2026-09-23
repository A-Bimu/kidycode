/*
 * The revision library.
 *
 * One pack per assessed concept, kept beside the bank that assesses it. The results screen
 * can only ever point at a concept that has a pack, and the validator refuses to pass while
 * a concept assessed by a bank has no revision page, so a learner can never be told to
 * "revise more" without a page to open.
 */

import type { CourseAssessment, RevisionPack } from "@/lib/assessment/types";
import type { CourseId } from "@/lib/course";
import { packs as ages10to12Packs } from "@/lib/assessment/revision/ages-10-12";
import { packs as ages13to15Packs } from "@/lib/assessment/revision/ages-13-15";
import { packs as ages16to18Packs } from "@/lib/assessment/revision/ages-16-18";
import { packs as adultsPacks } from "@/lib/assessment/revision/adults";

export { ages10to12Packs, ages13to15Packs, ages16to18Packs, adultsPacks };

export const REVISION_PACKS: RevisionPack[] = [
  ...ages10to12Packs,
  ...ages13to15Packs,
  ...ages16to18Packs,
  ...adultsPacks,
];

export const MIN_PACK_TEXT = 24;
export const MIN_PACK_PROMPT = 15;

export function revisionPackFor(concept: string): RevisionPack | null {
  return REVISION_PACKS.find((pack) => pack.concept === concept) ?? null;
}

/* Every concept key an assessment can mark a learner on, with the course that assesses it. */
export function assessedConcepts(content: CourseAssessment): { concept: string; courseId: CourseId }[] {
  const seen = new Map<string, CourseId>();
  for (const form of content.moduleForms) {
    for (const question of form.knowledge) seen.set(question.concept, content.courseId);
    for (const requirement of form.practical.requirements) seen.set(requirement.concept, content.courseId);
  }
  for (const form of content.finalForms) {
    for (const question of form.knowledge) seen.set(question.concept, content.courseId);
    for (const task of [...form.debug, form.build]) {
      for (const requirement of task.requirements) seen.set(requirement.concept, content.courseId);
    }
  }
  return [...seen.entries()].map(([concept, courseId]) => ({ concept, courseId }));
}

/* The shape rules a revision page must satisfy to be reachable by a learner. */
export function packProblems(
  pack: RevisionPack,
  lessonsFor: (courseId: CourseId) => Set<string>,
  promptsSeen: Map<string, string>,
): string[] {
  const problems: string[] = [];
  const where = `revision pack ${pack.concept}`;
  const text = (value: string, field: string, minimum = MIN_PACK_TEXT) => {
    if (!value || value.trim().length < minimum) problems.push(`${where} has no usable ${field}.`);
  };

  text(pack.title, "title", 8);
  text(pack.meaning, "meaning");
  text(pack.whyItMatters, "why it matters");
  text(pack.workedExample, "worked example");
  text(pack.commonMistake, "common mistake");
  text(pack.independent, "independent task", MIN_PACK_PROMPT);

  if (pack.courses.length === 0) problems.push(`${where} does not name a course.`);
  for (const courseId of pack.courses) {
    if (!lessonsFor(courseId).has(pack.lessonId)) {
      problems.push(`${where} links to lesson ${pack.lessonId}, which course ${courseId} does not teach.`);
    }
  }

  if (pack.guided.length !== 2) problems.push(`${where} has ${pack.guided.length} guided questions, not two.`);
  if (pack.hints.length !== 3) problems.push(`${where} has ${pack.hints.length} hints, not three.`);
  if (pack.readiness.length < 1) problems.push(`${where} has no readiness check.`);

  for (const [index, question] of [...pack.guided, ...pack.readiness].entries()) {
    const at = `${where} question ${index + 1}`;
    if (question.prompt.trim().length < MIN_PACK_PROMPT) problems.push(`${at} has no usable prompt.`);
    if (question.options.length !== 3) problems.push(`${at} does not offer three options.`);
    if (new Set(question.options.map((option) => option.trim())).size !== 3) {
      problems.push(`${at} repeats an option.`);
    }
    if (question.options.some((option) => option.trim().length === 0)) problems.push(`${at} has an empty option.`);
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 2) {
      problems.push(`${at} has no answer index in range.`);
    }
    if (question.explanation.trim().length < MIN_PACK_TEXT) problems.push(`${at} has no usable explanation.`);
    const normalised = question.prompt.trim().toLowerCase();
    const owner = promptsSeen.get(normalised);
    if (owner && owner !== pack.concept) problems.push(`${at} repeats a prompt already used by ${owner}.`);
    promptsSeen.set(normalised, pack.concept);
  }

  for (const hint of pack.hints) text(hint, "hint");

  /* Brand and privacy rules that apply to every learner-facing word. */
  if (/\u2014/.test(JSON.stringify(pack))) problems.push(`${where} contains an em dash.`);
  if (/\bgreen\b/i.test(JSON.stringify(pack))) problems.push(`${where} refers to green, which this interface never uses.`);

  return problems;
}

export function revisionProblems(
  contents: CourseAssessment[],
  lessonsFor: (courseId: CourseId) => Set<string>,
): string[] {
  const problems: string[] = [];
  const packs = REVISION_PACKS;
  const promptsSeen = new Map<string, string>();

  const byConcept = new Map<string, RevisionPack>();
  for (const pack of packs) {
    if (byConcept.has(pack.concept)) problems.push(`two revision packs claim ${pack.concept}.`);
    byConcept.set(pack.concept, pack);
  }

  for (const content of contents) {
    for (const { concept } of assessedConcepts(content)) {
      const pack = byConcept.get(concept);
      if (!pack) {
        problems.push(`${content.courseId} assesses ${concept}, which has no revision pack.`);
        continue;
      }
      if (!pack.courses.includes(content.courseId)) {
        problems.push(`${concept} is assessed by ${content.courseId} but its pack does not name that course.`);
      }
    }
  }

  for (const pack of packs) problems.push(...packProblems(pack, lessonsFor, promptsSeen));

  /* A pack nothing assesses is dead content a learner can never reach. */
  const assessed = new Set(contents.flatMap((content) => assessedConcepts(content).map((item) => item.concept)));
  for (const pack of packs) {
    if (!assessed.has(pack.concept)) problems.push(`${pack.concept} has a revision pack that no assessment can reach.`);
  }

  return problems;
}
