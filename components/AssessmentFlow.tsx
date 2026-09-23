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
  revision: Array<{ concept: string; label: string; lessonId: string; mandatory: string | null }>;
  defenceRequired: boolean;
};
type ReferenceSheet = { rules: string[]; sections: Array<{ id: string; title: string; note: string; lines: string[] }> };

const OUTCOME_LABELS: Record<string, string> = {
  passed: "Passed",
  not_passed_yet: "Not passed yet",
  needs_verification: "Needs verification",
};

type Screen = "choose" | "overview" | "knowledge" | "practical" | "review" | "reference" | "result";

export default function AssessmentFlow({
  course,
  completedActivityIds,
  onExit,
}: {
  course: CourseBundle;
  completedActivityIds: string[];
  onExit: () => void;
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
  }, [screen, questionIndex, taskIndex]);

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
      return;
    }
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