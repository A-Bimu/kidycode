import { courses } from "@/lib/course-catalog";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";
import { ages10to12Assessment } from "@/lib/assessment/bank/ages-10-12";
import type { CourseId } from "@/lib/course";

export { ages10to12Assessment };

/* The remaining three courses are filled by their own bank phase. Until then they serve
 * no assessment rather than an unreviewed one. */
export const ages13to15Assessment: CourseAssessment = {
  courseId: "ages-13-15",
  contentVersion: CONTENT_VERSION,
  moduleForms: [],
  finalForms: [],
  defence: [],
};

export const ages16to18Assessment: CourseAssessment = {
  courseId: "ages-16-18",
  contentVersion: CONTENT_VERSION,
  moduleForms: [],
  finalForms: [],
  defence: [],
};

export const adultsAssessment: CourseAssessment = {
  courseId: "adults",
  contentVersion: CONTENT_VERSION,
  moduleForms: [],
  finalForms: [],
  defence: [],
};

export const assessmentContent: Record<CourseId, CourseAssessment> = {
  "ages-10-12": ages10to12Assessment,
  "ages-13-15": ages13to15Assessment,
  "ages-16-18": ages16to18Assessment,
  adults: adultsAssessment,
};

/* A bank with nothing reviewed in it must serve no assessment at all. Exported so the
 * release suite can prove the rule directly once every course has real content. */
export function servesAssessment(content: CourseAssessment | null | undefined): boolean {
  return Boolean(content && (content.moduleForms.length > 0 || content.finalForms.length > 0));
}

export function contentFor(courseId: CourseId): CourseAssessment | null {
  const content = assessmentContent[courseId];
  if (!servesAssessment(content)) return null;
  return content;
}

export function moduleTitles(courseId: CourseId): Record<string, { number: number; title: string }> {
  const course = courses[courseId];
  const titles: Record<string, { number: number; title: string }> = {};
  for (const stage of course.stages) {
    titles[stage.id] = { number: stage.number, title: stage.title };
  }
  return titles;
}

/*
 * Which lesson teaches each concept, so a revision note can always point back at a
 * real lesson the learner has already met. Built from the content itself: a knowledge
 * item records the lesson it assesses, and a requirement records the lesson it
 * revises.
 */
export function lessonByConcept(content: CourseAssessment): Record<string, string> {
  const index: Record<string, string> = {};
  for (const form of content.moduleForms) {
    for (const item of form.knowledge) index[item.concept] = item.objective;
    for (const requirement of form.practical.requirements) {
      if (requirement.revision) index[requirement.concept] = requirement.revision;
    }
  }
  for (const form of content.finalForms) {
    for (const item of form.knowledge) index[item.concept] = item.objective;
    for (const task of [form.build, ...form.debug]) {
      for (const requirement of task.requirements) {
        if (requirement.revision) index[requirement.concept] = requirement.revision;
      }
    }
  }
  return index;
}