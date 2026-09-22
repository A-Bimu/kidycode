/*
 * The machine-readable blueprint every course bank must satisfy, and the one function
 * that decides whether a bank is acceptable.
 *
 * The rules here are the contract, not a formality: the same function is used by the
 * content validator, by the tests that build a deliberately broken bank to prove the
 * validator can fail, and by the release report. Content coverage is judged against the
 * real course catalogue, so "nothing is assessed before it is taught" is checked rather
 * than asserted.
 */

import { courses } from "@/lib/course-catalog";
import { CONTENT_VERSION, type CourseAssessment, type ModuleForm, type Requirement, type RequirementCheck } from "@/lib/assessment/types";
import type { CourseId } from "@/lib/course";

export const MODULE_KNOWLEDGE_ITEMS = 5;
export const MODULE_KNOWLEDGE_MARK = 1;
export const MODULE_PRACTICAL_REQUIREMENTS = 5;
export const MODULE_REQUIREMENT_MARK = 1;
export const MODULE_TOTAL_MARKS = MODULE_KNOWLEDGE_ITEMS * MODULE_KNOWLEDGE_MARK + MODULE_PRACTICAL_REQUIREMENTS * MODULE_REQUIREMENT_MARK;
export const MODULE_PASS_MARK = 7;
export const MODULE_PRACTICAL_MIN = 3;
export const FORMS_PER_MODULE = 3;
export const FORM_VARIANTS = ["A", "B", "C"] as const;
export const FINAL_KNOWLEDGE_ITEMS = 10;
export const FINAL_KNOWLEDGE_MARK = 2;
export const FINAL_DEBUG_TASKS = 3;
export const FINAL_DEBUG_MARK = 10;
export const FINAL_DEBUG_REQUIREMENT_MARK = 2;
export const FINAL_BUILD_MARKS = 50;
export const FINAL_BUILD_REQUIREMENTS = 10;
export const FINAL_BUILD_REQUIREMENT_MARK = 5;
export const FINAL_BUILD_MIN = 30;
export const FINAL_FORMS = 3;
export const FINAL_TOTAL_MARKS =
  FINAL_KNOWLEDGE_ITEMS * FINAL_KNOWLEDGE_MARK + FINAL_DEBUG_TASKS * FINAL_DEBUG_MARK + FINAL_BUILD_MARKS;
export const MIN_EXPLANATION_LENGTH = 24;
export const MIN_PROMPT_LENGTH = 15;
export const ANSWER_POSITION_SHARE = 0.15;

/* How many modules of each course must carry at least one mandatory requirement, and
 * which kinds of mandatory check the course must contain where it teaches them. */
export const MANDATORY_POLICY: Record<CourseId, { minModules: number; requireAccessibility: boolean; requirePrivacyOrSafety: boolean }> = {
  "ages-10-12": { minModules: 3, requireAccessibility: true, requirePrivacyOrSafety: true },
  "ages-13-15": { minModules: 3, requireAccessibility: true, requirePrivacyOrSafety: true },
  "ages-16-18": { minModules: 3, requireAccessibility: true, requirePrivacyOrSafety: true },
  adults: { minModules: 3, requireAccessibility: true, requirePrivacyOrSafety: true },
};

export const REQUIRED_COURSES: CourseId[] = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"];

export type Blueprint = {
  courseId: CourseId;
  moduleCount: number;
  formsPerModule: number;
  moduleTotalMarks: number;
  moduleKnowledge: { items: number; marks: number };
  modulePractical: { requirements: number; marks: number };
  finalMarks: number;
  mandatory: (typeof MANDATORY_POLICY)[CourseId];
};

export function blueprintFor(courseId: CourseId): Blueprint {
  const course = courses[courseId];
  return {
    courseId,
    moduleCount: course.stages.length,
    formsPerModule: FORMS_PER_MODULE,
    moduleTotalMarks: MODULE_TOTAL_MARKS,
    moduleKnowledge: { items: MODULE_KNOWLEDGE_ITEMS, marks: MODULE_KNOWLEDGE_MARK },
    modulePractical: { requirements: MODULE_PRACTICAL_REQUIREMENTS, marks: MODULE_REQUIREMENT_MARK },
    finalMarks: FINAL_TOTAL_MARKS,
    mandatory: MANDATORY_POLICY[courseId],
  };
}

function checkFile(check: RequirementCheck): string | null {
  if (check.kind === "cannot-verify") return null;
  if (check.kind === "increase") return checkFile(check.inner);
  return check.file;
}

function lessonIds(courseId: CourseId, moduleId: string): Set<string> {
  const stage = courses[courseId].stages.find((entry) => entry.id === moduleId);
  return new Set(stage ? stage.lessons.map((lesson) => lesson.id) : []);
}

function taughtFiles(courseId: CourseId, moduleId: string): Set<string> {
  const stage = courses[courseId].stages.find((entry) => entry.id === moduleId);
  const files = new Set<string>();
  for (const lesson of stage?.lessons ?? []) for (const file of lesson.editableFiles) files.add(file);
  return files;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

/* The banned words are decided from the words a learner can read, in the same way the
 * brand validator decides the colour rule. */
function styleProblems(text: string, where: string): string[] {
  const problems: string[] = [];
  if (text.includes("\u2014")) problems.push(`${where} contains an em dash.`);
  if (/\bgreen\b/i.test(text)) problems.push(`${where} contains the banned colour name.`);
  return problems;
}

export type BankScope = "modules" | "complete";

/*
 * Every problem with one course bank, as a list of readable messages. An empty list is
 * the only acceptable result.
 */
export function bankProblems(
  content: CourseAssessment,
  options: { scope?: BankScope; knownIds?: Set<string>; requireContent?: boolean } = {},
): string[] {
  const scope = options.scope ?? "complete";
  const courseId = content.courseId;
  const problems: string[] = [];
  const seenIds = new Set<string>(options.knownIds ?? []);
  const seenPrompts = new Map<string, string>();

  if (options.requireContent !== false && content.moduleForms.length === 0 && content.finalForms.length === 0) {
    return [`${courseId} has no reviewed content yet.`];
  }
  if (content.contentVersion !== CONTENT_VERSION) {
    problems.push(`${courseId} was written against content version ${content.contentVersion}, not ${CONTENT_VERSION}.`);
  }

  const course = courses[courseId];
  const moduleIds = course.stages.map((stage) => stage.id);
  const blueprint = blueprintFor(courseId);

  const duplicate = (id: string, where: string) => {
    if (seenIds.has(id)) problems.push(`${where} reuses the id ${id}.`);
    seenIds.add(id);
  };

  const byModule = new Map<string, ModuleForm[]>();
  for (const form of content.moduleForms) {
    if (!moduleIds.includes(form.moduleId)) {
      problems.push(`${form.id} claims module ${form.moduleId}, which is not part of ${courseId}.`);
      continue;
    }
    if (form.courseId !== courseId) problems.push(`${form.id} belongs to another course.`);
    const list = byModule.get(form.moduleId) ?? [];
    list.push(form);
    byModule.set(form.moduleId, list);
  }

  if (byModule.size > 0) {
    for (const moduleId of moduleIds) {
      const forms = byModule.get(moduleId) ?? [];
      if (forms.length !== blueprint.formsPerModule) {
        problems.push(`${courseId} module ${moduleId} has ${forms.length} forms, not ${blueprint.formsPerModule}.`);
        continue;
      }
      const variants = forms.map((form) => form.variant).sort().join("");
      if (variants !== [...FORM_VARIANTS].sort().join("")) {
        problems.push(`${courseId} module ${moduleId} does not carry exactly the variants A, B and C.`);
      }
      const lessons = lessonIds(courseId, moduleId);
      const files = taughtFiles(courseId, moduleId);
      const ideaSets: string[] = [];
      const profiles: string[] = [];

      for (const form of forms) {
        const where = `${form.id}`;
        duplicate(form.id, where);
        if (form.knowledge.length !== blueprint.moduleKnowledge.items) {
          problems.push(`${where} has ${form.knowledge.length} knowledge items, not ${blueprint.moduleKnowledge.items}.`);
        }
        const knowledgeMarks = form.knowledge.reduce((total, item) => total + item.marks, 0);
        if (knowledgeMarks !== blueprint.moduleKnowledge.items * blueprint.moduleKnowledge.marks) {
          problems.push(`${where} awards ${knowledgeMarks} knowledge marks, not ${blueprint.moduleKnowledge.items * blueprint.moduleKnowledge.marks}.`);
        }
        const requirements = form.practical.requirements;
        if (requirements.length !== blueprint.modulePractical.requirements) {
          problems.push(`${where} has ${requirements.length} practical requirements, not ${blueprint.modulePractical.requirements}.`);
        }
        const practicalMarks = requirements.reduce((total, requirement) => total + requirement.marks, 0);
        if (practicalMarks !== blueprint.modulePractical.requirements * blueprint.modulePractical.marks) {
          problems.push(`${where} awards ${practicalMarks} practical marks, not ${blueprint.modulePractical.requirements * blueprint.modulePractical.marks}.`);
        }
        if (knowledgeMarks + practicalMarks !== blueprint.moduleTotalMarks) {
          problems.push(`${where} totals ${knowledgeMarks + practicalMarks}, not ${blueprint.moduleTotalMarks}.`);
        }

        const ideas: string[] = [];
        for (const item of form.knowledge) {
          duplicate(item.id, where);
          const itemWhere = `${item.id}`;
          ideas.push(item.concept);
          if (!Number.isInteger(item.marks) || item.marks < 1) problems.push(`${itemWhere} has an invalid mark.`);
          if (!lessons.has(item.objective)) problems.push(`${itemWhere} is assessed against ${item.objective}, which this module does not teach.`);
          if (!lessons.has(item.revision)) problems.push(`${itemWhere} points its revision at ${item.revision}, which this module does not teach.`);
          if (!item.concept.startsWith(`${courseId}:${moduleId}:`)) problems.push(`${itemWhere} uses a concept key from outside its module.`);
          if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 2) problems.push(`${itemWhere} has an invalid answer.`);
          if (new Set(item.options).size !== item.options.length) problems.push(`${itemWhere} repeats an option.`);
          const chosen = item.options[item.answer];
          if (!chosen || chosen.trim().length === 0) problems.push(`${itemWhere} has an empty correct option.`);
          if (item.options.some((option) => option.trim().length === 0)) problems.push(`${itemWhere} has an empty option.`);
          if (item.explanation.length < MIN_EXPLANATION_LENGTH) problems.push(`${itemWhere} needs a fuller explanation.`);
          if (item.prompt.length < MIN_PROMPT_LENGTH) problems.push(`${itemWhere} needs a fuller question.`);
          const wrongTags = item.misconceptions.filter((_, index) => index !== item.answer);
          if (wrongTags.length < 2 || wrongTags.some((tag) => tag.trim().length === 0)) {
            problems.push(`${itemWhere} has no misconception tag on every wrong option.`);
          }
          problems.push(...styleProblems(`${item.prompt} ${item.options.join(" ")} ${item.explanation}`, itemWhere));
          const prompt = normalise(item.prompt);
          const previous = seenPrompts.get(prompt);
          if (previous) problems.push(`${itemWhere} repeats the question from ${previous}.`);
          seenPrompts.set(prompt, itemWhere);
        }

        for (const requirement of requirements) {
          duplicate(requirement.id, where);
          if (!Number.isInteger(requirement.marks) || requirement.marks < 1) problems.push(`${requirement.id} has an invalid mark.`);
          if (!requirement.concept.startsWith(`${courseId}:${moduleId}:`)) problems.push(`${requirement.id} uses a concept key from outside its module.`);
          if (requirement.revision && !lessons.has(requirement.revision)) {
            problems.push(`${requirement.id} points its revision at a lesson this module does not teach.`);
          }
          const file = checkFile(requirement.check);
          if (file && !files.has(file)) {
            problems.push(`${requirement.id} checks a ${file} skill this module has not taught yet.`);
          }
          ideas.push(requirement.concept);
          problems.push(...styleProblems(requirement.label, requirement.id));
        }
        problems.push(...styleProblems(`${form.practical.title} ${form.practical.brief}`, where));

        for (const file of form.practical.editableFiles) {
          if (!files.has(file)) problems.push(`${where} asks the learner to edit a ${file} file this module has not taught.`);
        }
        if (!form.practical.editableFiles.includes("html") && form.practical.editableFiles.length === 0) {
          problems.push(`${where} has no editable file.`);
        }
        const starter = form.practical.starterFiles;
        if (!starter.html && !starter.css && !starter.javascript) {
          problems.push(`${where} starts from no code at all.`);
        }

        ideaSets.push([...new Set(ideas)].sort().join(","));
        profiles.push(JSON.stringify(form.difficultyProfile));
      }

      if (new Set(ideaSets).size !== 1) {
        problems.push(`${courseId} module ${moduleId} does not cover the same ideas in all three forms.`);
      }
      if (new Set(profiles).size !== 1) {
        problems.push(`${courseId} module ${moduleId} does not carry the same difficulty profile in all three forms.`);
      }
      if (ideaSets.length > 0 && ideaSets[0].split(",").length < MODULE_KNOWLEDGE_ITEMS) {
        problems.push(`${courseId} module ${moduleId} covers only ${ideaSets[0].split(",").length} ideas.`);
      }

      /* Curriculum coverage: every challenge lesson of the module must be assessed. */
      const assessed = new Set<string>();
      for (const form of forms) {
        for (const item of form.knowledge) assessed.add(item.objective);
        for (const requirement of form.practical.requirements) assessed.add(requirement.revision ?? form.practical.objective);
      }
      for (const lesson of courses[courseId].stages.find((stage) => stage.id === moduleId)?.lessons ?? []) {
        if (lesson.activityType !== "challenge") continue;
        if (!assessed.has(lesson.id)) {
          problems.push(`${courseId} module ${moduleId} never assesses the lesson ${lesson.id}.`);
        }
      }
    }

    /* Mandatory policy. */
    const mandatoryByModule = new Map<string, Requirement[]>();
    for (const form of content.moduleForms) {
      for (const requirement of form.practical.requirements) {
        if (!requirement.mandatory) continue;
        mandatoryByModule.set(form.moduleId, [...(mandatoryByModule.get(form.moduleId) ?? []), requirement]);
      }
    }
    if (mandatoryByModule.size < blueprint.mandatory.minModules) {
      problems.push(`${courseId} carries mandatory checks in ${mandatoryByModule.size} modules, fewer than the ${blueprint.mandatory.minModules} required.`);
    }
    const allMandatory = [...mandatoryByModule.values()].flat().map((requirement) => requirement.mandatory);
    if (blueprint.mandatory.requireAccessibility && !allMandatory.includes("accessibility")) {
      problems.push(`${courseId} has no mandatory accessibility check.`);
    }
    if (blueprint.mandatory.requirePrivacyOrSafety
      && !allMandatory.includes("privacy") && !allMandatory.includes("safety")) {
      problems.push(`${courseId} has no mandatory privacy or safety check.`);
    }
  }

  /* The deliberately undecidable check may never be used to carry a mark, because a
   * learner would then lose it for something nobody can confirm. */
  for (const form of content.moduleForms) {
    for (const requirement of form.practical.requirements) {
      if (requirement.check.kind === "cannot-verify" && !requirement.mandatory) {
        problems.push(`${requirement.id} is undecidable and not mandatory, so it would hold a mark hostage.`);
      }
    }
  }

  /* A requirement that asks for the absence of something is met by an empty page, so a
   * form may never carry enough of them for empty code to reach the practical floor. */
  for (const form of content.moduleForms) {
    const absence = form.practical.requirements.filter((requirement) =>
      requirement.check.kind === "js-absent"
      || (requirement.check.kind === "html-text-free-of") || (requirement.check.kind === "increase" && requirement.check.inner.kind === "js-absent"));
    if (absence.length >= MODULE_PRACTICAL_MIN) {
      problems.push(`${form.id} could reach the practical floor with an empty submission (${absence.length} absence requirements).`);
    }
  }

  /* Answer positions must not be predictable. */
  const knowledge = content.moduleForms.flatMap((form) => form.knowledge);
  if (knowledge.length >= 20) {
    for (const position of [0, 1, 2]) {
      const share = knowledge.filter((item) => item.answer === position).length / knowledge.length;
      if (share < ANSWER_POSITION_SHARE) {
        problems.push(`${courseId} puts the correct answer at position ${position} only ${Math.round(share * 100)}% of the time.`);
      }
    }
  }

  if (scope === "complete") {
    if (content.finalForms.length !== FINAL_FORMS) {
      problems.push(`${courseId} has ${content.finalForms.length} final forms, not ${FINAL_FORMS}.`);
    }
    if (content.moduleForms.length !== moduleIds.length * FORMS_PER_MODULE) {
      problems.push(`${courseId} has ${content.moduleForms.length} module forms, not ${moduleIds.length * FORMS_PER_MODULE}.`);
    }
    if (content.defence.length > 0 && content.defence.length < 3) {
      /* The defence templates arrive in their own phase; this only refuses a partial set. */
      problems.push(`${courseId} has ${content.defence.length} defence templates, fewer than three.`);
    }

    const courseFiles = new Set<string>();
    for (const moduleId of moduleIds) for (const file of taughtFiles(courseId, moduleId)) courseFiles.add(file);

    const coverage: string[] = [];
    for (const form of content.finalForms) {
      const where = form.id;
      duplicate(form.id, where);
      if (form.knowledge.length !== FINAL_KNOWLEDGE_ITEMS) {
        problems.push(`${where} has ${form.knowledge.length} knowledge questions, not ${FINAL_KNOWLEDGE_ITEMS}.`);
      }
      for (const item of form.knowledge) {
        duplicate(item.id, where);
        if (item.marks !== FINAL_KNOWLEDGE_MARK) problems.push(`${item.id} carries ${item.marks} marks, not ${FINAL_KNOWLEDGE_MARK}.`);
        if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 2) problems.push(`${item.id} has an invalid answer.`);
        if (item.explanation.length < MIN_EXPLANATION_LENGTH) problems.push(`${item.id} needs a fuller explanation.`);
        const wrongTags = item.misconceptions.filter((_, index) => index !== item.answer);
        if (wrongTags.some((tag) => tag.trim().length === 0)) problems.push(`${item.id} has no misconception tag on every wrong option.`);
        problems.push(...styleProblems(`${item.prompt} ${item.options.join(" ")}`, item.id));
        const prompt = normalise(item.prompt);
        const previous = seenPrompts.get(prompt);
        if (previous) problems.push(`${item.id} repeats the question from ${previous}.`);
        seenPrompts.set(prompt, item.id);
      }
      if (form.debug.length !== FINAL_DEBUG_TASKS) {
        problems.push(`${where} has ${form.debug.length} debugging tasks, not ${FINAL_DEBUG_TASKS}.`);
      }
      for (const task of form.debug) {
        duplicate(task.id, where);
        const marks = task.requirements.reduce((total, requirement) => total + requirement.marks, 0);
        if (marks !== FINAL_DEBUG_MARK) problems.push(`${task.id} carries ${marks} marks, not ${FINAL_DEBUG_MARK}.`);
        for (const requirement of task.requirements) {
          duplicate(requirement.id, where);
          const file = checkFile(requirement.check);
          if (file && !courseFiles.has(file)) problems.push(`${requirement.id} checks a ${file} skill this course has not taught.`);
          if (requirement.check.kind === "cannot-verify" && !requirement.mandatory) {
            problems.push(`${requirement.id} is undecidable and not mandatory.`);
          }
          problems.push(...styleProblems(requirement.label, requirement.id));
        }
        problems.push(...styleProblems(`${task.title} ${task.brief}`, task.id));
      }
      const buildMarks = form.build.requirements.reduce((total, requirement) => total + requirement.marks, 0);
      if (form.build.requirements.length !== FINAL_BUILD_REQUIREMENTS) {
        problems.push(`${form.build.id} has ${form.build.requirements.length} requirements, not ${FINAL_BUILD_REQUIREMENTS}.`);
      }
      if (buildMarks !== FINAL_BUILD_MARKS) problems.push(`${form.build.id} carries ${buildMarks} marks, not ${FINAL_BUILD_MARKS}.`);
      duplicate(form.build.id, where);
      const mandatoryKinds = form.build.requirements.filter((requirement) => requirement.mandatory).map((requirement) => requirement.mandatory);
      if (!mandatoryKinds.includes("accessibility")) problems.push(`${form.build.id} has no mandatory accessibility requirement.`);
      if (!mandatoryKinds.includes("privacy") && !mandatoryKinds.includes("safety")) {
        problems.push(`${form.build.id} has no mandatory privacy or safety requirement.`);
      }
      const absence = form.build.requirements.filter((requirement) =>
        requirement.check.kind === "js-absent" || requirement.check.kind === "html-text-free-of").length;
      if (absence >= FINAL_BUILD_MIN) {
        problems.push(`${form.build.id} could reach the build floor with an empty submission.`);
      }
      for (const requirement of form.build.requirements) {
        duplicate(requirement.id, where);
        const file = checkFile(requirement.check);
        if (file && !courseFiles.has(file)) problems.push(`${requirement.id} checks a ${file} skill this course has not taught.`);
        problems.push(...styleProblems(requirement.label, requirement.id));
      }
      problems.push(...styleProblems(`${form.build.title} ${form.build.brief}`, form.build.id));

      const total = form.knowledge.reduce((sum, item) => sum + item.marks, 0)
        + form.debug.reduce((sum, task) => sum + task.requirements.reduce((inner, requirement) => inner + requirement.marks, 0), 0)
        + buildMarks;
      if (total !== FINAL_TOTAL_MARKS) problems.push(`${where} totals ${total} marks, not ${FINAL_TOTAL_MARKS}.`);
      coverage.push([...new Set(form.knowledge.map((item) => item.moduleId))].sort().join(","));
    }
    if (new Set(coverage).size !== 1 && coverage.length > 1) {
      problems.push(`${courseId} final forms do not cover the same modules as each other.`);
    }
  }

  return problems;
}