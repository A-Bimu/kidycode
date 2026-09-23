import { courses } from "@/lib/course-catalog";
import { type CourseAssessment } from "@/lib/assessment/types";
import { ages10to12Assessment } from "@/lib/assessment/bank/ages-10-12";
import { ages10to12Final } from "@/lib/assessment/bank/ages-10-12-final";
import { templatesFor } from "@/lib/assessment/defence";
import { ages13to15Assessment } from "@/lib/assessment/bank/ages-13-15";
import { ages13to15Final } from "@/lib/assessment/bank/ages-13-15-final";
import { ages16to18Assessment } from "@/lib/assessment/bank/ages-16-18";
import { ages16to18Final } from "@/lib/assessment/bank/ages-16-18-final";
import { adultsAssessment } from "@/lib/assessment/bank/adults";
import { adultsFinal } from "@/lib/assessment/bank/adults-final";
import type { CourseId } from "@/lib/course";

export {
  ages10to12Assessment,
  ages10to12Final,
  ages13to15Assessment,
  ages13to15Final,
  ages16to18Assessment,
  ages16to18Final,
  adultsAssessment,
  adultsFinal,
};

/*
 * One course, one content object: the module bank and the final bank are authored in
 * separate files and merged here, so the engine, the routes and the validator all read a
 * single course assessment rather than looking in two places.
 *
 * A course whose final bank is still being reviewed serves its module assessments and no
 * final assessment, which the start route answers with 503 rather than inventing one.
 */
function mergeAssessment(moduleBank: CourseAssessment, finalBank?: CourseAssessment): CourseAssessment {
  return {
    ...moduleBank,
    finalForms: finalBank?.finalForms ?? moduleBank.finalForms,
    defence: templatesFor(moduleBank.courseId),
  };
}

export const assessmentContent: Record<CourseId, CourseAssessment> = {
  "ages-10-12": mergeAssessment(ages10to12Assessment, ages10to12Final),
  "ages-13-15": mergeAssessment(ages13to15Assessment, ages13to15Final),
  "ages-16-18": mergeAssessment(ages16to18Assessment, ages16to18Final),
  adults: mergeAssessment(adultsAssessment, adultsFinal),
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