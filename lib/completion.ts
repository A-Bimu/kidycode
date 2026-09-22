import type { CourseBundle } from "@/lib/course";

/*
 * The KidyCode course completion record.
 *
 * One calculation, used by the learner portfolio, the learner progress page, the
 * guardian summary and the tests. Nothing here is stored: every figure is derived
 * from the evidence the app already wrote, so there is no second copy of the truth
 * and no editable completion flag.
 *
 * A course is complete only when all three conditions hold:
 *
 *   1. every activity belonging to the learner's course is completed
 *   2. one valid project version is saved for each of the course's modules
 *   3. at least one final assessment belonging to that course was passed
 *
 * Tutor recall cards and reviews are deliberately absent from this file. They are
 * optional practice and must never hold a learner back from completing.
 */

export type CompletionCondition = "activities" | "modules" | "final-assessment";

export type MissingRequirement = {
  kind: CompletionCondition;
  label: string;
  detail: string;
};

export type CompletionRecord = {
  recordName: "KidyCode course completion record";
  courseTitle: string;
  ageRange: string;
  projectTitle: string;
  technologies: string;
  activities: { completed: number; required: number };
  modules: { saved: number; required: number };
  finalAssessment: { status: "not-started" | "attempted" | "passed"; bestScore: number; total: number };
  complete: boolean;
  /* Only ever set when the course is genuinely complete, and only ever from the
   * evidence the three conditions require. */
  completedAt: string | null;
  statement: string;
  missing: MissingRequirement[];
  nextRequirement: MissingRequirement | null;
};

export type CompletionInput = {
  theme: string;
  /* Every activity the learner has finished, with the time it was finished. */
  completedLessons: Map<string, string>;
  /* Modules with a readable saved project version, and when it was saved. */
  savedModules: Map<string, string>;
  exams: Array<{ score: number; passed: boolean; createdAt: string }>;
};

export const COMPLETION_RECORD_NAME = "KidyCode course completion record" as const;

/* The technologies named in the record come from the course itself, so the
 * statement stays true for every learning path. */
export function technologiesTaught(course: CourseBundle): string {
  const languages: string[] = [];
  for (const lesson of course.lessons) {
    if (lesson.language === "Web project") continue;
    if (!languages.includes(lesson.language)) languages.push(lesson.language);
  }
  if (languages.length === 0) return "web technologies";
  if (languages.length === 1) return languages[0];
  return `${languages.slice(0, -1).join(", ")} and ${languages[languages.length - 1]}`;
}

export function projectTitleFor(course: CourseBundle, theme: string): string {
  const choice = course.projectChoices.find((entry) => entry.id === theme) || course.projectChoices[0];
  return choice?.title || "Website project";
}

function latestIso(values: string[]): string | null {
  const usable = values.filter((value) => typeof value === "string" && value.length > 0);
  if (usable.length === 0) return null;
  return usable.reduce((latest, value) => (value > latest ? value : latest));
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} more ${count === 1 ? singular : plural}`;
}

export function buildCompletionRecord(course: CourseBundle, input: CompletionInput): CompletionRecord {
  const activityIds = course.lessons.map((lesson) => lesson.id);
  const requiredActivities = course.lessons.length;

  /* Only activities that belong to this course count. A row from another course
   * can never move these figures. */
  const completedActivities = activityIds.filter((id) => input.completedLessons.has(id));
  const activitiesCompleted = completedActivities.length;

  /* Modules are read in course order, so the missing one named below is always the
   * earliest gap rather than whatever the database happened to return first. */
  const savedModules = course.stages.filter((stage) => input.savedModules.has(stage.id));
  const firstUnsavedStage = course.stages.find((stage) => !input.savedModules.has(stage.id)) || null;

  const passedAttempts = input.exams.filter((attempt) => attempt.passed);
  const bestScore = input.exams.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const finalStatus: CompletionRecord["finalAssessment"]["status"] =
    passedAttempts.length > 0 ? "passed" : input.exams.length > 0 ? "attempted" : "not-started";

  const missing: MissingRequirement[] = [];
  if (activitiesCompleted < requiredActivities) {
    const remaining = requiredActivities - activitiesCompleted;
    missing.push({
      kind: "activities",
      label: `Complete ${countLabel(remaining, "activity", "activities")}`,
      detail: `The record needs all ${requiredActivities} activities in ${course.courseFacts.title}.`,
    });
  }
  if (firstUnsavedStage) {
    missing.push({
      kind: "modules",
      label: `Save the Module ${firstUnsavedStage.number} project version`,
      detail: `Module ${firstUnsavedStage.number}, ${firstUnsavedStage.title}, has no saved project version yet.`,
    });
  }
  if (finalStatus !== "passed") {
    missing.push({
      kind: "final-assessment",
      label: "Pass the final assessment",
      detail: "The final assessment covers the whole course and must be passed once.",
    });
  }

  const complete = missing.length === 0;

  /* The completion date is the latest moment the required evidence arrived, so it
   * is never a date the learner typed or a date the app invented. */
  const completedAt = complete
    ? latestIso([
      ...completedActivities.map((id) => input.completedLessons.get(id) || ""),
      ...course.stages.map((stage) => input.savedModules.get(stage.id) || ""),
      ...passedAttempts.map((attempt) => attempt.createdAt),
    ])
    : null;

  const technologies = technologiesTaught(course);
  const statement = complete
    ? `Built and tested a website using ${technologies}, the technologies taught in ${course.courseFacts.title}.`
    : "";

  return {
    recordName: COMPLETION_RECORD_NAME,
    courseTitle: course.courseFacts.title,
    ageRange: course.courseFacts.ageRange,
    projectTitle: projectTitleFor(course, input.theme),
    technologies,
    activities: { completed: activitiesCompleted, required: requiredActivities },
    modules: { saved: savedModules.length, required: course.stages.length },
    finalAssessment: { status: finalStatus, bestScore, total: course.finalExam.length },
    complete,
    completedAt,
    statement,
    missing,
    nextRequirement: missing[0] || null,
  };
}

/* The guardian sees a smaller, plainer version of the same record. It carries no
 * code, no reflection, no answers and no identifier. */
export type GuardianCompletionRecord = {
  courseTitle: string;
  projectTitle: string;
  status: "complete" | "in-progress";
  activities: { completed: number; required: number };
  modules: { saved: number; required: number };
  finalAssessment: { status: "not-started" | "attempted" | "passed" };
  completedAt: string | null;
};

export function toGuardianCompletion(record: CompletionRecord): GuardianCompletionRecord {
  return {
    courseTitle: record.courseTitle,
    projectTitle: record.projectTitle,
    status: record.complete ? "complete" : "in-progress",
    activities: { completed: record.activities.completed, required: record.activities.required },
    modules: { saved: record.modules.saved, required: record.modules.required },
    finalAssessment: { status: record.finalAssessment.status },
    completedAt: record.complete ? record.completedAt : null,
  };
}