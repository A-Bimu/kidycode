import type { CourseId } from "@/lib/course";

/* One definition of where each learning path lives, shared by the learner app and
 * by the transfer claim, so a transferred learner is returned to the right course. */
export const courseRoutes: Record<CourseId, string> = {
  "ages-10-12": "/learn",
  "ages-13-15": "/learn/13-15",
  "ages-16-18": "/learn/16-18",
  adults: "/learn/adults",
};

export function courseRoute(courseId: string): string {
  return courseRoutes[courseId as CourseId] || "/learn";
}
