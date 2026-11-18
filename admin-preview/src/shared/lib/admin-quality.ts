import { adminLessonIndex, type AdminLessonRef } from "@/lib/admin-curriculum";

/*
 * Curriculum quality checks.
 *
 * Every flag this module raises is a HEURISTIC SUGGESTION, not a finding of fact. It is a
 * reader looking for the things a human reviewer would look for - a lesson with no notes, a
 * question whose correct answer is not one of its options, a duplicate prompt, an image with
 * no alternative text - and reporting what it noticed so the reviewer can decide. Nothing
 * here changes content, blocks a lesson or claims a defect. The interface labels every flag
 * as a suggestion for exactly this reason.
 *
 * The checks are pure and read only the content admin-curriculum already exposes, so a
 * reviewer sees the same material the checks saw.
 */

export type QualityLevel = "info" | "suggestion";

export type QualityFlag = {
  code: string;
  level: QualityLevel;
  message: string;
  detail?: string;
};

export type LessonQuality = {
  key: string;
  pathwayTitle: string;
  unitTitle: string;
  lessonTitle: string;
  lessonType: string;
  minutes: number | null;
  flags: QualityFlag[];
};

export type DuplicatePrompt = {
  normalized: string;
  prompt: string;
  lessonKeys: string[];
  lessonTitles: string[];
};

export type CurriculumQuality = {
  totalLessons: number;
  flagCounts: Array<{ code: string; count: number }>;
  lessonsWithFlags: number;
  lessons: LessonQuality[];
  duplicates: DuplicatePrompt[];
  heuristic: true;
  note: string;
};

const CYRILLIC_WHITESPACE = /[\s\u00a0]+/g;

export function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(CYRILLIC_WHITESPACE, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

function push(flags: QualityFlag[], code: string, level: QualityLevel, message: string, detail?: string): void {
  flags.push(detail === undefined ? { code, level, message } : { code, level, message, detail });
}

/* A starter file is only ever shown to the reviewer here; the patterns look for the
 * accessibility problems the lessons themselves teach, so a lesson that preaches alt text
 * and ships an img without it is visible at a glance. */
function accessibilityFlags(lesson: AdminLessonRef["lesson"], flags: QualityFlag[]): void {
  const html = lesson.starterFiles?.html || "";
  if (!html) return;
  const images = html.match(/<img\b[^>]*>/gi) || [];
  const undescribed = images.filter(tag => !/\balt\s*=/.test(tag));
  if (undescribed.length > 0) {
    push(flags, "image-missing-alt", "suggestion", "A starter image has no alternative text.", `${undescribed.length} image tag(s) without alt.`);
  }
  const inputs = html.match(/<input\b[^>]*>/gi) || [];
  const unlabelled = inputs.filter(tag => !/aria-label|aria-labelledby|\bid\s*=/.test(tag));
  if (unlabelled.length > 0) {
    push(flags, "input-missing-id", "suggestion", "A starter input has no id, so a label cannot point at it.", `${unlabelled.length} input(s).`);
  }
  const buttons = html.match(/<button\b[^>]*>\s*<\/button>/gi) || [];
  if (buttons.length > 0) {
    push(flags, "button-missing-text", "suggestion", "A starter button has no visible text.", `${buttons.length} empty button(s).`);
  }
}

export function lessonQuality(ref: AdminLessonRef): LessonQuality {
  const lesson = ref.lesson;
  const flags: QualityFlag[] = [];

  if (lesson.objective.trim().length < 20) {
    push(flags, "thin-objective", "suggestion", "The objective is very short, so the lesson goal may be unclear.", `"${lesson.objective}"`);
  }
  const noteLength = lesson.notes.join(" ").trim().length;
  if (lesson.notes.length === 0) {
    push(flags, "missing-notes", "suggestion", "The lesson has no teaching notes.");
  } else if (noteLength < 120) {
    push(flags, "thin-notes", "suggestion", "The teaching notes are shorter than a full explanation.", `${noteLength} characters`);
  }
  if (lesson.activity.trim().length < 15) {
    push(flags, "thin-activity", "suggestion", "The activity text is very short.");
  }
  if (lesson.type !== "quiz" && lesson.type !== "final quiz" && lesson.type !== "practical defence" && !lesson.workedExample.trim()) {
    push(flags, "missing-example", "suggestion", "There is no worked example for a lesson that expects the learner to write code.");
  }
  if (lesson.workedExample.trim() && lesson.exampleExplanation.trim().length < 20) {
    push(flags, "thin-example-explanation", "suggestion", "The worked example has little or no explanation beside it.");
  }
  if (lesson.type !== "quiz" && lesson.type !== "final quiz" && lesson.type !== "final assessment" && lesson.hints.length === 0) {
    push(flags, "no-hints", "suggestion", "The lesson offers no hints, so a stuck learner has no scaffold.");
  }
  if ((lesson.type === "challenge" || lesson.type === "project") && lesson.requirements.length === 0) {
    push(flags, "no-requirements", "suggestion", "A coding lesson defines no automatic requirement, so it cannot be checked.");
  }
  if (lesson.type === "quiz" && lesson.questions.length > 0 && lesson.questions.length < 3) {
    push(flags, "thin-quiz", "suggestion", "The quiz has fewer than three questions.", `${lesson.questions.length} question(s)`);
  }
  if (lesson.type === "quiz" && lesson.questions.length === 0) {
    push(flags, "lesson-to-practice-gap", "suggestion", "A quiz lesson contains no questions.");
  }

  lesson.questions.forEach((question, index) => {
    const label = `Q${index + 1}`;
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      push(flags, "answer-out-of-range", "suggestion", `${label} marks an answer that is not one of its options.`, `correctIndex ${question.correctIndex} of ${question.options.length} options`);
    }
    const normalizedOptions = question.options.map(option => option.trim().toLowerCase());
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      push(flags, "duplicate-options", "suggestion", `${label} repeats the same option text.`);
    }
    if (question.options.some(option => option.trim().length < 2)) {
      push(flags, "empty-option", "suggestion", `${label} has an option with almost no text.`);
    }
    if (question.explanation.trim().length < 15) {
      push(flags, "weak-explanation", "suggestion", `${label} has a very short explanation, so a wrong answer is hard to learn from.`);
    }
  });

  accessibilityFlags(lesson, flags);

  if (lesson.minutes === null) {
    push(flags, "no-workload-estimate", "info", "This lesson states no estimated time.");
  } else if (lesson.minutes > 45) {
    push(flags, "long-lesson", "info", "This lesson is estimated at over 45 minutes.", `${lesson.minutes} minutes`);
  }

  return {
    key: ref.key,
    pathwayTitle: ref.pathwayTitle,
    unitTitle: ref.unitTitle,
    lessonTitle: lesson.title,
    lessonType: lesson.type,
    minutes: lesson.minutes,
    flags,
  };
}

export function curriculumQuality(refs: AdminLessonRef[] = adminLessonIndex()): CurriculumQuality {
  const lessons = refs.map(lessonQuality);
  const flagCounts = new Map<string, number>();
  for (const lesson of lessons) {
    for (const flag of lesson.flags) flagCounts.set(flag.code, (flagCounts.get(flag.code) || 0) + 1);
  }

  /* A repeated prompt across lessons is a suggestion to check, not a defect: two age bands
   * may legitimately ask the same question. The report says where the prompt appears. */
  const byPrompt = new Map<string, DuplicatePrompt>();
  for (const ref of refs) {
    ref.lesson.questions.forEach(question => {
      const normalized = normalizePrompt(question.prompt);
      if (normalized.length < 8) return;
      const entry = byPrompt.get(normalized) || { normalized, prompt: question.prompt, lessonKeys: [], lessonTitles: [] };
      if (!entry.lessonKeys.includes(ref.key)) {
        entry.lessonKeys.push(ref.key);
        entry.lessonTitles.push(`${ref.pathwayTitle} - ${ref.lesson.title}`);
      }
      byPrompt.set(normalized, entry);
    });
  }
  const duplicates = [...byPrompt.values()].filter(entry => entry.lessonKeys.length > 1);

  return {
    totalLessons: lessons.length,
    flagCounts: [...flagCounts.entries()].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    lessonsWithFlags: lessons.filter(lesson => lesson.flags.length > 0).length,
    lessons,
    duplicates,
    heuristic: true,
    note: "Every entry here is an automatic suggestion from a reading of the content, not a verified defect. A reviewer decides.",
  };
}
