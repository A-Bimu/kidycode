/*
 * The code defence library.
 *
 * One reviewed template set per course, written and checked in the repository. Nothing here is
 * generated at assessment time: the server picks a template, records which one it used, and
 * grades the prediction and the live change with the same deterministic checks the rest of the
 * engine uses. The explain answer is stored as evidence and never guessed at by keyword scoring.
 */

import type { CourseAssessment, DefenceTemplate } from "@/lib/assessment/types";
import type { CourseId } from "@/lib/course";
import { templates as ages10to12Templates } from "@/lib/assessment/defence/ages-10-12";
import { templates as ages13to15Templates } from "@/lib/assessment/defence/ages-13-15";
import { templates as ages16to18Templates } from "@/lib/assessment/defence/ages-16-18";
import { templates as adultsTemplates } from "@/lib/assessment/defence/adults";

export { ages10to12Templates, ages13to15Templates, ages16to18Templates, adultsTemplates };

export const DEFENCE_TEMPLATES: DefenceTemplate[] = [
  ...ages10to12Templates,
  ...ages13to15Templates,
  ...ages16to18Templates,
  ...adultsTemplates,
];

export const DEFENCE_TEMPLATES_PER_COURSE = 3;
export const DEFENCE_OPTION_COUNT = 4;
export const MIN_DEFENCE_TEXT = 24;
export const EXPLAIN_MIN_WORDS = 12;

export function templatesFor(courseId: CourseId): DefenceTemplate[] {
  return DEFENCE_TEMPLATES.filter((template) => template.courseId === courseId);
}

/* Pick the template a learner meets. The same attempt always gets the same template, so a
 * resumed defence cannot turn into a different question. */
export function defenceTemplateFor(courseId: CourseId, index: number): DefenceTemplate | null {
  const owned = templatesFor(courseId);
  if (owned.length === 0) return null;
  return owned[Math.abs(index) % owned.length];
}

export function defenceTemplateById(id: string): DefenceTemplate | null {
  return DEFENCE_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function defenceProblems(
  contents: CourseAssessment[],
  lessonsFor: (courseId: CourseId) => Set<string>,
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const prompts = new Map<string, string>();

  for (const template of DEFENCE_TEMPLATES) {
    const where = `defence template ${template.id}`;
    if (ids.has(template.id)) problems.push(`${where} has a duplicate id.`);
    ids.add(template.id);

    const course = contents.find((content) => content.courseId === template.courseId);
    if (!course) problems.push(`${where} belongs to a course that has no assessment.`);

    const tasks = [
      ["explain", template.explain],
      ["predict", template.predict],
      ["change", template.change],
      ["escalatedPredict", template.escalatedPredict],
    ] as const;

    for (const [slot, task] of tasks) {
      const at = `${where} ${slot}`;
      if (!task) {
        problems.push(`${at} is missing.`);
        continue;
      }
      if (task.prompt.trim().length < MIN_DEFENCE_TEXT) problems.push(`${at} has no usable prompt.`);
      if (task.explanation.trim().length < MIN_DEFENCE_TEXT) problems.push(`${at} has no usable explanation.`);
      if (task.objectives.length === 0) problems.push(`${at} names no objective.`);
      if (!lessonsFor(template.courseId).has(task.revision)) {
        problems.push(`${at} points at ${task.revision}, a lesson ${template.courseId} does not teach.`);
      }
      const normalised = task.prompt.trim().toLowerCase();
      const owner = prompts.get(normalised);
      if (owner && owner !== template.id) problems.push(`${at} repeats a prompt already used by ${owner}.`);
      prompts.set(normalised, template.id);

      if (slot === "predict" || slot === "escalatedPredict") {
        if (task.kind !== "predict") problems.push(`${at} is not a prediction task.`);
        const options = task.options ?? [];
        if (options.length !== DEFENCE_OPTION_COUNT) {
          problems.push(`${at} offers ${options.length} options, not four.`);
        } else if (new Set(options.map((option) => option.trim())).size !== DEFENCE_OPTION_COUNT) {
          problems.push(`${at} repeats an option.`);
        }
        if (!Number.isInteger(task.answer) || (task.answer ?? -1) < 0 || (task.answer ?? -1) >= options.length) {
          problems.push(`${at} has no answer index in range.`);
        }
      }

      if (slot === "explain") {
        if (task.kind !== "explain") problems.push(`${at} is not an explanation task.`);
        if (task.options || typeof task.answer === "number") {
          problems.push(`${at} offers a choice, so it cannot be the learner's own words.`);
        }
        if (task.snippet.trim().length === 0) problems.push(`${at} shows nothing to talk about.`);
      }

      if (slot === "change") {
        if (task.kind !== "change") problems.push(`${at} is not a live change task.`);
        if (!task.changeInstruction || task.changeInstruction.trim().length < MIN_DEFENCE_TEXT) {
          problems.push(`${at} does not say what to change.`);
        }
        if (!task.changeRequirement) {
          problems.push(`${at} has no requirement check, so the change cannot be decided.`);
        }
      }
    }

    if (/\u2014/.test(JSON.stringify(template))) problems.push(`${where} contains an em dash.`);
    if (/\bgreen\b/i.test(JSON.stringify(template))) {
      problems.push(`${where} refers to green, which this interface never uses.`);
    }
  }

  for (const content of contents) {
    const owned = DEFENCE_TEMPLATES.filter((template) => template.courseId === content.courseId);
    if (owned.length !== DEFENCE_TEMPLATES_PER_COURSE) {
      problems.push(`${content.courseId} has ${owned.length} defence templates, not three.`);
    }
  }

  return problems;
}