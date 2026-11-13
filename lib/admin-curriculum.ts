import { courses } from "@/lib/course-catalog";
import { codingCourseIds } from "@/lib/learning-experience";
import { designCourses } from "@/lib/design-course";
import type { CourseId, Lesson, PracticeQuestion } from "@/lib/course";

export type AdminQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
export type AdminLesson = {
  id: string;
  title: string;
  type: string;
  language: string;
  minutes: number | null;
  objective: string;
  notes: string[];
  keyTerms: string[];
  activity: string;
  workedExample: string;
  exampleExplanation: string;
  starterFiles: { html: string; css: string; javascript: string } | null;
  hints: string[];
  requirements: string[];
  questions: AdminQuestion[];
  reflection: string;
};
export type AdminUnit = {
  id: string;
  title: string;
  number: number;
  objective: string;
  lessons: AdminLesson[];
};
export type AdminPathway = {
  id: string;
  title: string;
  ageRange: string;
  kind: "coding" | "design";
  units: Array<{ index: number; id: string; title: string; lessonCount: number }>;
};
function question(q: PracticeQuestion): AdminQuestion {
  return { prompt: q.prompt, options: [...q.options], correctIndex: q.answer, explanation: q.explanation };
}
function codingLesson(lesson: Lesson): AdminLesson {
  return {
    id: lesson.id, title: lesson.title, type: lesson.activityType,
    language: lesson.language, minutes: lesson.minutes, objective: lesson.objective,
    notes: [...lesson.explanation], keyTerms: [...lesson.keyTerms], activity: lesson.task,
    workedExample: lesson.exampleCode, exampleExplanation: lesson.exampleExplanation,
    starterFiles: { ...lesson.starterFiles },
    hints: [...lesson.hints],
    requirements: lesson.tests.map(test => test.label),
    questions: lesson.questions?.map(question) || (lesson.question ? [question(lesson.question)] : []),
    reflection: lesson.reflection || "",
  };
}
const findDesign = (id: string) => designCourses.find(d => "design:" + d.adaptedFor === id);

/** One lesson in its pathway context, with a stable key for search and deep links. */
export type AdminLessonRef = {
  key: string;
  pathwayId: string;
  pathwayTitle: string;
  ageRange: string;
  kind: "coding" | "design";
  unitIndex: number;
  unitId: string;
  unitTitle: string;
  unitNumber: number;
  lesson: AdminLesson;
};

export function adminLessonKey(pathwayId: string, unitIndex: number, lessonId: string): string {
  return `${pathwayId}:${unitIndex}:${lessonId}`;
}

/* Every lesson in every pathway, with the answer keys, hints and starter files already
 * resolved by adminUnit. Used by search and by the quality checks, so both walk exactly
 * the same content the reviewer can open. */
export function adminLessonIndex(): AdminLessonRef[] {
  const refs: AdminLessonRef[] = [];
  for (const pathway of adminPathways()) {
    for (const unit of pathway.units) {
      const resolved = adminUnit(pathway.id, unit.index);
      if (!resolved) continue;
      for (const lesson of resolved.lessons) {
        refs.push({
          key: adminLessonKey(pathway.id, unit.index, lesson.id),
          pathwayId: pathway.id,
          pathwayTitle: pathway.title,
          ageRange: pathway.ageRange,
          kind: pathway.kind,
          unitIndex: unit.index,
          unitId: resolved.id,
          unitTitle: resolved.title,
          unitNumber: resolved.number,
          lesson,
        });
      }
    }
  }
  return refs;
}

export function adminLessonByKey(key: string): AdminLessonRef | null {
  /* Keys are `${pathwayId}:${unitIndex}:${lessonId}`. A design pathway id itself contains a
   * colon ("design:ages-10-12"), so the shape is read from the right: the last segment is
   * the lesson id, the one before it is the unit index, and everything before that is the
   * pathway id. */
  const parts = key.split(":");
  if (parts.length < 3) return null;
  const lessonId = parts[parts.length - 1];
  const unitIndex = Number(parts[parts.length - 2]);
  const pathwayIdNormalised = parts.slice(0, parts.length - 2).join(":");
  if (!Number.isInteger(unitIndex) || !lessonId) return null;
  const unit = adminUnit(pathwayIdNormalised, unitIndex);
  if (!unit) return null;
  const lesson = unit.lessons.find(candidate => candidate.id === lessonId);
  if (!lesson) return null;
  const pathway = adminPathways().find(candidate => candidate.id === pathwayIdNormalised);
  if (!pathway) return null;
  return {
    key,
    pathwayId: pathwayIdNormalised,
    pathwayTitle: pathway.title,
    ageRange: pathway.ageRange,
    kind: pathway.kind,
    unitIndex,
    unitId: unit.id,
    unitTitle: unit.title,
    unitNumber: unit.number,
    lesson,
  };
}


/** This index exposes counts and titles, not answer keys, so reviewers can navigate quickly. */
export function adminPathways(): AdminPathway[] {
  const coding: AdminPathway[] = codingCourseIds.map(courseId => {
    const course = courses[courseId];
    const units = course.stages.map((stage, index) => ({
      index, id: stage.id, title: stage.title, lessonCount: stage.lessons.length,
    }));
    units.push({ index: course.stages.length, id: "final-assessment", title: "Final assessment and practical defence", lessonCount: 2 });
    return { id: courseId, title: course.courseFacts.title, ageRange: course.courseFacts.ageRange, kind: "coding", units };
  });
  const design: AdminPathway[] = designCourses.map(course => ({
    id: "design:" + course.adaptedFor,
    title: course.title, ageRange: course.ageRange, kind: "design",
    units: course.modules.map((unit, index) => ({
      index, id: unit.id, title: unit.title, lessonCount: unit.lessons.length,
    })),
  }));
  return [...coding, ...design];
}

export function adminUnit(pathwayId: string, index: number): AdminUnit | null {
  if (!Number.isInteger(index) || index < 0 || index > 20) return null;
  const design = findDesign(pathwayId);
  if (design) {
    const unit = design.modules[index];
    if (!unit) return null;
    return {
      id: unit.id, title: unit.title, number: unit.number,
      objective: unit.outcome,
      lessons: unit.lessons.map(lesson => ({
        id: lesson.id, title: lesson.title, type: "UI/UX", language: "Design",
        minutes: null, objective: lesson.objective, notes: [...lesson.notes],
        keyTerms: [], activity: lesson.activity,
        workedExample: unit.studio, exampleExplanation: "Studio project brief",
        starterFiles: null, hints: [], requirements: [unit.studio],
        questions: [{
          prompt: lesson.check.prompt, options: [...lesson.check.options],
          correctIndex: lesson.check.answer, explanation: lesson.check.explanation,
        }], reflection: "Explain one design decision and the evidence behind it.",
      })),
    };
  }
  const course = courses[pathwayId as CourseId];
  if (!course || !codingCourseIds.some(id => id === pathwayId)) return null;
  if (index === course.stages.length) {
    const practical = course.practicalExam;
    return {
      id: "final-assessment", title: "Final assessment and practical defence",
      number: index + 1,
      objective: "Inspect all ten questions and the practical repair requirements without entering a learner attempt.",
      lessons: [
        {
          id: pathwayId + "-final-knowledge", title: "Knowledge assessment",
          type: "final quiz", language: "Mixed", minutes: null,
          objective: "Review question clarity, plausible distractors and explanation quality.",
          notes: [], keyTerms: [], activity: "Answer ten course-level questions.",
          workedExample: "", exampleExplanation: "",
          starterFiles: null, hints: [], requirements: [],
          questions: course.finalExam.map(question), reflection: "",
        },
        {
          id: pathwayId + "-final-practical", title: practical.title,
          type: "practical defence", language: practical.language, minutes: null,
          objective: "Inspect the repair task and expected evidence, without changing any student's results.",
          notes: [], keyTerms: [], activity: practical.brief,
          workedExample: practical.starterCode, exampleExplanation: "",
          starterFiles: null, hints: [], requirements: [...practical.requiredPatterns],
          questions: [], reflection: "",
        },
      ],
    };
  }
  const stage = course.stages[index];
  if (!stage) return null;
  return {
    id: stage.id, title: stage.title, number: stage.number, objective: stage.outcome,
    lessons: stage.lessons.map(codingLesson),
  };
}
