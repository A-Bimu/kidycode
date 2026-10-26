import type { CourseId } from "@/lib/course";
import { guidanceForCourse, guidanceModes, scriptFor, type GuidanceMode } from "@/lib/lesson-scripts";

/*
 * The feature flag and the per-lesson guidance override for the V3 lesson
 * journey. The journey is additive: when the flag is off, or a lesson has no
 * script, the existing lesson interface renders exactly as it did in V2.
 *
 * Set NEXT_PUBLIC_V3_LESSON_JOURNEY=off to hide the journey everywhere. A learner
 * can also append ?journey=off to a course URL. The guidance level is stored per
 * lesson so a learner may ask for more support on one topic without changing the
 * default for the whole course.
 */

export const lessonJourneyFlag = process.env.NEXT_PUBLIC_V3_LESSON_JOURNEY !== "off";
export const guidanceStoragePrefix = "kidycode:guidance:";

export function journeyEnabledFor(courseId: CourseId, lessonId: string): boolean {
  if (!lessonJourneyFlag) return false;
  return Boolean(scriptFor(courseId, lessonId));
}

export function readGuidanceOverride(lessonId: string): GuidanceMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(`${guidanceStoragePrefix}${lessonId}`);
    return guidanceModes.includes(stored as GuidanceMode) ? (stored as GuidanceMode) : null;
  } catch {
    return null;
  }
}

export function writeGuidanceOverride(lessonId: string, mode: GuidanceMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${guidanceStoragePrefix}${lessonId}`, mode);
  } catch {
    /* A blocked storage API still lets the choice apply for this visit. */
  }
}

export function initialGuidance(courseId: CourseId, lessonId: string): GuidanceMode {
  return readGuidanceOverride(lessonId) || guidanceForCourse(courseId);
}
