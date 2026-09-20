import { course13to15 } from "@/lib/course-13-15";
import { course16to18 } from "@/lib/course-16-18";
import { adultCourse } from "@/lib/course-adults";
import { course10to12, type CourseBundle, type CourseId } from "@/lib/course";

export const courses: Record<CourseId, CourseBundle> = {
  "ages-10-12": course10to12,
  "ages-13-15": course13to15,
  "ages-16-18": course16to18,
  adults: adultCourse,
};

export const allCourses = Object.values(courses);
export const allStages = allCourses.flatMap((course) => course.stages);
export const allLessons = allCourses.flatMap((course) => course.lessons);

export function getCourse(courseId: CourseId): CourseBundle {
  return courses[courseId];
}
