import { courses, getCourse } from "@/lib/course-catalog";
import type { CourseBundle, CourseId } from "@/lib/course";
import { buildCompletionRecord, type CompletionInput } from "@/lib/completion";
import { designCourses } from "@/lib/design-course";
import { buildOutside } from "@/lib/build-outside";
import { transferProjectBank } from "@/lib/transfer-projects";

/*
 * The learner-facing Day 2 experiences: the dashboard, the course catalogue, the Notes
 * Library and the Practice Lab.
 *
 * All four are derived from the courses that already exist rather than from a second copy
 * of the content. The notes are the lessons' own explanations, the practice is the lessons'
 * own tasks, hints and automatic requirements, and the catalogue is the course facts. A new
 * lesson therefore appears in every view without anyone editing a list.
 *
 * Two boundaries are kept deliberately:
 *
 *   1. Provenance is labelled on every catalogue entry, so a learner, a guardian or a
 *      reviewer can tell published work from a demonstration from work still pending.
 *   2. The Practice Lab holds no answer. It shows the task, the hints and the requirement
 *      labels, and the answer stays behind the same submission the course already uses,
 *      because a lab that ships the answer is not practice.
 */

export const provenanceLabels = ["real", "demo", "pending"] as const;
export type Provenance = (typeof provenanceLabels)[number];

export const codingCourseIds = Object.keys(courses) as CourseId[];

export type CatalogueEntry = {
  id: string;
  kind: "coding" | "design" | "tooling";
  title: string;
  ageRange: string;
  ageBands: string[];
  units: number;
  lessons: number;
  estimatedHours: string;
  provenance: Provenance;
  provenanceNote: string;
  requirement: string;
};

export function courseCatalogue(): CatalogueEntry[] {
  const entries: CatalogueEntry[] = codingCourseIds.map((courseId) => {
    const bundle = courses[courseId];
    return {
      id: courseId,
      kind: "coding",
      title: bundle.courseFacts.title,
      ageRange: bundle.courseFacts.ageRange,
      ageBands: [bundle.courseFacts.ageRange],
      units: bundle.courseFacts.stageCount,
      lessons: bundle.courseFacts.lessonCount,
      estimatedHours: bundle.courseFacts.estimatedHours,
      provenance: "real",
      provenanceNote: "A published KidyCode pathway with a guided project and a practical assessment.",
      requirement: `Pass the module checks and the final assessment, marked out of 100 with a pass mark of ${bundle.courseFacts.passMark}.`,
    };
  });

  const design = designCourses[0];
  entries.push({
    id: design.id,
    kind: "design",
    title: design.title,
    ageRange: "Ages 10 and above",
    ageBands: designCourses.map((course) => course.ageRange),
    units: design.modules.length,
    lessons: design.modules.reduce((total, module) => total + module.lessons.length, 0),
    estimatedHours: "10 to 20 hours",
    provenance: "demo",
    provenanceNote: "A new standalone programme. The content is complete, but it has not yet been run with a learner group.",
    requirement: "Complete each module's studio brief and its short check. There is no code workspace and no code test.",
  });

  entries.push({
    id: buildOutside.id,
    kind: "tooling",
    title: buildOutside.title,
    ageRange: "Ages 13 and above, supervised",
    ageBands: ["Ages 13 to 15", "Ages 16 to 18", "Adults"],
    units: buildOutside.stations.length,
    lessons: buildOutside.stations.length,
    estimatedHours: "6 to 10 hours",
    provenance: "pending",
    provenanceNote: "Written for a supervised setting. It introduces real accounts and publishing, so it waits for guardian consent and a controlled pilot.",
    requirement: "Finish each station's practice task and answer its check before moving on. A grown-up supervises the account and publishing stations.",
  });

  return entries;
}

export type NoteCard = {
  lessonId: string;
  title: string;
  language: string;
  minutes: number;
  objective: string;
  notes: string[];
  keyTerms: string[];
};

export type NoteSection = {
  stageId: string;
  number: number;
  title: string;
  outcome: string;
  notes: NoteCard[];
};

export type NotesLibrary = {
  courseId: CourseId;
  title: string;
  ageRange: string;
  sections: NoteSection[];
  noteCount: number;
  termCount: number;
};

/* The Notes Library is the course's own explanations, grouped by module, so a learner can
 * read the reasoning again without replaying the activity. */
export function notesLibrary(courseId: CourseId): NotesLibrary {
  const bundle: CourseBundle = getCourse(courseId);
  const sections: NoteSection[] = bundle.stages.map((stage) => ({
    stageId: stage.id,
    number: stage.number,
    title: stage.title,
    outcome: stage.outcome,
    notes: stage.lessons.map((lesson) => ({
      lessonId: lesson.id,
      title: lesson.title,
      language: lesson.language,
      minutes: lesson.minutes,
      objective: lesson.objective,
      notes: lesson.explanation,
      keyTerms: lesson.keyTerms,
    })),
  }));
  const terms = new Set(sections.flatMap((section) => section.notes.flatMap((note) => note.keyTerms)));
  return {
    courseId,
    title: bundle.courseFacts.title,
    ageRange: bundle.courseFacts.ageRange,
    sections,
    noteCount: sections.reduce((total, section) => total + section.notes.length, 0),
    termCount: terms.size,
  };
}

export type PracticeCard = {
  lessonId: string;
  title: string;
  language: string;
  task: string;
  editableFiles: string[];
  requirements: string[];
  hints: string[];
  hasCheck: boolean;
};

export type PracticeLab = {
  courseId: CourseId;
  title: string;
  ageRange: string;
  cards: PracticeCard[];
  requirementCount: number;
};

/* The Practice Lab holds the task, the requirement labels and the hints, and deliberately
 * holds no answer. The check's explanation is only ever reached through a submission. */
export function practiceLab(courseId: CourseId): PracticeLab {
  const bundle = getCourse(courseId);
  const cards: PracticeCard[] = bundle.lessons
    .filter((lesson) => lesson.activityType !== "quiz")
    .map((lesson) => ({
      lessonId: lesson.id,
      title: lesson.title,
      language: lesson.language,
      task: lesson.task,
      editableFiles: lesson.editableFiles,
      requirements: lesson.tests.map((test) => `${test.label} (${test.file})`),
      hints: lesson.hints,
      hasCheck: Boolean(lesson.questions && lesson.questions.length > 0) || Boolean(lesson.question),
    }));
  return {
    courseId,
    title: bundle.courseFacts.title,
    ageRange: bundle.courseFacts.ageRange,
    cards,
    requirementCount: cards.reduce((total, card) => total + card.requirements.length, 0),
  };
}

export type DashboardLink = { label: string; href: string; reason: string };

export type LearnerDashboard = {
  courseId: CourseId;
  courseTitle: string;
  ageRange: string;
  projectTitle: string;
  status: "not-started" | "in-progress" | "complete";
  activities: { completed: number; required: number };
  modules: { saved: number; required: number };
  nextRequirement: { label: string; detail: string; kind: string } | null;
  continueLesson: { lessonId: string; title: string; objective: string } | null;
  links: DashboardLink[];
};

/* The dashboard reuses the one completion calculation, so it can never disagree with the
 * portfolio or the grown-up view. */
export function learnerDashboard(courseId: CourseId, input: CompletionInput): LearnerDashboard {
  const bundle = getCourse(courseId);
  const record = buildCompletionRecord(bundle, input);
  const nextLesson = bundle.lessons.find((lesson) => !input.completedLessons.has(lesson.id)) || null;
  const bank = transferProjectBank(courseId);
  return {
    courseId,
    courseTitle: bundle.courseFacts.title,
    ageRange: bundle.courseFacts.ageRange,
    projectTitle: record.projectTitle,
    status: record.complete ? "complete" : record.activities.completed > 0 ? "in-progress" : "not-started",
    activities: record.activities,
    modules: record.modules,
    nextRequirement: record.nextRequirement,
    continueLesson: nextLesson ? { lessonId: nextLesson.id, title: nextLesson.title, objective: nextLesson.objective } : null,
    links: [
      { label: "Notes Library", href: "/notes", reason: "Read the explanations again without replaying the activity." },
      { label: "Practice Lab", href: "/practice", reason: "Work through the tasks and hints on your own." },
      { label: "Transfer project", href: "/transfer", reason: `Prove the skill on a new problem: ${bank.projects[0].title}.` },
      { label: "Skills Evidence Record", href: "/curriculum", reason: "See which evidence the course produces and where it comes from." },
    ],
  };
}

/* The contract rule for the four experiences, run by the validator. */
export function learnerExperienceIssues(): string[] {
  const issues: string[] = [];
  const catalogue = courseCatalogue();
  if (catalogue.length < 6) issues.push("the catalogue must list the four pathways and the two new programmes.");
  for (const entry of catalogue) {
    if (!provenanceLabels.includes(entry.provenance)) issues.push(`${entry.id}: the catalogue entry needs a provenance label.`);
    if (entry.provenanceNote.trim().length < 30) issues.push(`${entry.id}: say what the provenance label means.`);
    if (entry.units < 1 || entry.lessons < 1) issues.push(`${entry.id}: the catalogue entry has no content.`);
  }
  for (const courseId of codingCourseIds) {
    const notes = notesLibrary(courseId);
    const bundle = courses[courseId];
    if (notes.noteCount !== bundle.lessons.length) issues.push(`${courseId}: the Notes Library must cover every lesson.`);
    for (const section of notes.sections) {
      for (const note of section.notes) {
        if (note.notes.join(" ").trim().length < 40) issues.push(`${courseId}/${note.lessonId}: the note is too thin to be useful.`);
      }
    }
    const lab = practiceLab(courseId);
    if (lab.cards.length < 1) issues.push(`${courseId}: the Practice Lab is empty.`);
    for (const card of lab.cards) {
      if (card.task.trim().length < 20) issues.push(`${courseId}/${card.lessonId}: the practice task is too thin.`);
      if (card.requirements.length < 1) issues.push(`${courseId}/${card.lessonId}: a practice card needs at least one requirement.`);
      /* The lab carries no answer: a card may name a check but must never carry the
       * explanation that belongs to a submission. */
      if (/explanation/i.test(card.task) || card.hints.some((hint) => /^{"[^"]+":|options/.test(hint))) {
        issues.push(`${courseId}/${card.lessonId}: the lab must not carry answer material.`);
      }
    }
    const dashboard = learnerDashboard(courseId, { theme: bundle.projectChoices[0]?.id || "interest", completedLessons: new Map(), savedModules: new Map(), exams: [] });
    if (dashboard.status !== "not-started") issues.push(`${courseId}: an empty learner must read as not started.`);
    if (!dashboard.continueLesson) issues.push(`${courseId}: an empty learner must be offered the first lesson.`);
  }
  return issues;
}
