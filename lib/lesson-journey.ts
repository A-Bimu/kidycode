import type { CodeFile, CodeTest, CourseId, WorkspaceFiles } from "@/lib/course";
import { guidanceForCourse, guidanceModes, scriptFor, type GuidanceMode, type LessonScript, type Misconception } from "@/lib/lesson-scripts";

/*
 * The feature flag and the per-lesson guidance override for the V3 lesson
 * journey. The journey is additive: when the flag is off, or a lesson has no
 * script, the existing lesson interface renders exactly as it did in V2.
 *
 * Set NEXT_PUBLIC_V3_LESSON_JOURNEY=off to hide the journey everywhere. A learner
 * can also append ?journey=off to a course URL. The guidance level is stored per
 * lesson so a learner may ask for more support on one topic without changing the
 * default for the whole course.
 *
 * The pacing and gate helpers below are pure so the same rules that drive the
 * interface can be asserted without a browser. Phase 3 checks them directly.
 */

export const lessonJourneyFlag = process.env.NEXT_PUBLIC_V3_LESSON_JOURNEY !== "off";
export const guidanceStoragePrefix = "kidycode:guidance:";
export const masteryReflectionMinimum = 12;
export const projectReflectionMinimum = 10;

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

/* Hint pacing. A lesson without a journey script keeps the V2 behaviour: help is
 * available without a failed attempt. A scripted lesson makes the learner try
 * first, and asks for two attempts at the independent level. Balanced lessons
 * leave the choice with the learner. */
export function hintGateOpen(mode: GuidanceMode | null, attempts: number): boolean {
  if (!mode || mode === "balanced") return true;
  const attemptsRequired = mode === "guided" ? 1 : 2;
  return attempts >= attemptsRequired;
}

/* Hints are revealed in their authored order and never run past the last one. */
export function nextHintIndex(current: number, total: number): number {
  if (total <= 0) return -1;
  return Math.min(current + 1, total - 1);
}

/* Guided lessons show one requirement at a time: the first one that failed when a
 * check has run, otherwise the first one still to do. Balanced and independent
 * lessons show the whole list. */
export function visibleRequirements(
  requirements: string[],
  results: { label: string; passed: boolean }[],
  mode: GuidanceMode,
): string[] {
  if (mode !== "guided") return requirements;
  const failed = new Set(results.filter((result) => !result.passed).map((result) => result.label));
  const next = requirements.find((requirement) => failed.has(requirement));
  return next ? [next] : requirements.slice(0, 1);
}

export type CompletionGate = {
  activityType: "challenge" | "project" | "quiz";
  workChecked: boolean;
  practiceCorrect: boolean;
  quizPassed: boolean;
  journeyActive: boolean;
  masteryPassed: boolean;
  reflection: string;
};

/* The one completion rule. It keeps the V2 contract for lessons without a script
 * and adds the fresh mastery task and a written reflection for scripted lessons. */
export function completionGate({
  activityType,
  workChecked,
  practiceCorrect,
  quizPassed,
  journeyActive,
  masteryPassed,
  reflection,
}: CompletionGate): boolean {
  if (activityType === "quiz") return quizPassed;
  if (!workChecked || !practiceCorrect) return false;
  if (activityType === "project") return reflection.trim().length >= projectReflectionMinimum;
  if (!journeyActive) return true;
  return reflection.trim().length >= masteryReflectionMinimum && Boolean(masteryPassed);
}

/* The completion button additionally waits for the mastery task on any scripted
 * lesson, including a project lesson, so the button and the save path agree. */
export function completionButtonReady(gate: CompletionGate): boolean {
  return completionGate(gate) && (!gate.journeyActive || gate.activityType === "quiz" || Boolean(gate.masteryPassed));
}

/* Fresh-task checks. An invalid pattern fails closed instead of throwing, so a
 * broken script cannot lock a learner out of the lesson. */
export function evaluateMasteryChecks(checks: CodeTest[], workspace: WorkspaceFiles): { label: string; passed: boolean }[] {
  return checks.map((check) => {
    let passed = false;
    try {
      passed = new RegExp(check.pattern, "i").test(workspace[check.file]);
    } catch {
      passed = false;
    }
    return { label: check.label, passed };
  });
}

/* Preview runtime errors are kept newest-last, deduplicated and capped, so a
 * repeated error cannot hide the first one or grow without bound. */
export function appendPreviewError(current: string[], value: string, limit = 4): string[] {
  if (!value || current.includes(value)) return current;
  return [...current, value].slice(-limit);
}

/* What the learner is told after running the fresh task. */
export function masteryResultSummary(checked: boolean, results: { passed: boolean }[]): string {
  if (!checked || results.length === 0) return "";
  return results.every((result) => result.passed)
    ? "The fresh task passes. Explain it in your own words to finish."
    : "Not there yet. Repair one requirement and check again.";
}

/** The fresh task's editable files, in the order the lesson declares them. */
export function masteryEditorFiles(editableFiles: CodeFile[], fallback: CodeFile = "html"): CodeFile[] {
  return editableFiles.length > 0 ? editableFiles : [fallback];
}

/* Misconception-specific help. A script declares the wrong mental models this
 * concept invites and how each one shows up in the learner's own file, so the
 * hint names the wrong turn that was actually taken instead of repeating general
 * advice. At most two are shown at once, and an invalid detector is ignored
 * rather than throwing, so a broken script cannot lock a learner out. */
export function activeMisconceptions(script: LessonScript, workspace: WorkspaceFiles, limit = 2): Misconception[] {
  const matched: Misconception[] = [];
  for (const mistake of script.misconceptions) {
    let present = false;
    try {
      present = new RegExp(mistake.detect, "i").test(workspace[mistake.file]);
    } catch {
      present = false;
    }
    if (!present) continue;
    matched.push(mistake);
    if (matched.length >= limit) break;
  }
  return matched;
}
