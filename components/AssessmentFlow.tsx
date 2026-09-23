"use client";

/*
 * The learner's assessment flow.
 *
 * One screen has one job: choose, read the rules, answer one question, do one practical
 * task, review, or read the result. Nothing is timed, everything autosaves, and every
 * screen states what is happening in words as well as colour.
 *
 * The client never sends a mark, a pass status, a course identity or a form. It sends the
 * answers, the code and coarse signal counts, and the server decides everything else.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CourseBundle } from "@/lib/course";

type ClientRequirement = { id: string; label: string; marks: number; mandatory: string | null };
type ClientTask = {
  itemId: string;
  title: string;
  brief: string;
  marks: number;
  editableFiles: string[];
  starterFiles: Record<string, string>;
  requirements: ClientRequirement[];
};
type ClientAssessment = {
  attemptId: string;
  courseId: string;
  kind: "module" | "final";
  moduleId: string | null;
  moduleTitle: string;
  variant: string;
  stage: string;
  status: string;
  savedAt: string | null;
  rules: string[];
  knowledge: Array<{ itemId: string; prompt: string; options: string[] }>;
  practical: ClientTask | null;
  debug: ClientTask[];
  build: ClientTask | null;
};
type ResultPayload = {
  attempt: {
    id: string;
    kind: string;
    moduleId: string | null;
    moduleTitle: string;
    outcome: string;
    mark: { awarded: number; available: number };
    knowledge: { awarded: number; available: number };
    practical: { awarded: number; available: number };
    debug: { awarded: number; available: number };
    build: { awarded: number; available: number };
    mandatoryPassed: boolean;
    needsVerification: boolean;
    reasons: string[];
    nextStep: string;
    attemptCount: number;
  };
  corrections: Array<{ itemId: string; correct: boolean; correctAnswer: number | null; explanation: string; chosen: number | null; misconception: string | null }>;
  requirements: Record<string, Array<{ label: string; status: string; awarded: number; available: number; mandatory: string | null; detail: string }>>;
  secure: Array<{ concept: string; label: string; lessonId: string }>;
  revision: Array<{ concept: string; label: string; lessonId: string; mandatory: string | null }>;
  firstAction: { concept: string; label: string; lessonId: string } | null;
  defenceRequired: boolean;
};
type RevisionPackView = {
  concept: string;
  title: string;
  meaning: string;
  whyItMatters: string;
  workedExample: string;
  commonMistake: string;
  independent: string;
  hints: string[];
  lessonId: string;
  guided: Array<{ prompt: string; options: string[] }>;
  readiness: Array<{ prompt: string; options: string[] }>;
  readinessPassedAt: string | null;
};
type GradedQuestion = { index: number; correct: boolean; correctAnswer: number; explanation: string };
type DefenceView = {
  attemptId: string;
  templateId: string;
  escalated: boolean;
  explain: { prompt: string; snippet: string };
  predict: { prompt: string; snippet: string; options: string[] };
  change: { prompt: string; instruction: string; snippet: string };
  status: string;
  predictChoice: number | null;
  changeSaved: boolean;
  explainResponse: string;
  reason?: string;
  nextStep?: string;
};
type DefenceDecisionView = {
  status: string;
  predictCorrect: boolean;
  changeStatus: string;
  reason: string;
  nextStep: string;
  changeDetail?: string;
};
type ReferenceSheet = { rules: string[]; sections: Array<{ id: string; title: string; note: string; lines: string[] }> };

const OUTCOME_LABELS: Record<string, string> = {
  passed: "Passed",
  not_passed_yet: "Not passed yet",
  needs_verification: "Needs verification",
};

type Screen = "choose" | "overview" | "knowledge" | "practical" | "review" | "reference" | "result" | "revision" | "defence";

/* The steps of the independent-understanding check, in the order a learner meets them. */
const DEFENCE_STEPS = [
  "Introduction",
  "Explain your work",
  "Predict what the code does",
  "Make the change",
  "Check before submitting",
  "Your result",
];

export default function AssessmentFlow({
  course,
  completedActivityIds,
  onExit,
  onOpenLesson,
}: {
  course: CourseBundle;
  completedActivityIds: string[];
  onExit: () => void;
  onOpenLesson?: (lessonId: string) => void;
}) {
  const [screen, setScreen] = useState<Screen>("choose");
  const [attempt, setAttempt] = useState<ClientAssessment | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [code, setCode] = useState<Record<string, Record<string, string>>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<ReferenceSheet | null>(null);
  const [pack, setPack] = useState<RevisionPackView | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<number[]>([]);
  const [practiceResult, setPracticeResult] = useState<GradedQuestion[] | null>(null);
  const [readinessAnswers, setReadinessAnswers] = useState<number[]>([]);
  const [readinessResult, setReadinessResult] = useState<GradedQuestion[] | null>(null);
  const [readyAt, setReadyAt] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [pending, setPending] = useState<Array<{ concept: string; label: string }>>([]);
  const [defence, setDefence] = useState<DefenceView | null>(null);
  const [defenceStep, setDefenceStep] = useState(1);
  const [explain, setExplain] = useState("");
  const [predictChoice, setPredictChoice] = useState<number | null>(null);
  const [changeCode, setChangeCode] = useState<{ html: string; css: string; javascript: string }>({ html: "", css: "", javascript: "" });
  const [decision, setDecision] = useState<DefenceDecisionView | null>(null);
  const [defenceSave, setDefenceSave] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const signals = useRef({ visibilityChanges: 0, pasteEvents: 0, largestPasteChars: 0 });
  const completed = useMemo(() => new Set(completedActivityIds), [completedActivityIds]);

  const modules = useMemo(
    () => course.stages.map((stage) => ({
      id: stage.id,
      number: stage.number,
      title: stage.title,
      ready: stage.lessons.every((lesson) => completed.has(lesson.id)),
      done: stage.lessons.filter((lesson) => completed.has(lesson.id)).length,
      total: stage.lessons.length,
    })),
    [course.stages, completed],
  );
  const courseReady = course.lessons.every((lesson) => completed.has(lesson.id));

  /* Move the focus to the heading of each screen, so a keyboard or screen reader user is
   * told where they have arrived rather than being left at the bottom of the last screen. */
  useEffect(() => {
    headingRef.current?.focus();
  }, [screen, questionIndex, taskIndex, defenceStep]);

  /* Coarse integrity signals, disclosed before the work starts. Counts only: no clipboard
   * contents, no keystrokes, and nothing here can change a mark. */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") signals.current.visibilityChanges += 1;
    };
    const onPaste = (event: ClipboardEvent) => {
      signals.current.pasteEvents += 1;
      const text = event.clipboardData?.getData("text") ?? "";
      signals.current.largestPasteChars = Math.max(signals.current.largestPasteChars, text.length);
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("paste", onPaste);
    };
  }, []);

  const post = useCallback(async (path: string, body: unknown) => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, body: data } as { status: number; body: Record<string, unknown> };
  }, []);

  const start = useCallback(async (kind: "module" | "final", moduleId?: string) => {
    setBusy(true);
    setMessage("");
    const response = await post("/api/assessment/start", { kind, moduleId });
    setBusy(false);
    if (response.status !== 200) {
      setMessage(typeof response.body.error === "string" ? response.body.error : "That assessment could not be opened.");
      const listed = response.body.revision;
      setPending(Array.isArray(listed)
        ? (listed as Array<{ concept: string; label: string }>).filter((entry) => entry && typeof entry.concept === "string")
        : []);
      return;
    }
    setPending([]);
    const next = response.body.attempt as ClientAssessment;
    const draft = (response.body.draft || {}) as { answers?: number[]; code?: Record<string, Record<string, string>> };
    setAttempt(next);
    setAnswers(next.knowledge.map((_, index) => (typeof draft.answers?.[index] === "number" ? draft.answers[index] : -1)));
    setCode(draft.code && Object.keys(draft.code).length > 0 ? draft.code : starterCode(next));
    setQuestionIndex(0);
    setTaskIndex(0);
    setResult(null);
    setSaveState(response.body.resumed ? "saved" : "idle");
    setScreen("overview");
  }, [post]);

  const save = useCallback(async (nextScreen: Screen) => {
    if (!attempt) return;
    setSaveState("saving");
    const response = await post("/api/assessment/autosave", {
      attemptId: attempt.attemptId,
      answers,
      code,
      stage: nextScreen === "review" ? "review" : nextScreen === "knowledge" ? "knowledge" : "practical",
      ...signals.current,
    });
    signals.current.visibilityChanges = 0;
    signals.current.pasteEvents = 0;
    signals.current.largestPasteChars = 0;
    setSaveState(response.status === 200 && response.body.saved === true ? "saved" : "failed");
  }, [attempt, answers, code, post]);

  const submit = useCallback(async () => {
    if (!attempt || busy) return;
    setBusy(true);
    setMessage("");
    const response = await post("/api/assessment/submit", { attemptId: attempt.attemptId, answers, code, ...signals.current });
    setBusy(false);
    if (response.status !== 200) {
      setMessage(typeof response.body.error === "string" ? response.body.error : "That submission could not be saved. Your work is still on screen.");
      return;
    }
    setResult(response.body as unknown as ResultPayload);
    setSaveState("idle");
    setScreen("result");
  }, [attempt, answers, busy, code, post]);

  const openReference = useCallback(async () => {
    if (reference) {
      setScreen("reference");
      return;
    }
    const response = await fetch("/api/assessment/reference");
    const data = await response.json().catch(() => null);
    if (data) setReference(data as ReferenceSheet);
    setScreen("reference");
  }, [reference]);

  /* Open one revision page. The page arrives without answers, so the learner answers and
   * the server marks: nothing on the page can be scraped for a correct option. */
  const openRevision = useCallback(async (concept: string) => {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/assessment/revision?concept=${encodeURIComponent(concept)}`);
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!data || !data.pack) {
      setMessage("That revision page could not be opened.");
      return;
    }
    const opened = data.pack as RevisionPackView;
    setPack(opened);
    setReadyAt(opened.readinessPassedAt);
    setPracticeAnswers([]);
    setPracticeResult(null);
    setReadinessAnswers([]);
    setReadinessResult(null);
    setHintLevel(0);
    setScreen("revision");
  }, []);

  const gradeRevision = useCallback(async (kind: "practice" | "readiness") => {
    if (!pack || busy) return;
    setBusy(true);
    setMessage("");
    const answers = kind === "practice" ? practiceAnswers : readinessAnswers;
    const response = await post("/api/assessment/revision", { concept: pack.concept, kind, answers });
    setBusy(false);
    if (response.status !== 200) {
      setMessage("Those answers could not be checked. Try again in a moment.");
      return;
    }
    const graded = (kind === "practice" ? response.body.practice : response.body.readiness) as GradedQuestion[];
    if (kind === "practice") {
      setPracticeResult(graded);
      return;
    }
    setReadinessResult(graded);
    if (response.body.passed === true) setReadyAt(String(response.body.readinessPassedAt ?? "ready"));
  }, [busy, pack, post, practiceAnswers, readinessAnswers]);

  /* The code defence. Nothing here decides anything: the learner's own words and choices are
   * saved as evidence, and the server decides when they submit. Resume is exact, because the
   * saved draft says which step was reached. */
  const openDefence = useCallback(async (attemptId: string) => {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/assessment/defence?attemptId=${encodeURIComponent(attemptId)}`);
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!data || !data.defence) {
      setMessage("The code defence could not be opened. Try again in a moment.");
      return;
    }
    const view = data.defence as DefenceView;
    setDefence(view);
    setExplain(view.explainResponse || "");
    setPredictChoice(view.predictChoice);
    setChangeCode({ html: "", css: "", javascript: "" });
    setDefenceSave("idle");
    if (["passed", "not_passed", "needs-verification"].includes(view.status)) {
      setDecision({
        status: view.status,
        predictCorrect: false,
        changeStatus: "",
        reason: view.reason || "",
        nextStep: view.nextStep || "",
      });
      setDefenceStep(6);
    } else if (view.explainResponse && view.predictChoice !== null) {
      setDefenceStep(view.changeSaved ? 5 : 4);
    } else if (view.explainResponse) {
      setDefenceStep(3);
    } else {
      setDefenceStep(1);
    }
    setScreen("defence");
  }, []);

  const saveDefenceDraft = useCallback(async () => {
    if (!defence) return;
    setDefenceSave("saving");
    const response = await post("/api/assessment/defence", {
      attemptId: defence.attemptId,
      mode: "draft",
      explain,
      predictChoice,
      changeCode,
    });
    setDefenceSave(response.status === 200 && response.body.draft === true ? "saved" : "failed");
  }, [changeCode, defence, explain, post, predictChoice]);

  const submitDefence = useCallback(async () => {
    if (!defence || busy) return;
    setBusy(true);
    setMessage("");
    const response = await post("/api/assessment/defence", {
      attemptId: defence.attemptId,
      mode: "submit",
      explain,
      predictChoice,
      changeCode,
    });
    setBusy(false);
    if (response.status !== 200 || !response.body.decision) {
      setMessage(typeof response.body.error === "string" ? response.body.error : "That defence could not be submitted. Your work is still on screen.");
      return;
    }
    setDecision(response.body.decision as unknown as DefenceDecisionView);
    setDefenceStep(6);
  }, [busy, changeCode, defence, explain, post, predictChoice]);

  if (screen === "choose") {
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>Choose an assessment</h1>
        <p className="assessment-lede">
          Each module has its own check, and the whole course has a final applied assessment. Your
          assessment is not timed, it saves as you work, and you can come back to it later.
        </p>
        {message && <p className="form-message is-error" role="alert">{message}</p>}
        <section className="assessment-choice-list" aria-label="Module checks">
          {modules.map((module) => (
            <article key={module.id} className="assessment-choice">
              <h2>Module {module.number}: {module.title}</h2>
              <p>{module.ready ? `All ${module.total} activities complete. The check is open.` : `${module.done} of ${module.total} activities complete. Finish the module first.`}</p>
              <button
                className="primary-button"
                type="button"
                disabled={!module.ready || busy}
                onClick={() => void start("module", module.id)}
              >
                Take the Module {module.number} check
              </button>
            </article>
          ))}
        </section>
        <section className="assessment-choice" aria-label="Final assessment">
          <h2>Final applied assessment</h2>
          <p>{courseReady ? "Every activity is complete. The final assessment is open." : "Complete every activity in the course first."}</p>
          <button className="primary-button" type="button" disabled={!courseReady || busy} onClick={() => void start("final")}>
            Start the final assessment
          </button>
        </section>
        <button className="text-button" type="button" onClick={onExit}>Return to the course</button>
      </main>
    );
  }

  if (screen === "reference") {
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>Reference sheet</h1>
        <p className="assessment-lede">General syntax only. Nothing here is the answer to a question or a task.</p>
        {reference?.rules.map((rule) => <p key={rule} className="assessment-rule">{rule}</p>)}
        <div className="reference-sections">
          {(reference?.sections ?? []).map((section) => (
            <section key={section.id} className="reference-section">
              <h2>{section.title}</h2>
              <p>{section.note}</p>
              <pre><code>{section.lines.join("\n")}</code></pre>
            </section>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={() => setScreen(attempt ? "knowledge" : "choose")}>
          Back to the assessment
        </button>
      </main>
    );
  }

  if (screen === "revision" && pack) {
    const hintsShown = pack.hints.slice(0, hintLevel);
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>{pack.title}</h1>
        {readyAt && <p className="assessment-outcome is-passed">This concept is marked ready.</p>}

        <section aria-label="What this means">
          <h2>What it means</h2>
          <p>{pack.meaning}</p>
        </section>
        <section aria-label="Why it matters">
          <h2>Why it matters in your project</h2>
          <p>{pack.whyItMatters}</p>
        </section>
        <section aria-label="Worked example">
          <h2>A worked example</h2>
          <pre>{pack.workedExample}</pre>
        </section>
        <section aria-label="Common mistake">
          <h2>A common mistake</h2>
          <p>{pack.commonMistake}</p>
        </section>

        <section aria-label="Hints">
          <h2>Hints</h2>
          <p>Hints open one at a time. Try the task first, then take the next one.</p>
          {hintsShown.map((hint, index) => <p key={hint} className="assessment-rule">Hint {index + 1}: {hint}</p>)}
          {hintLevel < pack.hints.length && (
            <button className="primary-button" type="button" onClick={() => setHintLevel((level) => level + 1)}>
              Show hint {hintLevel + 1} of {pack.hints.length}
            </button>
          )}
        </section>

        <section aria-label="Independent practice">
          <h2>Your own practice task</h2>
          <p>{pack.independent}</p>
        </section>

        <section aria-label="Guided practice">
          <h2>Guided practice</h2>
          {pack.guided.map((question, index) => (
            <fieldset key={question.prompt} className="assessment-question">
              <legend>{question.prompt}</legend>
              {question.options.map((option, optionIndex) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`practice-${index}`}
                    checked={practiceAnswers[index] === optionIndex}
                    onChange={() => setPracticeAnswers((current) => current.map((value, at) => (at === index ? optionIndex : value)))}
                  />
                  <span>{option}</span>
                </label>
              ))}
              {practiceResult?.[index] && (
                <p className={practiceResult[index].correct ? "is-correct" : "is-wrong"}>
                  {practiceResult[index].correct ? "Correct." : "Not yet."} {practiceResult[index].explanation}
                </p>
              )}
            </fieldset>
          ))}
          <button className="primary-button" type="button" disabled={busy} onClick={() => void gradeRevision("practice")}>
            {busy ? "Checking..." : "Check my answers"}
          </button>
        </section>

        <section aria-label="Readiness check">
          <h2>Readiness check</h2>
          <p>Answer every question correctly to mark this concept ready.</p>
          {pack.readiness.map((question, index) => (
            <fieldset key={question.prompt} className="assessment-question">
              <legend>{question.prompt}</legend>
              {question.options.map((option, optionIndex) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`readiness-${index}`}
                    checked={readinessAnswers[index] === optionIndex}
                    onChange={() => setReadinessAnswers((current) => current.map((value, at) => (at === index ? optionIndex : value)))}
                  />
                  <span>{option}</span>
                </label>
              ))}
              {readinessResult?.[index] && (
                <p className={readinessResult[index].correct ? "is-correct" : "is-wrong"}>
                  {readinessResult[index].correct ? "Correct." : "Not yet."} {readinessResult[index].explanation}
                </p>
              )}
            </fieldset>
          ))}
          <button className="primary-button" type="button" disabled={busy} onClick={() => void gradeRevision("readiness")}>
            {busy ? "Checking..." : "Check readiness"}
          </button>
        </section>

        {message && <p className="form-message is-error" role="alert">{message}</p>}

        <button className="primary-button" type="button" disabled={busy} onClick={() => {
          setAttempt(null);
          setResult(null);
          void start(attempt?.kind ?? "module", attempt?.moduleId ?? undefined);
        }}>
          Start a fresh assessment
        </button>
        {pack.lessonId && onOpenLesson && (
          <button className="text-button" type="button" onClick={() => onOpenLesson(pack.lessonId)}>
            Revisit the full lesson
          </button>
        )}
        <button className="text-button" type="button" onClick={() => setScreen("choose")}>Back to the assessments</button>
        <button className="text-button" type="button" onClick={onExit}>Return to the course</button>
      </main>
    );
  }

  if (screen === "defence" && defence) {
    const stepName = DEFENCE_STEPS[defenceStep - 1];
    const words = explain.trim().split(/\s+/).filter((word) => word.length > 0).length;
    const saveLabel = defenceSave === "saving"
      ? "Saving your work..."
      : defenceSave === "saved"
        ? "Your defence is saved."
        : defenceSave === "failed"
          ? "Your defence is on screen but not saved yet. Keep this page open and try again."
          : "Nothing saved yet.";

    const advance = (next: number) => {
      void saveDefenceDraft();
      setDefenceStep(next);
    };

    return (
      <main className="assessment-page">
        <p className="assessment-progress">Step {defenceStep} of {DEFENCE_STEPS.length}: {stepName}</p>
        <ol className="assessment-review">
          {DEFENCE_STEPS.map((step, index) => (
            <li key={step}>{step}{index + 1 === defenceStep ? " (you are here)" : index + 1 < defenceStep ? " (done)" : ""}</li>
          ))}
        </ol>

        {defenceStep === 1 && (
          <>
            <h1 ref={headingRef} tabIndex={-1}>The code defence</h1>
            <p className="assessment-lede">
              This is the last part of your final assessment. It shows that the project is your own work.
            </p>
            <ul className="assessment-rules">
              <li>You explain one decision in your own words.</li>
              <li>You predict what a small piece of code does.</li>
              <li>You make one small change to your own project, and the server checks it.</li>
              {defence.escalated && <li>One extra prediction has been added, because your saved work changed while you were working.</li>}
              <li>Your writing is kept as evidence. It is not marked by a machine that guesses at words.</li>
              <li>Complete this assessment independently, without AI-generated answers. You may use the built-in reference sheet.</li>
              <li>KidyCode does not use camera or microphone monitoring, and it does not use an AI-content detector.</li>
              <li>Leaving the tab or pasting text is counted only so the right task can be chosen. It never lowers a mark and never fails you.</li>
              <li>If the change cannot be checked automatically, your result becomes Needs verification, and a person looks at it with you.</li>
            </ul>
            <p className="assessment-save" role="status">{saveLabel}</p>
            <button className="primary-button" type="button" disabled={busy} onClick={() => advance(2)}>Start the explain task</button>
            <button className="text-button" type="button" onClick={onExit}>Finish later and return to the course</button>
          </>
        )}

        {defenceStep === 2 && (
          <>
            <h1 ref={headingRef} tabIndex={-1}>Explain one decision</h1>
            <p className="assessment-brief">{defence.explain.prompt}</p>
            {defence.explain.snippet && <pre>{defence.explain.snippet}</pre>}
            <div className="assessment-editor">
              <label htmlFor="defence-explain">Your answer, in your own words</label>
              <textarea
                id="defence-explain"
                value={explain}
                onChange={(event) => setExplain(event.target.value)}
                onBlur={() => void saveDefenceDraft()}
              />
            </div>
            <p className="assessment-save" role="status">{words} words. {saveLabel}</p>
            <div className="assessment-actions">
              <button className="primary-button" type="button" disabled={busy || defenceSave === "saving"} onClick={() => advance(3)}>Save and continue</button>
              <button className="primary-button" type="button" disabled={busy} onClick={() => setDefenceStep(1)}>Back to the introduction</button>
            </div>
          </>
        )}

        {defenceStep === 3 && (
          <>
            <h1 ref={headingRef} tabIndex={-1}>Predict what the code does</h1>
            <p className="assessment-brief">{defence.predict.prompt}</p>
            <pre>{defence.predict.snippet}</pre>
            <fieldset className="assessment-question">
              <legend>Choose the result you expect</legend>
              {defence.predict.options.map((option, index) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="defence-predict"
                    checked={predictChoice === index}
                    onChange={() => setPredictChoice(index)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
            <p className="assessment-save" role="status">{saveLabel}</p>
            <div className="assessment-actions">
              <button className="primary-button" type="button" disabled={busy || predictChoice === null || defenceSave === "saving"} onClick={() => advance(4)}>Save and continue</button>
              <button className="primary-button" type="button" disabled={busy} onClick={() => setDefenceStep(2)}>Back to the explain task</button>
            </div>
          </>
        )}

        {defenceStep === 4 && (
          <>
            <h1 ref={headingRef} tabIndex={-1}>Make the change</h1>
            <p className="assessment-brief">{defence.change.instruction}</p>
            {defence.change.snippet && <pre>{defence.change.snippet}</pre>}
            <p>Your project is loaded as the starting point. Change only what the task asks for.</p>
            {(["html", "css", "javascript"] as const).map((file) => (
              <div key={file} className="assessment-editor">
                <label htmlFor={`defence-change-${file}`}>{file === "javascript" ? "JavaScript" : file.toUpperCase()}</label>
                <textarea
                  id={`defence-change-${file}`}
                  spellCheck={false}
                  value={changeCode[file]}
                  onChange={(event) => setChangeCode((current) => ({ ...current, [file]: event.target.value }))}
                  onBlur={() => void saveDefenceDraft()}
                />
              </div>
            ))}
            <p className="assessment-save" role="status">{saveLabel}</p>
            <div className="assessment-actions">
              <button className="primary-button" type="button" disabled={busy || defenceSave === "saving"} onClick={() => advance(5)}>Save and continue</button>
              <button className="primary-button" type="button" disabled={busy} onClick={() => setDefenceStep(3)}>Back to the prediction</button>
            </div>
          </>
        )}

        {defenceStep === 5 && (
          <>
            <h1 ref={headingRef} tabIndex={-1}>Check before submitting</h1>
            <ul className="assessment-review">
              <li>{words >= 12 ? `Your explanation is ${words} words long.` : `Your explanation is only ${words} words. A few sentences are needed before it counts as evidence.`}</li>
              <li>{predictChoice === null ? "You have not chosen a prediction." : `You chose prediction ${predictChoice + 1}.`}</li>
              <li>{(changeCode.html + changeCode.css + changeCode.javascript).trim().length > 0 ? "Your change is ready to be checked." : "You have not written the change yet."}</li>
              <li>Submitting finishes the defence and decides it once, even if you press the button twice.</li>
            </ul>
            {message && <p className="form-message is-error" role="alert">{message}</p>}
            <p className="assessment-save" role="status">{saveLabel}</p>
            <button className="primary-button" type="button" disabled={busy} onClick={() => void submitDefence()}>
              {busy ? "Submitting..." : "Submit the defence"}
            </button>
            <button className="text-button" type="button" onClick={() => setDefenceStep(4)}>Back to the change</button>
          </>
        )}

        {defenceStep === 6 && decision && (
          <>
            <h1 ref={headingRef} tabIndex={-1}>
              {decision.status === "passed" ? "Passed" : decision.status === "needs-verification" ? "Needs verification" : "Not passed yet"}
            </h1>
            <p className={`assessment-outcome is-passed`} role="status">
              {decision.status === "passed" ? "Your independent-understanding check is complete." : decision.status === "needs-verification" ? "This needs a person to look at it." : "This is not passed yet."}
            </p>
            {decision.reason && <p>{decision.reason}</p>}
            {decision.changeDetail && <p>{decision.changeDetail}</p>}
            {decision.status === "needs-verification" && (
              <section aria-label="What Needs verification means">
                <h2>What Needs verification means</h2>
                <p>
                  Nothing is wrong and nothing is taken away. KidyCode could not confirm your change on its own, so a
                  grown-up or a teacher checks it with you. Your marks stay exactly as they are, and your project keeps
                  every skill it already earned.
                </p>
              </section>
            )}
            {decision.nextStep && <p className="assessment-next">{decision.nextStep}</p>}
            <button className="primary-button" type="button" onClick={() => setScreen("choose")}>Back to the assessments</button>
            <button className="text-button" type="button" onClick={onExit}>Return to the course</button>
          </>
        )}
      </main>
    );
  }

  if (screen === "result" && result) {
    const outcome = OUTCOME_LABELS[result.attempt.outcome] ?? result.attempt.outcome;
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>{outcome}</h1>
        <p className="assessment-lede">{result.attempt.moduleTitle}, attempt {result.attempt.attemptCount}.</p>
        <p className={`assessment-outcome is-${result.attempt.outcome}`}>{outcome}: {result.attempt.mark.awarded} of {result.attempt.mark.available} marks.</p>
        <section aria-label="Breakdown">
          <h2>Where the marks came from</h2>
          <ul className="assessment-breakdown">
            <li>Knowledge: {result.attempt.knowledge.awarded} of {result.attempt.knowledge.available}</li>
            {result.attempt.practical.available > 0 && <li>Practical task: {result.attempt.practical.awarded} of {result.attempt.practical.available}</li>}
            {result.attempt.debug.available > 0 && <li>Debugging: {result.attempt.debug.awarded} of {result.attempt.debug.available}</li>}
            {result.attempt.build.available > 0 && <li>Independent build: {result.attempt.build.awarded} of {result.attempt.build.available}</li>}
            <li>Mandatory safety, privacy and accessibility checks: {result.attempt.mandatoryPassed ? "passed" : "not all met"}</li>
          </ul>
        </section>
        <section aria-label="Reasons">
          {result.attempt.reasons.map((reason) => <p key={reason}>{reason}</p>)}
          {result.attempt.nextStep && <p className="assessment-next">{result.attempt.nextStep}</p>}
        </section>
        <section aria-label="Skills already secure">
          <h2>Skills you already have</h2>
          {result.secure.length === 0
            ? <p>No skill is recorded as secure from this attempt yet.</p>
            : <ul className="assessment-review">{result.secure.map((entry) => <li key={entry.concept}>{entry.label}</li>)}</ul>}
        </section>
        <section aria-label="Skills needing revision">
          <h2>Skills needing another look</h2>
          {result.revision.length === 0 ? (
            <p>Nothing needs revision from this attempt.</p>
          ) : (
            <>
              {result.firstAction && (
                <p className="assessment-next">
                  Start with: {result.firstAction.label}.
                  <button className="text-button" type="button" onClick={() => void openRevision(result.firstAction!.concept)}>
                    Open the revision page for {result.firstAction.label}
                  </button>
                </p>
              )}
              <ul className="assessment-review">
                {result.revision.map((entry) => (
                  <li key={entry.concept}>
                    {entry.label}{entry.mandatory ? ` (required: ${entry.mandatory})` : ""}{" "}
                    <button className="text-button" type="button" onClick={() => void openRevision(entry.concept)}>
                      Open the revision page
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        {pending.length > 0 && (
          <section aria-label="Before a fresh attempt">
            <h2>Before a fresh attempt</h2>
            <p>Pass the readiness check on each of these first. There is no waiting period.</p>
            <ul className="assessment-review">
              {pending.map((entry) => (
                <li key={entry.concept}>
                  {entry.label}{" "}
                  <button className="text-button" type="button" onClick={() => void openRevision(entry.concept)}>
                    Open the revision page
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {message && <p className="form-message is-error" role="alert">{message}</p>}
        {result.defenceRequired && result.attempt.outcome !== "passed" && (
          <section aria-label="Independent understanding">
            <h2>Show the work is yours</h2>
            <p>
              The final assessment also asks you to explain one decision, predict what a piece of code does and make one
              small change. It is not marked until you submit it.
            </p>
            <button className="primary-button" type="button" disabled={busy} onClick={() => void openDefence(result.attempt.id)}>
              Start the code defence
            </button>
          </section>
        )}
        <section aria-label="Your answers">
          <h2>Your answers</h2>
          {result.corrections.map((correction, index) => {
            const question = attempt?.knowledge.find((item) => item.itemId === correction.itemId);
            const correctText = question && correction.correctAnswer !== null ? question.options[correction.correctAnswer] : "";
            return (
              <article key={correction.itemId} className={correction.correct ? "is-correct" : "is-wrong"}>
                <h3>Question {index + 1}: {correction.correct ? "correct" : "not correct yet"}</h3>
                {!correction.correct && correctText && <p>The answer that fits is: {correctText}</p>}
                <p>{correction.explanation}</p>
                {correction.misconception && <p className="assessment-misconception">Common slip: {correction.misconception.replace(/-/g, " ")}.</p>}
              </article>
            );
          })}
        </section>
        <button className="primary-button" type="button" onClick={() => { setAttempt(null); setResult(null); setScreen("choose"); }}>
          Back to the assessments
        </button>
        {result.attempt.kind !== "final" && (
          <button className="primary-button" type="button" disabled={busy} onClick={() => { setMessage(""); void start("module", result.attempt.moduleId ?? undefined); }}>
            Take a fresh form for this module
          </button>
        )}
        <button className="text-button" type="button" onClick={onExit}>Return to the course</button>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>Opening your assessment</h1>
        <p role="status">{message || "Loading your assessment and your saved work."}</p>
        <button className="text-button" type="button" onClick={onExit}>Return to the course</button>
      </main>
    );
  }

  const tasks: ClientTask[] = [...(attempt.practical ? [attempt.practical] : []), ...attempt.debug, ...(attempt.build ? [attempt.build] : [])];
  const currentTask = tasks[Math.min(taskIndex, tasks.length - 1)];
  const saveLabel = saveState === "saving" ? "Saving your work..." : saveState === "saved" ? "Your work is saved." : saveState === "failed" ? "Your work is on screen but not saved yet. Keep this page open and try again." : "Nothing saved yet.";

  if (screen === "overview") {
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>{attempt.moduleTitle}</h1>
        <p className="assessment-lede">
          {attempt.kind === "module" ? "A module check: five questions and one practical task." : "The final applied assessment: knowledge, debugging and one independent build."}
        </p>
        <ul className="assessment-rules">{attempt.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        <p className="assessment-save" role="status">{saveLabel}</p>
        <button className="primary-button" type="button" onClick={() => setScreen("knowledge")}>Start the questions</button>
        <button className="text-button" type="button" onClick={() => void openReference()}>Open the reference sheet</button>
        <button className="text-button" type="button" onClick={onExit}>Finish later and return to the course</button>
      </main>
    );
  }

  if (screen === "knowledge") {
    const question = attempt.knowledge[questionIndex];
    const answered = answers.filter((answer) => answer >= 0).length;
    return (
      <main className="assessment-page">
        <p className="assessment-progress">Question {questionIndex + 1} of {attempt.knowledge.length}. {answered} answered so far.</p>
        <h1 ref={headingRef} tabIndex={-1}>{question.prompt}</h1>
        <fieldset className="assessment-question">
          <legend>Choose one answer</legend>
          {question.options.map((option, optionIndex) => (
            <label key={option}>
              <input
                type="radio"
                name={`assessment-question-${questionIndex}`}
                checked={answers[questionIndex] === optionIndex}
                onChange={() => setAnswers((current) => current.map((value, index) => (index === questionIndex ? optionIndex : value)))}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        <p className="assessment-save" role="status">{saveLabel}</p>
        <div className="assessment-actions">
          <button className="primary-button" type="button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>Previous question</button>
          {questionIndex < attempt.knowledge.length - 1 ? (
            <button className="primary-button" type="button" onClick={() => { setQuestionIndex((index) => index + 1); void save("knowledge"); }}>Next question</button>
          ) : (
            <button className="primary-button" type="button" onClick={() => { void save("practical"); setScreen("practical"); }}>Go to the practical task</button>
          )}
        </div>
        <button className="text-button" type="button" onClick={() => void openReference()}>Open the reference sheet</button>
      </main>
    );
  }

  if (screen === "practical" && currentTask) {
    return (
      <main className="assessment-page">
        <p className="assessment-progress">Task {taskIndex + 1} of {tasks.length}. {currentTask.marks} marks.</p>
        <h1 ref={headingRef} tabIndex={-1}>{currentTask.title}</h1>
        <p className="assessment-brief">{currentTask.brief}</p>
        <section aria-label="What is being marked">
          <h2>What is being marked</h2>
          <ul className="assessment-requirements">
            {currentTask.requirements.map((requirement) => (
              <li key={requirement.id}>
                {requirement.label} ({requirement.marks} {requirement.marks === 1 ? "mark" : "marks"})
                {requirement.mandatory && <b> required: {requirement.mandatory}</b>}
              </li>
            ))}
          </ul>
        </section>
        {currentTask.editableFiles.map((file) => (
          <div key={file} className="assessment-editor">
            <label htmlFor={`${currentTask.itemId}-${file}`}>{file === "javascript" ? "JavaScript" : file.toUpperCase()} file</label>
            <textarea
              id={`${currentTask.itemId}-${file}`}
              spellCheck={false}
              value={code[currentTask.itemId]?.[file] ?? ""}
              onChange={(event) => setCode((current) => ({
                ...current,
                [currentTask.itemId]: { ...(current[currentTask.itemId] ?? {}), [file]: event.target.value },
              }))}
            />
          </div>
        ))}
        <p className="assessment-save" role="status">{saveLabel}</p>
        <div className="assessment-actions">
          <button className="primary-button" type="button" disabled={taskIndex === 0} onClick={() => { setTaskIndex((index) => Math.max(0, index - 1)); void save("practical"); }}>Previous task</button>
          {taskIndex < tasks.length - 1 ? (
            <button className="primary-button" type="button" onClick={() => { setTaskIndex((index) => index + 1); void save("practical"); }}>Next task</button>
          ) : (
            <button className="primary-button" type="button" onClick={() => { void save("review"); setScreen("review"); }}>Review before submitting</button>
          )}
        </div>
        <button className="text-button" type="button" onClick={() => void openReference()}>Open the reference sheet</button>
      </main>
    );
  }

  if (screen === "review") {
    const unanswered = answers.filter((answer) => answer < 0).length;
    const emptyTasks = tasks.filter((task) => task.editableFiles.every((file) => (code[task.itemId]?.[file] ?? "").trim().length === 0));
    return (
      <main className="assessment-page">
        <h1 ref={headingRef} tabIndex={-1}>Check your work before submitting</h1>
        <ul className="assessment-review">
          <li>{unanswered === 0 ? "Every question has an answer." : `${unanswered} question${unanswered === 1 ? "" : "s"} still have no answer.`}</li>
          <li>{emptyTasks.length === 0 ? "Every task has code in it." : `${emptyTasks.length} task${emptyTasks.length === 1 ? "" : "s"} still have no code.`}</li>
          <li>Submitting finishes this attempt. Your answers are recorded once, even if you press the button twice.</li>
        </ul>
        <p className="assessment-save" role="status">{saveLabel}</p>
        {message && <p className="form-message is-error" role="alert">{message}</p>}
        <button className="primary-button" type="button" disabled={busy} onClick={() => void submit()}>
          {busy ? "Submitting..." : "Submit for marking"}
        </button>
        <button className="text-button" type="button" onClick={() => setScreen("knowledge")}>Back to the questions</button>
        <button className="text-button" type="button" onClick={() => setScreen("practical")}>Back to the tasks</button>
      </main>
    );
  }

  return (
    <main className="assessment-page">
      <h1 ref={headingRef} tabIndex={-1}>Your assessment</h1>
      <p role="status">{saveLabel}</p>
      <button className="primary-button" type="button" onClick={() => setScreen("knowledge")}>Continue the questions</button>
      <button className="text-button" type="button" onClick={onExit}>Return to the course</button>
    </main>
  );
}

function starterCode(attempt: ClientAssessment): Record<string, Record<string, string>> {
  const tasks: ClientTask[] = [...(attempt.practical ? [attempt.practical] : []), ...attempt.debug, ...(attempt.build ? [attempt.build] : [])];
  const files: Record<string, Record<string, string>> = {};
  for (const task of tasks) {
    files[task.itemId] = {};
    for (const file of task.editableFiles) files[task.itemId][file] = task.starterFiles[file] ?? "";
  }
  return files;
}