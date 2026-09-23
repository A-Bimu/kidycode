"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { ExamPanel } from "@/components/ExamPanel";
import AssessmentFlow from "@/components/AssessmentFlow";
import { ProgressPage } from "@/components/ProgressPage";
import {
  languageGuidance,
  termDefinitions,
  type CodeFile,
  type CourseBundle,
  type CourseId,
  type Lesson,
  type PracticeQuestion,
  type ProjectChoice,
  type ProjectId,
  type Stage,
  type WorkspaceFiles,
} from "@/lib/course";
import PortfolioPage from "@/components/PortfolioPage";
import { courseRoutes } from "@/lib/course-routes";
import { buildPreview, type PreviewStorage } from "@/lib/preview";
import type { Summary } from "@/lib/summary";

type Learner = {
  id: string;
  nickname: string;
  age: number;
  theme: string;
  courseId?: CourseId;
};

type Session = { learner: Learner };
type SavedProgress = {
  status: "started" | "completed";
  questionCorrect?: boolean | number;
  reflection: string;
  workspaceJson: string;
};
type Checkpoint = { id: string; stageId: string; version: number; createdAt: string };
type CheckResult = { label: string; passed: boolean };
type LessonStep = "notes" | "practice" | "check";
type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type TutorNudge = {
  concept: string;
  focus: string;
  level: number;
  message: string;
  example: string;
  requirement: string;
};

export type TutorEvidence = {
  lessonId: string;
  attempts: number;
  successfulChecks: number;
  hintsRequested: number;
  mastery: number;
  masteryLabel: string;
  struggles: Array<{ concept: string; label: string; fails: number }>;
  focusArea: string;
  independentCorrections: number;
  interventionPending: boolean;
  bestQuizScore: number;
  checksAvailable: number;
  codePassed: boolean;
  quickCheckPassed: boolean;
  completedAt: string | null;
  lastActivityAt: string;
};

type TutorReply = {
  passed: boolean;
  results: CheckResult[];
  feedback: string;
  acknowledgement: string;
  nudge: TutorNudge | null;
  quickCheck: { correct: boolean; message: string } | null;
  quiz: { correct: number[]; missed: number[]; focus: string[]; score: number; total: number } | null;
  evidence: TutorEvidence;
  error?: string;
};

export type ReviewItem = {
  concept: string;
  label: string;
  focus: string;
  hint: string;
  explanation: string;
  lessonId: string;
  lessonTitle: string;
  moduleNumber: number;
  timesFailed: number;
  timesRecovered: number;
  reviewStreak: number;
  firstFailedAt: string;
  lastFailedAt: string;
};

type ReviewReply = { recalled: boolean; retired: boolean; item: ReviewItem | null; totalDue: number };

/* Review is also an enhancement. A failing request returns null so notes and the
 * rest of the lesson carry on without it. */
async function requestReview(concept?: string, recalled?: boolean): Promise<{ items: ReviewItem[]; totalDue: number } | ReviewReply | null> {
  try {
    const response = typeof concept === "string"
      ? await fetch("/api/review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ concept, recalled: Boolean(recalled) }),
        })
      : await fetch("/api/review", { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/* The tutor is an enhancement, never a gate. Every call returns null on any
 * failure so the lesson keeps working from the lesson's own content. */
async function requestTutor(body: Record<string, unknown>, signal?: AbortSignal): Promise<TutorReply | null> {
  try {
    const response = await fetch("/api/tutor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const data = await response.json() as TutorReply;
    if (!response.ok || !data.evidence) return null;
    return data;
  } catch {
    return null;
  }
}


const emptyFiles: WorkspaceFiles = { html: "", css: "", javascript: "" };
const activityNames = { challenge: "Coding lesson", project: "Project checkpoint", quiz: "Module check" };
const fileNames: Record<CodeFile, string> = { html: "HTML", css: "CSS", javascript: "JavaScript" };

const codeShortcuts = ["<", ">", "/", "{", "}", '"', "'", ";", "="];

function minutesLeft(expiresAt: string): number {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return remaining <= 0 ? 0 : Math.max(1, Math.ceil(remaining / 60_000));
}

function parseWorkspace(value: string): Partial<WorkspaceFiles> {
  try {
    return JSON.parse(value) as Partial<WorkspaceFiles>;
  } catch {
    return {};
  }
}

function normaliseFiles(value: Partial<WorkspaceFiles> | undefined, fallback: WorkspaceFiles = emptyFiles): WorkspaceFiles {
  return {
    html: typeof value?.html === "string" ? value.html : fallback.html,
    css: typeof value?.css === "string" ? value.css : fallback.css,
    javascript: typeof value?.javascript === "string" ? value.javascript : fallback.javascript,
  };
}

function normaliseProject(value: string, choices: ProjectChoice[]): ProjectId {
  return choices.some((choice) => choice.id === value) ? value as ProjectId : choices[0].id;
}

function fillProjectTokens(source: WorkspaceFiles, projectId: ProjectId, choices: ProjectChoice[]): WorkspaceFiles {
  const project = choices.find((choice) => choice.id === projectId) || choices[0];
  const replacements: Record<string, string> = {
    "{{TITLE}}": project.siteTitle,
    "{{INTRO}}": project.intro,
    "{{ITEM1}}": project.items[0],
    "{{ITEM2}}": project.items[1],
    "{{ITEM3}}": project.items[2],
  };
  const replace = (value: string) => Object.entries(replacements)
    .reduce((result, [token, content]) => result.split(token).join(content), value);
  return { html: replace(source.html), css: replace(source.css), javascript: replace(source.javascript) };
}

function activityLabel(activity: Lesson): string {
  if (activity.activityType === "project") return "Build your website";
  if (activity.activityType === "quiz") return "Knowledge check";
  return activity.language;
}

function inferredCourseId(learner: Learner): CourseId {
  if (learner.courseId) return learner.courseId;
  if (learner.age <= 12) return "ages-10-12";
  if (learner.age <= 15) return "ages-13-15";
  if (learner.age <= 18) return "ages-16-18";
  return "adults";
}

export function LearningApp({ course }: { course: CourseBundle }) {
  const { courseFacts, stages, lessons, projectChoices } = course;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [backendReady, setBackendReady] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Record<string, SavedProgress>>({});
  const [workspaces, setWorkspaces] = useState<Record<string, WorkspaceFiles>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [assessmentChecked, setAssessmentChecked] = useState(false);
  const [practiceAnswer, setPracticeAnswer] = useState(-1);
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [workChecked, setWorkChecked] = useState(false);
  const [testResults, setTestResults] = useState<CheckResult[]>([]);
  const [reflection, setReflection] = useState("");
  const [hintIndex, setHintIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [view, setView] = useState<"course" | "project" | "exam" | "progress" | "assessment">("course");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [pendingCheckpoint, setPendingCheckpoint] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, TutorEvidence>>({});
  const [tutorBusy, setTutorBusy] = useState(false);
  const [nudge, setNudge] = useState<TutorNudge | null>(null);
  const [tutorMessage, setTutorMessage] = useState("");
  const [tutorOffline, setTutorOffline] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewTotalDue, setReviewTotalDue] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewHintShown, setReviewHintShown] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryReload, setSummaryReload] = useState(0);
  const checkpointLock = useRef(new Set<string>());

  const currentActivity = lessons[currentIndex] || lessons[0];
  const currentStage = stages.find((stage) => stage.lessons.some((activity) => activity.id === currentActivity.id)) || stages[0];
  const stageActivityIndex = currentStage.lessons.findIndex((activity) => activity.id === currentActivity.id);
  const projectId = normaliseProject(session?.learner.theme || projectChoices[0].id, projectChoices);
  const validCompletedCount = lessons.filter((activity) => completed.has(activity.id)).length;
  const firstIncomplete = lessons.findIndex((activity) => !completed.has(activity.id));
  const allComplete = validCompletedCount === lessons.length;
  const stageDone = currentStage.lessons.filter((activity) => completed.has(activity.id)).length;
  const stageProgress = Math.round((stageDone / currentStage.lessons.length) * 100);
  const activityDone = completed.has(currentActivity.id);
  const questions = currentActivity.questions || [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((question, index) => answers[index] === question.answer).length;
  const quizPassed = currentActivity.activityType === "quiz" && assessmentChecked && correctCount >= 4;
  const practiceCorrect = currentActivity.activityType !== "quiz"
    && Boolean(currentActivity.question)
    && practiceChecked
    && practiceAnswer === currentActivity.question?.answer;
  const currentDraft = workspaces[currentActivity.id];
  const currentEvidence = evidence[currentActivity.id];
  const checksDone = currentEvidence?.successfulChecks || 0;
  const checksAvailable = currentEvidence?.checksAvailable
    || (1 + (currentActivity.question ? 1 : 0) + ((currentActivity.questions || []).length > 0 ? 1 : 0));
  const focusLabel = nudge?.focus || currentEvidence?.focusArea || "";

  function projectBaseline(activity: Lesson): WorkspaceFiles {
    if (activity.activityType === "project") {
      const stageIndex = stages.findIndex((stage) => stage.lessons.some((lesson) => lesson.id === activity.id));
      for (let index = stageIndex - 1; index >= 0; index -= 1) {
        const previousProject = stages[index].lessons.find((lesson) => lesson.activityType === "project");
        if (!previousProject) continue;
        if (workspaces[previousProject.id]) return workspaces[previousProject.id];
        if (saved[previousProject.id]) {
          return normaliseFiles(
            parseWorkspace(saved[previousProject.id].workspaceJson),
            fillProjectTokens(previousProject.starterFiles, projectId, projectChoices),
          );
        }
      }
    }
    return fillProjectTokens(activity.starterFiles, projectId, projectChoices);
  }

  function starterFor(activity: Lesson): WorkspaceFiles {
    return workspaces[activity.id] || projectBaseline(activity);
  }

  const workspace = starterFor(currentActivity);

  const loadActivityState = useCallback((index: number, records: Record<string, SavedProgress>) => {
    const activity = lessons[index];
    const record = records[activity.id];
    setCurrentIndex(index);
    setAnswers({});
    setAssessmentChecked(false);
    setPracticeAnswer(-1);
    setPracticeChecked(false);
    setWorkChecked(record?.status === "completed" && activity.activityType !== "quiz");
    setTestResults([]);
    setReflection(record?.reflection || "");
    setHintIndex(-1);
    setNudge(null);
    setTutorMessage("");
    setReviewHintShown(false);
    setReviewStatus("");
    setMessage("");
    setAutosaveStatus("idle");
  }, [lessons]);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      setLoadError("");
      try {
        const [response, tutorResponse, reviewResponse] = await Promise.all([
          fetch("/api/progress", { cache: "no-store" }),
          fetch("/api/tutor", { cache: "no-store" }).catch(() => null),
          fetch("/api/review", { cache: "no-store" }).catch(() => null),
        ]);
        if (reviewResponse?.ok) {
          const reviewData = await reviewResponse.json() as { items?: ReviewItem[]; totalDue?: number };
          if (active && Array.isArray(reviewData.items)) {
            setReviewItems(reviewData.items);
            setReviewTotalDue(reviewData.totalDue ?? reviewData.items.length);
          }
        }
        const data = await response.json() as {
          learner?: Learner;
          progress?: Array<SavedProgress & { lessonId: string }>;
          checkpoints?: Checkpoint[];
          error?: string;
        };
        if (tutorResponse?.ok) {
          const tutorData = await tutorResponse.json() as { evidence?: TutorEvidence[] };
          if (active && Array.isArray(tutorData.evidence)) {
            setEvidence(Object.fromEntries(tutorData.evidence.map((item) => [item.lessonId, item])));
          }
        }
        if (response.status === 401) {
          if (active) setSession(null);
          return;
        }
        if (!response.ok) throw new Error(data.error || "Progress is temporarily unavailable.");
        if (!active) return;
        if (data.learner) setSession({ learner: data.learner });
        const validIds = new Set(lessons.map((activity) => activity.id));
        const progress = (data.progress || []).filter((item) => validIds.has(item.lessonId));
        const records = Object.fromEntries(progress.map((item) => [item.lessonId, item]));
        const nextWorkspaces = Object.fromEntries(progress.map((item) => [
          item.lessonId,
          normaliseFiles(parseWorkspace(item.workspaceJson)),
        ]));
        const nextCompleted = new Set(progress
          .filter((item) => item.status === "completed")
          .map((item) => item.lessonId));
        setSaved(records);
        setWorkspaces(nextWorkspaces);
        setCompleted(nextCompleted);
        setCheckpoints(data.checkpoints || []);
        const nextIndex = lessons.findIndex((activity) => !nextCompleted.has(activity.id));
        loadActivityState(nextIndex === -1 ? lessons.length - 1 : nextIndex, records);
        setBackendReady(true);
      } catch (error) {
        if (active) {
          setBackendReady(false);
          setLoadError(error instanceof Error ? error.message : "Progress is temporarily unavailable.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProgress();
    return () => { active = false; };
  }, [courseFacts.id, lessons, loadActivityState]);

  useEffect(() => {
    if (!session || currentActivity.activityType === "quiz" || !currentDraft || activityDone) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setAutosaveStatus("saving");
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            lessonId: currentActivity.id,
            status: "started",
            questionAnswer: practiceAnswer,
            quizAnswers: [],
            reflection,
            workspace: currentDraft,
          }),
          signal: controller.signal,
        });
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error || "Draft could not be saved.");
        setSaved((current) => ({
          ...current,
          [currentActivity.id]: {
            status: "started",
            reflection,
            workspaceJson: JSON.stringify(currentDraft),
          },
        }));
        setBackendReady(true);
        setAutosaveStatus("saved");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBackendReady(false);
        setAutosaveStatus("error");
        setMessage(error instanceof Error ? error.message : "Draft could not be saved.");
      }
    }, 900);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [activityDone, currentActivity.activityType, currentActivity.id, currentDraft, practiceAnswer, reflection, session]);

  /* Progress is derived on the server every time it is opened, so it never goes
   * stale and never needs a second copy of the totals. The loading state is
   * derived from what is known, so nothing is set before the request settles. */
  useEffect(() => {
    if (view !== "progress" || !session) return;
    let active = true;
    const controller = new AbortController();
    async function loadSummary() {
      try {
        const response = await fetch("/api/summary", { cache: "no-store", signal: controller.signal });
        const data = await response.json() as { summary?: Summary; error?: string };
        if (!active) return;
        if (!response.ok || !data.summary) throw new Error(data.error || "Your progress could not be read right now.");
        setSummary(data.summary);
        setSummaryError("");
      } catch (error) {
        if (!active) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSummaryError(error instanceof Error ? error.message : "Your progress could not be read right now.");
      }
    }
    void loadSummary();
    return () => {
      active = false;
      controller.abort();
    };
  }, [view, session, summaryReload]);

  function openActivityById(lessonId: string) {
    const index = lessons.findIndex((activity) => activity.id === lessonId);
    if (index < 0) {
      setView("course");
      return;
    }
    chooseActivity(index);
  }

  function chooseActivity(index: number) {
    const unlockedThrough = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete;
    if (index < 0 || index > unlockedThrough) return;
    loadActivityState(index, saved);
    setView("course");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateWorkspace(next: WorkspaceFiles) {
    setWorkspaces((current) => ({ ...current, [currentActivity.id]: next }));
    setWorkChecked(false);
    setTestResults([]);
    setAutosaveStatus("idle");
  }

  /* Checking code grades locally for instant display and then asks the server,
   * which owns the recorded result and the nudge. If the tutor is unavailable
   * the local result stands, so a check never fails to respond. */
  async function checkWork() {
    const localResults = currentActivity.tests.map((codeTest) => {
      let passed = false;
      try {
        passed = new RegExp(codeTest.pattern, "i").test(workspace[codeTest.file]);
      } catch {
        passed = false;
      }
      return { label: codeTest.label, passed };
    });
    const localPassed = localResults.length > 0 && localResults.every((result) => result.passed);
    setTestResults(localResults);
    setWorkChecked(localPassed);
    setTutorBusy(true);
    const reply = await requestTutor({
      lessonId: currentActivity.id,
      action: "check",
      workspace,
      questionAnswer: practiceAnswer,
      quizAnswers: [],
    });
    setTutorBusy(false);
    if (!reply) {
      setTutorOffline(true);
      setMessage(localPassed
        ? "Code checks passed. Continue to the quick check."
        : "Read the failed check, make one repair and test again.");
      return;
    }
    setTutorOffline(false);
    setEvidence((current) => ({ ...current, [reply.evidence.lessonId]: reply.evidence }));
    if (reply.results.length > 0) {
      setTestResults(reply.results.map((result) => ({ label: result.label, passed: result.passed })));
      setWorkChecked(reply.passed);
    }
    setNudge(reply.nudge);
    /* A failed check explains the exact requirement first, then gives the
     * smallest useful hint for it. A pass acknowledges the concept instead. */
    setTutorMessage(reply.passed
      ? reply.acknowledgement
      : reply.nudge
        ? reply.nudge.message
        : reply.feedback);
    setMessage(reply.passed
      ? "Code checks passed. Continue to the quick check."
      : "Read the failed check, make one repair and test again.");
    if (!reply.passed) await refreshReview();
  }

  /* A new failure can add an item to the review queue, so the queue is refreshed
   * rather than waiting for a page reload. */
  async function refreshReview() {
    const result = await requestReview() as { items?: ReviewItem[]; totalDue?: number } | null;
    if (!result || !Array.isArray(result.items)) return;
    setReviewItems(result.items);
    setReviewTotalDue(result.totalDue ?? result.items.length);
  }

  /* The nudge button asks for the same support a check gives, and counts as a
   * requested hint. If the tutor is unreachable the lesson's own graduated
   * hints are revealed instead, so help is always available. */
  async function requestNudge() {
    const priorHints = evidence[currentActivity.id]?.hintsRequested || 0;
    setTutorBusy(true);
    const reply = await requestTutor({
      lessonId: currentActivity.id,
      action: "nudge",
      workspace,
      questionAnswer: practiceAnswer,
      quizAnswers: [],
    });
    setTutorBusy(false);
    if (!reply) {
      setTutorOffline(true);
      const nextHint = Math.min(hintIndex + 1, currentActivity.hints.length - 1);
      setHintIndex(nextHint);
      setTutorMessage(currentActivity.hints[Math.max(nextHint, 0)]);
      return;
    }
    setTutorOffline(false);
    setEvidence((current) => ({ ...current, [reply.evidence.lessonId]: reply.evidence }));
    if (reply.results.length > 0) {
      setTestResults(reply.results.map((result) => ({ label: result.label, passed: result.passed })));
      setWorkChecked(reply.passed);
    }
    setNudge(reply.nudge);
    setTutorMessage(reply.nudge ? reply.nudge.message : reply.acknowledgement || reply.feedback);
    if (reply.nudge) setHintIndex(Math.min(priorHints, currentActivity.hints.length - 1));
    if (reply.nudge) await refreshReview();
  }

  /* The quick check is graded on the server, and its message names the idea
   * that was missed instead of repeating the instruction to try again. */
  async function submitQuickCheck(answer: number) {
    setPracticeChecked(true);
    setTutorBusy(true);
    const reply = await requestTutor({
      lessonId: currentActivity.id,
      action: "quickcheck",
      workspace,
      questionAnswer: answer,
      quizAnswers: [],
    });
    setTutorBusy(false);
    if (!reply) {
      setTutorOffline(true);
      setTutorMessage("");
      return;
    }
    setTutorOffline(false);
    setEvidence((current) => ({ ...current, [reply.evidence.lessonId]: reply.evidence }));
    setNudge(reply.nudge);
    setTutorMessage(reply.quickCheck ? reply.quickCheck.message : reply.feedback);
  }

  /* One recall at a time. The answer is recorded against the learner, and the
   * item leaves the local list either way so the card never repeats itself in
   * one sitting. */
  async function answerReview(recalled: boolean) {
    const item = reviewItems[0];
    if (!item) return;
    setReviewBusy(true);
    setReviewStatus("");
    const result = await requestReview(item.concept, recalled) as ReviewReply | null;
    setReviewBusy(false);
    if (!result || typeof result.retired !== "boolean") {
      setReviewStatus("That answer was not saved. Your notes and lesson still work as usual.");
      return;
    }
    setReviewItems((current) => current.slice(1));
    setReviewTotalDue(result.totalDue);
    setReviewHintShown(false);
    setReviewStatus(recalled
      ? result.retired
        ? `${item.focus} is settled, so it will not come back.`
        : `Good. ${item.focus} will come back once more to be sure.`
      : `Not yet. ${item.focus} stays on your list for next time.`);
  }

  /* Module checks are graded on the server and recorded as evidence. */
  async function submitQuiz() {
    setAssessmentChecked(true);
    setTutorBusy(true);
    const reply = await requestTutor({
      lessonId: currentActivity.id,
      action: "quiz",
      workspace,
      questionAnswer: -1,
      quizAnswers: questions.map((_, index) => answers[index] ?? -1),
    });
    setTutorBusy(false);
    if (!reply) {
      setTutorOffline(true);
      setTutorMessage("");
      return;
    }
    setTutorOffline(false);
    setEvidence((current) => ({ ...current, [reply.evidence.lessonId]: reply.evidence }));
    setNudge(reply.nudge);
    setTutorMessage(reply.feedback);
  }

  async function saveActivity(status: "started" | "completed") {
    if (!session) return false;
    setSaving(true);
    try {
      const requestBody = currentActivity.activityType === "quiz"
        ? {
            lessonId: currentActivity.id,
            status,
            questionAnswer: -1,
            quizAnswers: questions.map((_, index) => answers[index] ?? -1),
            reflection: "",
            workspace,
          }
        : {
            lessonId: currentActivity.id,
            status,
            questionAnswer: practiceAnswer,
            quizAnswers: [],
            reflection,
            workspace,
          };
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Progress could not be saved.");
      setBackendReady(true);
      return true;
    } catch (error) {
      setBackendReady(false);
      setMessage(error instanceof Error ? error.message : "Progress could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveCheckpoint(
    stage: Stage,
    progressRecords: Record<string, SavedProgress> = saved,
    workspaceRecords: Record<string, WorkspaceFiles> = workspaces,
  ) {
    if (checkpoints.some((checkpoint) => checkpoint.stageId === stage.id)) {
      setPendingCheckpoint(null);
      return true;
    }
    if (checkpointLock.current.has(stage.id)) return false;
    checkpointLock.current.add(stage.id);
    try {
      const projectActivity = stage.lessons.find((activity) => activity.activityType === "project");
      if (!projectActivity) return true;
      const projectWorkspace = workspaceRecords[projectActivity.id]
        || normaliseFiles(
          parseWorkspace(progressRecords[projectActivity.id]?.workspaceJson || "{}"),
          fillProjectTokens(projectActivity.starterFiles, projectId, projectChoices),
        );
      const response = await fetch("/api/checkpoints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          reflection: progressRecords[projectActivity.id]?.reflection || "Module work completed and checked.",
          project: { ...projectWorkspace, theme: projectId },
        }),
      });
      const data = await response.json() as { checkpoint?: Checkpoint; error?: string };
      if (!response.ok || !data.checkpoint) {
        throw new Error(data.error || "The project version could not be saved.");
      }
      setCheckpoints((current) => current.some((item) => item.id === data.checkpoint?.id)
        ? current
        : [data.checkpoint!, ...current]);
      setPendingCheckpoint(null);
      setBackendReady(true);
      return true;
    } catch (error) {
      setPendingCheckpoint(stage.id);
      setBackendReady(false);
      setMessage(error instanceof Error ? error.message : "The project version could not be saved.");
      return false;
    } finally {
      checkpointLock.current.delete(stage.id);
    }
  }

  async function retryCheckpoint() {
    if (!pendingCheckpoint) return;
    const stage = stages.find((item) => item.id === pendingCheckpoint);
    if (!stage) return;
    setMessage("Saving the module project version...");
    const didSave = await saveCheckpoint(stage);
    setMessage(didSave ? "The module project version is saved." : "The project version is still waiting. Try again when the connection is ready.");
  }

  async function completeActivity() {
    if (activityDone) {
      if (currentIndex < lessons.length - 1) chooseActivity(currentIndex + 1);
      return;
    }
    const allowed = currentActivity.activityType === "challenge"
      ? workChecked && practiceCorrect
      : currentActivity.activityType === "project"
        ? workChecked && practiceCorrect && reflection.trim().length >= 10
        : quizPassed;
    if (!allowed) return;
    const didSave = await saveActivity("completed");
    if (!didSave) return;

    const nextCompleted = new Set(completed).add(currentActivity.id);
    const nextSaved = {
      ...saved,
      [currentActivity.id]: {
        status: "completed" as const,
        reflection,
        workspaceJson: JSON.stringify(workspace),
      },
    };
    setCompleted(nextCompleted);
    setSaved(nextSaved);

    let checkpointSaved = true;
    if (currentActivity.activityType === "quiz") {
      checkpointSaved = await saveCheckpoint(currentStage, nextSaved, workspaces);
    }

    if (currentIndex < lessons.length - 1) {
      loadActivityState(currentIndex + 1, nextSaved);
      if (currentActivity.activityType === "quiz") {
        setMessage(checkpointSaved
          ? `Module ${currentStage.number} complete. The next module is open.`
          : `Module ${currentStage.number} is complete. Your project version still needs to be saved.`);
      } else {
        setMessage("Lesson complete. The next coding task is ready.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMessage("The course is complete. Your final check is ready.");
    }
  }

  if (loading) {
    return <main className="loading-page"><div className="loading-mark">K</div><p>Opening your coding course...</p></main>;
  }
  if (loadError) {
    return <main className="loading-page load-error" role="alert"><div className="loading-mark">K</div><h1>We could not open your saved course.</h1><p>{loadError}</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Try again</button></main>;
  }
  if (!session) return <Onboarding course={course} onCreated={setSession} />;

  const learnerCourseId = inferredCourseId(session.learner);
  if (learnerCourseId !== courseFacts.id) {
    return <CourseMismatch learner={session.learner} requestedCourse={course} onReset={() => setSession(null)} />;
  }
  if (view === "exam") return <ExamPanel course={course} onBack={() => setView("course")} />;
  if (view === "assessment") {
    return <AssessmentFlow course={course} completedActivityIds={[...completed]} onExit={() => setView("course")} onOpenLesson={openActivityById} />;
  }

  return (
    <div className="course-app coding-course">
      <header className="course-header coding-header">
        <a className="course-brand" href="/" aria-label="KidyCode home"><span>K</span><b>KidyCode</b></a>
        <div className="local-progress" aria-label={`${stageDone} of ${currentStage.lessons.length} activities complete in this module`}>
          <div>
            <span>Module {currentStage.number} · lesson {stageActivityIndex + 1} of {currentStage.lessons.length}</span>
            <b>{currentStage.title}</b>
            <small className="check-tally">{checksDone} of {checksAvailable} checks passed</small>
          </div>
          <div className="progress-track"><i style={{ width: `${stageProgress}%` }} /></div>
        </div>
        <nav aria-label="Course views">
          <button className={view === "course" ? "is-active" : ""} type="button" onClick={() => setView("course")}>Learn</button>
          <button className={view === "project" ? "is-active" : ""} type="button" onClick={() => setView("project")}>My website</button>
          <button className={view === "progress" ? "is-active" : ""} type="button" onClick={() => setView("progress")}>My progress</button>
          <button className={(view as string) === "assessment" ? "is-active" : ""} type="button" onClick={() => setView("assessment")}>Module checks</button>
          <button type="button" disabled={!allComplete} onClick={() => setView("exam")}>Final check</button>
        </nav>
        <div className={`learner-name${courseFacts.id === "adults" ? " is-adult" : ""}`}><span>{courseFacts.id === "adults" ? "Adult" : session.learner.age}</span>{session.learner.nickname}</div>
      </header>

      {view === "progress" ? (
        <ProgressPage
          course={course}
          summary={summary}
          loading={view === "progress" && summary === null && summaryError === ""}
          error={summaryError}
          onRetry={() => { setSummary(null); setSummaryError(""); setSummaryReload((count) => count + 1); }}
          onBack={() => setView("course")}
          onOpenNext={openActivityById}
        />
      ) : view === "project" ? (
        <PortfolioPage onContinue={() => setView("course")} />
      ) : (
        <main className="fcc-course-layout">
          <CourseRail
            stages={stages}
            lessons={lessons}
            currentStage={currentStage}
            completed={completed}
            currentIndex={currentIndex}
            firstIncomplete={firstIncomplete}
            chooseActivity={chooseActivity}
            course={course}
          />
          <article className="coding-lesson-page">
            {(!backendReady || pendingCheckpoint) && (
              <div className="backend-warning" role="alert">
                <span>{pendingCheckpoint ? "Your course progress is safe, but one module project version still needs to be saved." : "Saving is temporarily unavailable. Keep this page open and try again shortly."}</span>
                {pendingCheckpoint && <button type="button" onClick={() => void retryCheckpoint()}>Retry project save</button>}
              </div>
            )}
            {currentActivity.activityType === "quiz" ? (
              <QuizActivity
                activity={currentActivity}
                answers={answers}
                setAnswers={setAnswers}
                checked={assessmentChecked}
                setChecked={setAssessmentChecked}
                correctCount={correctCount}
                answeredCount={answeredCount}
                complete={() => void completeActivity()}
                saving={saving}
                done={activityDone}
                tutorBusy={tutorBusy}
                tutorMessage={tutorMessage}
                nudge={nudge}
                focusLabel={focusLabel}
                checksDone={checksDone}
                checksAvailable={checksAvailable}
                submitQuiz={submitQuiz}
              />
            ) : (
              <CodingActivity
                key={currentActivity.id}
                activity={currentActivity}
                stage={currentStage}
                workspace={workspace}
                resetFiles={projectBaseline(currentActivity)}
                updateWorkspace={updateWorkspace}
                checkWork={checkWork}
                message={message}
                results={testResults}
                hintIndex={hintIndex}
                setHintIndex={setHintIndex}
                reflection={reflection}
                setReflection={setReflection}
                practiceAnswer={practiceAnswer}
                practiceChecked={practiceChecked}
                setPracticeAnswer={(answer) => { setPracticeAnswer(answer); setPracticeChecked(false); }}
                complete={() => void completeActivity()}
                saving={saving}
                autosaveStatus={autosaveStatus}
                done={activityDone}
                ready={workChecked && practiceCorrect && (currentActivity.activityType !== "project" || reflection.trim().length >= 10)}
                tutorBusy={tutorBusy}
                nudge={nudge}
                tutorMessage={tutorMessage}
                focusLabel={focusLabel}
                checksDone={checksDone}
                checksAvailable={checksAvailable}
                hintsRequested={currentEvidence?.hintsRequested || 0}
                tutorOffline={tutorOffline}
                requestNudge={requestNudge}
                submitQuickCheck={submitQuickCheck}
                reviewItem={reviewItems[0] || null}
                reviewTotal={Math.max(reviewTotalDue, reviewItems.length)}
                reviewBusy={reviewBusy}
                reviewHintShown={reviewHintShown}
                reviewStatus={reviewStatus}
                onRevealReview={() => setReviewHintShown(true)}
                onAnswerReview={(recalled) => void answerReview(recalled)}
              />
            )}
            <footer className="activity-footer">
              <button type="button" disabled={currentIndex === 0} onClick={() => chooseActivity(currentIndex - 1)}>← Previous</button>
              <span>Module {currentStage.number}, lesson {stageActivityIndex + 1}</span>
              <button type="button" disabled={!activityDone || currentIndex === lessons.length - 1} onClick={() => chooseActivity(currentIndex + 1)}>Next →</button>
            </footer>
          </article>
        </main>
      )}
    </div>
  );
}

/* A small recall card shown before new material. It is one item at a time so it
 * never crowds a lesson, and it disappears completely when nothing is due. */
function ReviewCard({
  item,
  position,
  total,
  busy,
  hintShown,
  onReveal,
  onAnswer,
}: {
  item: ReviewItem;
  position: number;
  total: number;
  busy: boolean;
  hintShown: boolean;
  onReveal: () => void;
  onAnswer: (recalled: boolean) => void;
}) {
  const missed = item.timesFailed === 1 ? "once so far" : `${item.timesFailed} times so far`;
  return (
    <section className="review-card" aria-labelledby="review-heading">
      <div className="review-copy">
        <p className="section-label">Come back to this</p>
        <h2 id="review-heading">{item.focus}</h2>
        <p className="review-source">From {item.lessonTitle}. Missed {missed}.</p>
      </div>
      <div className="review-ask">
        <p>{hintShown ? "Read the hint, then answer honestly." : "Can you do this now without help?"}</p>
        <div className="review-actions">
          <button className="primary-button" type="button" disabled={busy} onClick={() => onAnswer(true)}>
            {busy ? "Saving..." : "I can do this"}
          </button>
          {!hintShown && (
            <button className="outline-button" type="button" disabled={busy} onClick={onReveal}>Show me again</button>
          )}
          {hintShown && (
            <button className="outline-button" type="button" disabled={busy} onClick={() => onAnswer(false)}>Not yet</button>
          )}
        </div>
        <p className="review-count">{position} of {total} to revisit</p>
      </div>
      {hintShown && (
        <div className="review-hint">
          <p>{item.hint}</p>
          <p className="review-hint-more">{item.explanation}</p>
        </div>
      )}
    </section>
  );
}

function CourseRail({
  stages,
  lessons,
  currentStage,
  completed,
  currentIndex,
  firstIncomplete,
  chooseActivity,
  course,
}: {
  stages: Stage[];
  lessons: Lesson[];
  currentStage: Stage;
  completed: Set<string>;
  currentIndex: number;
  firstIncomplete: number;
  chooseActivity: (index: number) => void;
  course: CourseBundle;
}) {
  return (
    <aside className="fcc-rail coding-rail">
      <div className="rail-title">
        <p className="kicker">{course.courseFacts.ageRange.toUpperCase()}</p>
        <h2>{course.courseFacts.title}</h2>
        <p>Real code · {course.courseFacts.estimatedHours}</p>
      </div>
      <div className="stage-list">
        {stages.map((stage) => {
          const done = stage.lessons.filter((lesson) => completed.has(lesson.id)).length;
          const isCurrent = stage.id === currentStage.id;
          return (
            <details
              key={stage.id}
              open={isCurrent}
              data-current={isCurrent ? "true" : "false"}
              onToggle={(event) => {
                if (isCurrent && !event.currentTarget.open) event.currentTarget.open = true;
              }}
            >
              <summary><span>{String(stage.number).padStart(2, "0")}</span><div><b>{stage.title}</b><small>{done} of {stage.lessons.length} complete</small></div></summary>
              <div className="rail-lessons">
                {stage.lessons.map((activity) => {
                  const index = lessons.findIndex((item) => item.id === activity.id);
                  const unlockedThrough = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete;
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      disabled={index > unlockedThrough}
                      className={`${index === currentIndex ? "is-current" : ""}${completed.has(activity.id) ? " is-done" : ""}`}
                      onClick={() => chooseActivity(index)}
                    >
                      <i>{completed.has(activity.id) ? "✓" : activity.activityNumber}</i>
                      <span><small>{activityLabel(activity)}</small>{activity.title}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </aside>
  );
}

function CodingActivity({
  activity,
  stage,
  workspace,
  resetFiles,
  updateWorkspace,
  checkWork,
  message,
  results,
  hintIndex,
  setHintIndex,
  reflection,
  setReflection,
  practiceAnswer,
  practiceChecked,
  setPracticeAnswer,
  complete,
  saving,
  autosaveStatus,
  done,
  ready,
  tutorBusy,
  nudge,
  tutorMessage,
  focusLabel,
  checksDone,
  checksAvailable,
  hintsRequested,
  tutorOffline,
  requestNudge,
  submitQuickCheck,
  reviewItem,
  reviewTotal,
  reviewBusy,
  reviewHintShown,
  reviewStatus,
  onRevealReview,
  onAnswerReview,
}: {
  activity: Lesson;
  stage: Stage;
  workspace: WorkspaceFiles;
  resetFiles: WorkspaceFiles;
  updateWorkspace: (files: WorkspaceFiles) => void;
  checkWork: () => void;
  message: string;
  results: CheckResult[];
  hintIndex: number;
  setHintIndex: Dispatch<SetStateAction<number>>;
  reflection: string;
  setReflection: Dispatch<SetStateAction<string>>;
  practiceAnswer: number;
  practiceChecked: boolean;
  setPracticeAnswer: (answer: number) => void;
  complete: () => void;
  saving: boolean;
  autosaveStatus: AutosaveStatus;
  done: boolean;
  ready: boolean;
  tutorBusy: boolean;
  nudge: TutorNudge | null;
  tutorMessage: string;
  focusLabel: string;
  checksDone: number;
  checksAvailable: number;
  hintsRequested: number;
  tutorOffline: boolean;
  requestNudge: () => void;
  submitQuickCheck: (answer: number) => void;
  reviewItem: ReviewItem | null;
  reviewTotal: number;
  reviewBusy: boolean;
  reviewHintShown: boolean;
  reviewStatus: string;
  onRevealReview: () => void;
  onAnswerReview: (recalled: boolean) => void;
}) {
  const [activeFile, setActiveFile] = useState<CodeFile>(activity.editableFiles[0] || "html");
  const [preview, setPreview] = useState(() => buildPreview(workspace));
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [previewStorage, setPreviewStorage] = useState<PreviewStorage>({});
  const [lessonStep, setLessonStep] = useState<LessonStep>("notes");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const guidance = languageGuidance[activity.language];
  const practiceFiles = activity.editableFiles.map((file) => fileNames[file]).join(", ");
  const codePassed = results.length > 0 && results.every((result) => result.passed);

  useEffect(() => {
    function receivePreviewMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { source?: string; kind?: string; value?: string } | null;
      if (!data || data.source !== "kidycode-preview" || !data.value) return;
      if (data.kind === "error") {
        setPreviewErrors((current) => current.includes(data.value!) ? current : [...current, data.value!].slice(-4));
        return;
      }
      if (data.kind !== "storage") return;
      try {
        const change = JSON.parse(data.value) as { operation: "set" | "remove" | "clear"; key?: string; value?: string };
        setPreviewStorage((current) => {
          if (change.operation === "clear") return {};
          if (!change.key) return current;
          if (change.operation === "remove") {
            const next = { ...current };
            delete next[change.key];
            return next;
          }
          return { ...current, [change.key]: change.value || "" };
        });
      } catch {
        return;
      }
    }
    window.addEventListener("message", receivePreviewMessage);
    return () => window.removeEventListener("message", receivePreviewMessage);
  }, []);

  function runCode() {
    setPreviewErrors([]);
    setPreview(buildPreview(workspace, previewStorage));
  }

  function openStep(step: LessonStep) {
    setLessonStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function insertShortcut(shortcut: string) {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const current = workspace[activeFile];
    updateWorkspace({
      ...workspace,
      [activeFile]: `${current.slice(0, start)}${shortcut}${current.slice(end)}`,
    });
    window.requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + shortcut.length, start + shortcut.length);
    });
  }

  function resetWorkspace() {
    const label = activity.activityType === "project" ? "the last saved project version" : "the lesson starter";
    if (!window.confirm(`Replace your current code with ${label}? Your unsaved changes will be lost.`)) return;
    updateWorkspace(resetFiles);
    setPreviewStorage({});
    setPreviewErrors([]);
    setPreview(buildPreview(resetFiles));
  }

  return (
    <div className={`guided-lesson is-${lessonStep}`}>
      <header className="guided-lesson-header">
        <div className="lesson-position"><span>Module {stage.number} · {activity.minutes} min</span><b>{activityNames[activity.activityType]}</b></div>
        <div className="guided-title"><div><span className="language-pill">{activity.language}</span><h1>{activity.title}</h1><p>{activity.objective}</p></div></div>
        <nav className="lesson-stepper" aria-label="Lesson steps">
          <button type="button" className={lessonStep === "notes" ? "is-current" : ""} aria-current={lessonStep === "notes" ? "step" : undefined} onClick={() => openStep("notes")}><span>1</span><b>Notes</b><small>Learn the idea</small></button>
          <button type="button" className={`${lessonStep === "practice" ? "is-current" : ""}${codePassed ? " is-complete" : ""}`} aria-current={lessonStep === "practice" ? "step" : undefined} onClick={() => openStep("practice")}><span>2</span><b>Practice</b><small>Write real code</small></button>
          <button type="button" disabled={!done && !codePassed} className={`${lessonStep === "check" ? "is-current" : ""}${done ? " is-complete" : ""}`} aria-current={lessonStep === "check" ? "step" : undefined} onClick={() => openStep("check")}><span>3</span><b>Quick check</b><small>Show what you know</small></button>
        </nav>
      </header>

      {lessonStep === "notes" && (
        <section className="lesson-screen notes-screen">
          {reviewItem && (
            <ReviewCard
              item={reviewItem}
              position={1}
              total={reviewTotal}
              busy={reviewBusy}
              hintShown={reviewHintShown}
              onReveal={onRevealReview}
              onAnswer={onAnswerReview}
            />
          )}
          <p className={`review-status${reviewItem ? "" : " is-standalone"}`} aria-live="polite">{reviewStatus}</p>
          <section className="notes-sheet">
            <div className="notes-section">
              <p className="section-label">FIRST, UNDERSTAND THE IDEA</p>
              <h2>What you are learning</h2>
              {activity.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <aside className="language-guide" aria-label={`${activity.language} guide`}><span>{activity.language}</span><div><h3>Where this lesson fits</h3><p>{guidance.purpose}</p><p>{guidance.next}</p></div></aside>
            <div className="worked-example">
              <div className="example-heading"><div><p className="section-label">WORKED EXAMPLE</p><h2>{activity.exampleTitle}</h2></div><span>Read it before typing</span></div>
              <pre><code>{activity.exampleCode}</code></pre>
              <div className="example-reading"><h3>What the example does</h3><p>{activity.exampleExplanation}</p><h3>How to read this language</h3><p>{guidance.reading}</p></div>
            </div>
            <div className="key-words"><div><p className="section-label">WORDS TO KNOW</p><h2>Keep these meanings nearby</h2></div><dl>{activity.keyTerms.map((term) => <div key={term}><dt>{term}</dt><dd>{termDefinitions[term] || "A coding idea used in this lesson."}</dd></div>)}</dl></div>
            <div className="lesson-next"><p><b>Ready for practice?</b> The next screen gives you one task and the {practiceFiles || activity.language} code you need.</p><button className="primary-button" type="button" onClick={() => openStep("practice")}>Start practice</button></div>
          </section>
        </section>
      )}

      {lessonStep === "practice" && (
        <section className="lesson-screen practice-screen">
          <section className="practice-brief"><div><p className="section-label">YOUR PRACTICE TASK</p><h2>{activity.task}</h2><p>Work in {practiceFiles || activity.language}. Make one small change, run it, then compare the preview with the task.</p></div><button className="text-button" type="button" onClick={() => openStep("notes")}>Read the notes again</button></section>
          <section className="coding-studio">
            <div className="editor-panel">
              <div className="file-tabs" role="tablist" aria-label="Code files">
                {activity.editableFiles.map((file) => <button key={file} role="tab" aria-selected={activeFile === file} className={activeFile === file ? "is-active" : ""} onClick={() => setActiveFile(file)} type="button">{fileNames[file]}</button>)}
              </div>
              <textarea ref={editorRef} aria-label={`${fileNames[activeFile]} code editor`} spellCheck={false} value={workspace[activeFile]} onChange={(event) => updateWorkspace({ ...workspace, [activeFile]: event.target.value })} />
              <div className="code-shortcuts" aria-label="Code character shortcuts">
                {codeShortcuts.map((shortcut) => <button key={shortcut} type="button" onClick={() => insertShortcut(shortcut)} aria-label={`Insert ${shortcut}`}>{shortcut}</button>)}
              </div>
            </div>
            <div className="preview-panel">
              <div><b>Browser preview</b><span>Updates when you run the code</span></div>
              <iframe ref={iframeRef} title="Website preview" sandbox="allow-scripts" srcDoc={preview} />
              {previewErrors.length > 0 && <div className="preview-runtime" role="alert"><b>Your code reported a problem</b>{previewErrors.map((error) => <code key={error}>{error}</code>)}</div>}
            </div>
            <div className="code-actions">
              <button className="outline-button" type="button" onClick={runCode}>Run code</button>
              <button className="primary-button" type="button" disabled={tutorBusy} onClick={() => { runCode(); void checkWork(); }}>{tutorBusy ? "Checking your code..." : "Check my code"}</button>
              <button className="text-button" type="button" onClick={resetWorkspace}>Start again</button>
              <span className={`autosave-status is-${autosaveStatus}`} aria-live="polite">{autosaveStatus === "saving" ? "Saving draft..." : autosaveStatus === "saved" ? "Draft saved" : autosaveStatus === "error" ? "Draft not saved yet" : "Changes save automatically"}</span>
            </div>
            {message && <p className="workspace-message" aria-live="polite">{message}</p>}
            {results.length > 0 && <div className="test-results">{results.map((result) => <p className={result.passed ? "is-pass" : "is-fail"} key={result.label}><span>{result.passed ? "✓" : "×"}</span>{result.label}</p>)}</div>}
            <div className="practice-help">
              <div className="tutor-panel">
                <div className="tutor-heading">
                  <span className="tutor-label">Your tutor</span>
                  <b>{focusLabel ? `Working on ${focusLabel}` : "Ready when you are"}</b>
                  <small className="check-tally">{checksDone} of {checksAvailable} checks passed</small>
                </div>
                <div className="tutor-actions">
                  <button className="outline-button tutor-nudge" type="button" disabled={tutorBusy} onClick={() => void requestNudge()}>
                    {tutorBusy ? "Finding a nudge..." : hintsRequested > 0 ? "Another nudge" : "Give me a nudge"}
                  </button>
                  <button className="text-button" type="button" disabled={tutorBusy} onClick={() => setHintIndex((current) => Math.min(current + 1, activity.hints.length - 1))}>Show hint {Math.min(hintIndex + 2, activity.hints.length)}</button>
                </div>
                <div className="tutor-advice" aria-live="polite">
                  {nudge?.requirement && <p className="tutor-requirement"><b>Not there yet</b>{nudge.requirement}</p>}
                  {tutorMessage
                    ? <p className="tutor-message">{tutorMessage}</p>
                    : tutorOffline
                      ? <p className="is-quiet">The tutor is unavailable right now. Your lesson hints, checks and progress all still work.</p>
                      : <p className="is-quiet">Make one change, run your code, then check it. A nudge points at the exact requirement you still need.</p>}
                  {nudge?.example && <pre className="tutor-example"><code>{nudge.example}</code></pre>}
                  {hintIndex >= 0 && <p className="tutor-lesson-hint"><b>Lesson hint {Math.min(hintIndex + 1, activity.hints.length)}</b>{activity.hints[hintIndex]}</p>}
                </div>
              </div>
              <div className="practice-next"><p>{codePassed ? "Your code passed. Now answer one short question." : "Use Check my code before moving to the last step."}</p><button className="primary-button" type="button" disabled={!done && !codePassed} onClick={() => openStep("check")}>Continue to quick check</button></div>
            </div>
          </section>
        </section>
      )}

      {lessonStep === "check" && (
        <section className="lesson-screen check-screen">
          <section className="check-card">
            <header><p className="section-label">ONE LAST STEP</p><h2>Check what you understood</h2><p>Your code already passed. Answer this question without guessing, then read the explanation.</p></header>
            {activity.question && <QuickCheck question={activity.question} selected={practiceAnswer} checked={practiceChecked} busy={tutorBusy} serverMessage={tutorMessage} onSelect={setPracticeAnswer} onCheck={() => void submitQuickCheck(practiceAnswer)} />}
            {activity.activityType === "project" && <div className="project-reflection"><label htmlFor="project-reflection"><b>Explain one choice</b><span>{activity.reflection}</span></label><textarea id="project-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="I chose... because..." /></div>}
            <div className="completion-bar"><span>{ready ? "You passed the code task and the quick check." : activity.activityType === "project" ? "Answer correctly and explain one project choice." : "Choose an answer and check it to complete the lesson."}</span><button className="primary-button" type="button" disabled={!ready || saving || done} onClick={complete}>{done ? "Lesson complete" : saving ? "Saving..." : activity.activityType === "project" ? "Save project version" : "Complete lesson"}</button></div>
            <button className="text-button back-to-practice" type="button" onClick={() => openStep("practice")}>Return to practice</button>
          </section>
        </section>
      )}
    </div>
  );
}

function QuickCheck({ question, selected, checked, busy, serverMessage, onSelect, onCheck }: { question: PracticeQuestion; selected: number; checked: boolean; busy: boolean; serverMessage: string; onSelect: (answer: number) => void; onCheck: () => void }) {
  const correct = selected === question.answer;
  return (
    <fieldset className="quick-check">
      <legend><span>Quick check</span>{question.prompt}</legend>
      <div>{question.options.map((option, index) => <label key={option} className={selected === index ? "is-selected" : ""}><input type="radio" name="practice-question" checked={selected === index} onChange={() => onSelect(index)} /><b>{String.fromCharCode(65 + index)}</b>{option}</label>)}</div>
      <button className="outline-button" type="button" disabled={selected < 0 || busy} onClick={onCheck}>{busy ? "Checking..." : "Check answer"}</button>
      {checked && <p className={correct ? "is-correct" : "is-wrong"} aria-live="polite"><b>{correct ? "Correct." : "Not that one yet."}</b> {serverMessage || question.explanation}</p>}
    </fieldset>
  );
}

function QuizActivity({ activity, answers, setAnswers, checked, setChecked, correctCount, answeredCount, complete, saving, done, tutorBusy, tutorMessage, nudge, focusLabel, checksDone, checksAvailable, submitQuiz }: { activity: Lesson; answers: Record<number, number>; setAnswers: Dispatch<SetStateAction<Record<number, number>>>; checked: boolean; setChecked: Dispatch<SetStateAction<boolean>>; correctCount: number; answeredCount: number; complete: () => void; saving: boolean; done: boolean; tutorBusy: boolean; tutorMessage: string; nudge: TutorNudge | null; focusLabel: string; checksDone: number; checksAvailable: number; submitQuiz: () => void }) {
  const questions = activity.questions || [];
  const passed = checked && correctCount >= 4;
  return (
    <div className="quiz-page">
      <header><p className="activity-type">MODULE CHECK</p><h1>{activity.title}</h1><h2>Five questions. Four correct answers to continue.</h2><p>Every answer comes from code you already wrote.</p></header>
      <QuestionList questions={questions} answers={answers} setAnswers={(next) => { setChecked(false); setAnswers(next); }} showFeedback={checked} />
      {checked && <div className={`quiz-result ${passed ? "is-pass" : "is-fail"}`} aria-live="polite"><b>{correctCount} of {questions.length} correct</b><span>{tutorMessage || (passed ? "The next module is ready." : "Review the lesson examples, then try again.")}</span></div>}
      {!passed && focusLabel && <p className="quiz-focus">Focus next: <b>{focusLabel}</b></p>}
      <div className="tutor-quiz-tally"><span className="check-tally">{checksDone} of {checksAvailable} checks passed</span>{nudge && <span>Level {nudge.level} support</span>}</div>
      <div className="completion-bar"><span>{answeredCount} of {questions.length} answered</span>{!checked && <button className="outline-button" type="button" disabled={answeredCount !== questions.length || tutorBusy} onClick={() => void submitQuiz()}>{tutorBusy ? "Checking..." : "Check answers"}</button>}{checked && !passed && <button className="outline-button" type="button" onClick={() => { setAnswers({}); setChecked(false); }}>Try again</button>}{passed && <button className="primary-button" type="button" disabled={saving || done} onClick={complete}>{done ? "Module complete" : saving ? "Saving..." : "Complete module"}</button>}</div>
    </div>
  );
}

function QuestionList({ questions, answers, setAnswers, showFeedback }: { questions: PracticeQuestion[]; answers: Record<number, number>; setAnswers: Dispatch<SetStateAction<Record<number, number>>>; showFeedback: boolean }) {
  return (
    <div className="question-list">
      {questions.map((question, questionIndex) => {
        const selected = answers[questionIndex];
        const correct = selected === question.answer;
        return (
          <fieldset key={question.prompt}>
            <legend><span>{questionIndex + 1}</span>{question.prompt}</legend>
            <div>{question.options.map((option, optionIndex) => <label key={option} className={selected === optionIndex ? "is-selected" : ""}><input type="radio" name={`question-${questionIndex}`} checked={selected === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</label>)}</div>
            {showFeedback && selected !== undefined && <p className={correct ? "is-correct" : "is-wrong"}><b>{correct ? "Correct." : "Review this idea."}</b> {question.explanation}</p>}
          </fieldset>
        );
      })}
    </div>
  );
}

function CourseMismatch({ learner, requestedCourse, onReset }: { learner: Learner; requestedCourse: CourseBundle; onReset: () => void }) {
  const learnerCourseId = inferredCourseId(learner);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [safety, setSafety] = useState<{ hasCode: boolean; guardianConnected: boolean } | null>(null);
  const [rescue, setRescue] = useState<{ code: string; expiresAt: string } | null>(null);
  const [rescueBusy, setRescueBusy] = useState(false);

  /* Clearing this device can strand a learner, so before any warning appears the
   * page finds out whether there is a way back in: an unused transfer code, or a
   * grown-up who is connected. The warning then says plainly which applies. */
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/transfer/codes", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { pending: { expiresAt: string } | null; guardianConnected: boolean };
        if (active) setSafety({ hasCode: Boolean(data.pending), guardianConnected: data.guardianConnected });
      } catch {
        /* The warning stands without this detail. */
      }
    })();
    return () => { active = false; };
  }, []);

  async function createRescueCode() {
    setRescueBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/transfer/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await response.json() as { transfer?: { code: string; expiresAt: string }; error?: string };
      if (!response.ok || !data.transfer) throw new Error(data.error || "A transfer code could not be created right now.");
      setRescue(data.transfer);
      setSafety({ hasCode: true, guardianConnected: Boolean(safety?.guardianConnected) });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A transfer code could not be created right now.");
    } finally {
      setRescueBusy(false);
    }
  }

  async function resetProfile() {
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch("/api/learners", { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "The profile could not be reset.");
      onReset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The profile could not be reset.");
    } finally {
      setDeleting(false);
    }
  }

  const canRecover = Boolean(rescue) || Boolean(safety?.hasCode) || Boolean(safety?.guardianConnected);

  return (
    <main className="profile-mismatch">
      <a className="course-brand" href="/"><span>K</span><b>KidyCode</b></a>
      <section>
        <p className="kicker">YOUR SAVED COURSE</p>
        <h1>This profile belongs to a different learning path.</h1>
        <p>{learner.nickname}&apos;s saved work is kept in another KidyCode path. Open that course to continue exactly where you stopped.</p>
        <div className="mismatch-actions">
          <a className="primary-button" href={courseRoutes[learnerCourseId]}>Open my saved course</a>
          <button className="outline-button" type="button" disabled={deleting} onClick={() => setConfirming(true)} data-testid="reset-start">
            {`Start ${requestedCourse.courseFacts.ageRange} instead`}
          </button>
        </div>

        {confirming && (
          <div className="mismatch-warning" role="group" aria-labelledby="mismatch-warning-heading">
            <h2 id="mismatch-warning-heading">Starting a new path clears this device</h2>
            <p>
              This device stops opening {learner.nickname}&apos;s saved course. The saved work stays on KidyCode, but it can
              only be reopened with a transfer code, or by a grown-up who is connected to it.
            </p>
            {rescue ? (
              <div className="mismatch-rescue">
                <p className="transfer-code-label">Write this transfer code down first</p>
                <p className="transfer-code-value" data-testid="mismatch-rescue-code">{rescue.code}</p>
                <p className="transfer-code-expiry">It expires in about {minutesLeft(rescue.expiresAt)} minutes and works once. Enter it at /transfer on any device.</p>
              </div>
            ) : (
              <p className="mismatch-safety">
                {canRecover
                  ? "You can still get back in: there is a way to reopen this course from another device."
                  : "There is no transfer code and no grown-up connected, so this profile cannot be reopened after you clear it. Create a transfer code first if you want to keep it."}
              </p>
            )}
            {!rescue && (
              <button className="outline-button" type="button" disabled={rescueBusy} onClick={() => void createRescueCode()} data-testid="reset-create-code">
                {rescueBusy ? "Creating..." : "Create a transfer code first"}
              </button>
            )}
            <div className="mismatch-confirm-actions">
              <button className="primary-button" type="button" disabled={deleting} onClick={() => void resetProfile()} data-testid="reset-confirm">
                {deleting ? "Resetting..." : `Yes, clear this device and start ${requestedCourse.courseFacts.ageRange}`}
              </button>
              <button className="text-button" type="button" disabled={deleting} onClick={() => setConfirming(false)}>Keep my saved course</button>
            </div>
          </div>
        )}

        {message && <p className="form-message is-error" role="alert">{message}</p>}
      </section>
    </main>
  );
}

function Onboarding({ course, onCreated }: { course: CourseBundle; onCreated: (session: Session) => void }) {
  const { courseFacts, projectChoices } = course;
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState(courseFacts.ages[0]);
  const [project, setProject] = useState<ProjectId>(projectChoices[0].id);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const preview = useMemo(() => buildPreview(fillProjectTokens({
    html: "<header><h1>{{TITLE}}</h1></header><main><p>{{INTRO}}</p><section class=\"cards\"><article class=\"card\">{{ITEM1}}</article><article class=\"card\">{{ITEM2}}</article><article class=\"card\">{{ITEM3}}</article></section></main>",
    css: "body { margin: 0; padding: 1.5rem; background: #f7f3ea; color: #111936; } h1 { color: #4b1f63; } .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; } .card { padding: .8rem; border: 2px solid #111936; } @media (max-width: 650px) { .cards { grid-template-columns: 1fr; } }",
    javascript: "document.querySelector(\"h1\").addEventListener(\"click\", function () { this.textContent = \"You ran JavaScript\"; });",
  }, project, projectChoices)), [project, projectChoices]);

  async function createLearner(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/learners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname, age, theme: project, courseId: courseFacts.id }),
      });
      const data = await response.json() as Session & { error?: string };
      if (!response.ok || !data.learner) throw new Error(data.error || "The learner profile could not be created.");
      onCreated(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The learner profile could not be created.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-page coding-onboarding">
      <a className="course-brand" href="/"><span>K</span><b>KidyCode</b></a>
      <section className="onboarding-copy">
        <p className="kicker">{courseFacts.ageRange.toUpperCase()}</p>
        <h1>Write real code from the first lesson.</h1>
        <p>Learn HTML, CSS and JavaScript in a real editor. Every lesson gives you clear notes, a worked example, a coding task and automatic checks.</p>
        <div className="course-facts"><span><b>{courseFacts.stageCount}</b> modules</span><span><b>{courseFacts.lessonCount}</b> activities</span><span><b>1</b> complete website</span></div>
        <div className="website-preview"><div><small>WHAT YOU WILL BUILD</small><h2>{projectChoices.find((choice) => choice.id === project)?.title}</h2><p>Click the heading inside the preview to test its JavaScript.</p></div><iframe title="Finished website example" sandbox="allow-scripts" srcDoc={preview} /></div>
      </section>
      <form className="onboarding-form" onSubmit={createLearner}>
        <div><p className="kicker">START WITH HTML</p><h2>Set up your course.</h2><p>Use a nickname. Do not enter a full name, school or location.</p></div>
        <label>Nickname<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={20} required placeholder="SkyCoder" /></label>
        {courseFacts.ages.length > 1 && <fieldset><legend>Age</legend><div className="age-options">{courseFacts.ages.map((value) => <label key={value}><input type="radio" name="age" checked={age === value} onChange={() => setAge(value)} /><span>{value}</span></label>)}</div></fieldset>}
        <fieldset className="theme-options"><legend>Choose the website you will build</legend>{projectChoices.map((option) => <label key={option.id}><input type="radio" name="project" checked={project === option.id} onChange={() => setProject(option.id)} /><span><b>{option.title}</b><small>{option.pitch}</small></span></label>)}</fieldset>
        {message && <p className="form-message is-error" role="alert">{message}</p>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "Preparing the editor..." : "Start the first HTML lesson"}</button>
        <p className="privacy-note">The profile stores only a nickname, age group, course path and project choice.</p>
      </form>
    </main>
  );
}
