"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CodeFile, WorkspaceFiles } from "@/lib/course";
import {
  guidanceModes,
  stageLead,
  type GuidanceMode,
  type LessonScript,
} from "@/lib/lesson-scripts";
import { appendPreviewError, evaluateMasteryChecks, masteryEditorFiles, masteryResultSummary, visibleRequirements } from "@/lib/lesson-journey";
import { buildPreview } from "@/lib/preview";

/*
 * The V3 lesson journey presenter. One reusable set of surfaces renders the six
 * moments for any lesson that has a LessonScript. The presenter owns framing and
 * the fresh mastery task only. The lesson's own objective, task, hints, tests and
 * question stay on the Lesson and are rendered by the surrounding interface.
 */

export type LessonStep = "notes" | "practice" | "check";
export type JourneyCheckResult = { label: string; passed: boolean };

const momentLabels: Record<string, string> = {
  hook: "See the problem",
  model: "Read the example",
  build: "Build it",
  check: "Check it",
  explain: "Prove it",
  transfer: "Use it",
};

const momentsForStep: Record<LessonStep, string[]> = {
  notes: ["hook", "model"],
  practice: ["build", "check"],
  check: ["explain", "transfer"],
};

const modeCopy: Record<GuidanceMode, string> = {
  guided: "Short steps, example open, hints sooner.",
  balanced: "The example is there when you ask for it.",
  independent: "The problem first, the example hidden until you choose.",
};

export function JourneyRail({ script, step }: { script: LessonScript; step: LessonStep }) {
  const active = momentsForStep[step];
  const order = ["hook", "model", "build", "check", "explain", "transfer"];
  const activeIndex = order.findIndex((moment) => active.includes(moment));
  return (
    <ol className="journey-rail" aria-label="Lesson journey">
      {order.map((moment, index) => (
        <li
          key={moment}
          className={`${active.includes(moment) ? "is-current" : ""}${index < activeIndex ? " is-past" : ""}`}
          aria-current={active.includes(moment) ? "step" : undefined}
        >
          <span>{index + 1}</span>
          <b>{momentLabels[moment]}</b>
        </li>
      ))}
      <li className="journey-rail-note">Concept: {script.concept}</li>
    </ol>
  );
}

export function GuidanceControl({
  mode,
  onChange,
}: {
  mode: GuidanceMode;
  onChange: (mode: GuidanceMode) => void;
}) {
  return (
    <fieldset className="journey-guidance">
      <legend>How much support do you want?</legend>
      <div>
        {guidanceModes.map((option) => (
          <label key={option} className={mode === option ? "is-selected" : ""}>
            <input
              type="radio"
              name="guidance-mode"
              value={option}
              checked={mode === option}
              onChange={() => onChange(option)}
            />
            <span>
              <b>{option}</b>
              <small>{modeCopy[option]}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function JourneyNotes({ script, mode }: { script: LessonScript; mode: GuidanceMode }) {
  const hook = stageLead(script, "hook", mode);
  const model = stageLead(script, "model", mode);
  return (
    <section className="journey-card journey-hook" aria-labelledby="journey-hook-heading">
      <p className="section-label">START HERE</p>
      <h2 id="journey-hook-heading">{script.concept}</h2>
      <p>{hook}</p>
      <div className="journey-two-up">
        <div>
          <h3>What you will make</h3>
          <p>{script.make}</p>
        </div>
        <div>
          <h3>How the example helps</h3>
          <p>{model}</p>
        </div>
      </div>
      <p className="journey-project-step"><b>Your website:</b> {script.projectStep}</p>
      <p className="journey-links">Read the reasoning again in the <a href="/notes">Notes Library</a>, or work on your own in the <a href="/practice">Practice Lab</a>. Both stay separate from this lesson.</p>
    </section>
  );
}

export function JourneyPractice({
  script,
  mode,
  requirements,
  results,
  codePassed,
}: {
  script: LessonScript;
  mode: GuidanceMode;
  requirements: string[];
  results: JourneyCheckResult[];
  codePassed: boolean;
}) {
  const build = stageLead(script, "build", mode);
  const check = stageLead(script, "check", mode);
  const transfer = stageLead(script, "transfer", mode);
  const nextRequirements = visibleRequirements(requirements, results, mode);
  return (
    <section className="journey-card journey-practice" aria-labelledby="journey-practice-heading">
      <p className="section-label">BUILD AND CHECK</p>
      <h2 id="journey-practice-heading">Work in the code, one change at a time</h2>
      <p>{build}</p>
      <div className="journey-requirements">
        <h3>{mode === "guided" ? "Your next requirement" : "What the code must do"}</h3>
        <ul>
          {nextRequirements.map((requirement) => {
            const result = results.find((item) => item.label === requirement);
            return (
              <li key={requirement} className={result ? (result.passed ? "is-pass" : "is-fail") : ""}>
                <span>{result ? (result.passed ? "Done" : "Not yet") : "To do"}</span>
                {requirement}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="journey-check-lead"><b>{codePassed ? "Now verify the idea:" : "Then check the idea:"}</b> {check}</p>
      <p className="journey-transfer-lead"><b>Carry it forward:</b> {transfer}</p>
      <p className="journey-links">Want extra practice? Open the <a href="/practice">Practice Lab</a>. The <a href="/notes">Notes Library</a> holds the explanations without the task.</p>
    </section>
  );
}

export function JourneyMastery({
  script,
  reflection,
  setReflection,
  onPassedChange,
}: {
  script: LessonScript;
  reflection: string;
  setReflection: (value: string) => void;
  onPassedChange: (passed: boolean) => void;
}) {
  const mastery = script.mastery;
  const [workspace, setWorkspace] = useState<WorkspaceFiles>(mastery.starterFiles);
  const [activeFile, setActiveFile] = useState<CodeFile>(() => masteryEditorFiles(mastery.editableFiles)[0]);
  const [results, setResults] = useState<JourneyCheckResult[]>([]);
  const [checked, setChecked] = useState(false);
  const [preview, setPreview] = useState(() => buildPreview(mastery.starterFiles));
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reflectionId = `mastery-reflection-${script.lessonId}`;

  /* CodingActivity is keyed by lesson id, so this component remounts for a new
   * lesson and the initial state above is already the fresh starter. */

  useEffect(() => {
    function receivePreviewMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { source?: string; kind?: string; value?: string } | null;
      if (!data || data.source !== "kidycode-preview" || data.kind !== "error" || !data.value) return;
      setPreviewErrors((current) => appendPreviewError(current, data.value!));
    }
    window.addEventListener("message", receivePreviewMessage);
    return () => window.removeEventListener("message", receivePreviewMessage);
  }, []);

  const passed = checked && results.length > 0 && results.every((result) => result.passed);
  const activeFiles = masteryEditorFiles(mastery.editableFiles);

  function updateFile(value: string) {
    setWorkspace((current) => ({ ...current, [activeFile]: value }));
    setChecked(false);
    setResults([]);
    onPassedChange(false);
  }

  function checkTask() {
    const next = evaluateMasteryChecks(mastery.checks, workspace);
    setResults(next);
    setChecked(true);
    onPassedChange(next.every((result) => result.passed));
  }

  function runTask() {
    setPreviewErrors([]);
    setPreview(buildPreview(workspace));
  }

  function startAgain() {
    setWorkspace(mastery.starterFiles);
    setResults([]);
    setChecked(false);
    setPreview(buildPreview(mastery.starterFiles));
    setPreviewErrors([]);
    onPassedChange(false);
  }

  const files = useMemo(() => activeFiles, [activeFiles]);

  return (
    <section className="journey-card mastery-task" aria-labelledby="mastery-heading">
      <p className="section-label">PROVE IT ON A FRESH TASK</p>
      <h2 id="mastery-heading">{mastery.freshTask}</h2>
      <p className="mastery-observable"><b>What to watch for:</b> {mastery.observable}</p>
      <div className="mastery-studio">
        <div className="mastery-editor">
          {files.length > 1 && (
            <div className="file-tabs" role="tablist" aria-label="Fresh task files">
              {files.map((file) => (
                <button key={file} type="button" role="tab" aria-selected={activeFile === file} className={activeFile === file ? "is-active" : ""} onClick={() => setActiveFile(file)}>{file.toUpperCase()}</button>
              ))}
            </div>
          )}
          <textarea
            aria-label={`${activeFile} fresh task editor`}
            spellCheck={false}
            value={workspace[activeFile]}
            onChange={(event) => updateFile(event.target.value)}
          />
          <div className="mastery-actions">
            <button className="outline-button" type="button" onClick={runTask}>Run fresh task</button>
            <button className="primary-button" type="button" onClick={checkTask}>Check fresh task</button>
            <button className="text-button" type="button" onClick={startAgain}>Start again</button>
          </div>
        </div>
        <div className="mastery-preview">
          <div><b>Fresh task preview</b><span>Runs in the same safe sandbox</span></div>
          <iframe ref={iframeRef} title="Fresh task preview" sandbox="allow-scripts" srcDoc={preview} />
          {previewErrors.length > 0 && <div className="preview-runtime" role="alert"><b>Your code reported a problem</b>{previewErrors.map((error) => <code key={error}>{error}</code>)}</div>}
        </div>
      </div>
      {checked && (
        <div className="mastery-results" aria-live="polite">
          <b>{masteryResultSummary(checked, results)}</b>
          <ul>
            {results.map((result) => (
              <li key={result.label} className={result.passed ? "is-pass" : "is-fail"}><span>{result.passed ? "Done" : "Not yet"}</span>{result.label}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mastery-reflection">
        <label htmlFor={reflectionId}><b>What did you change, and what did you see happen?</b><span>{mastery.reflection}</span></label>
        <textarea
          id={reflectionId}
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="I changed... and the page showed..."
        />
        <small>{passed ? "A clear sentence is required to complete the lesson." : "Write this after the fresh task passes. Your sentence is saved with the lesson."}</small>
      </div>
    </section>
  );
}

/** A single entry point used by CodingActivity for a scripted lesson. */
export function LessonJourney({
  script,
  step,
  mode,
  onModeChange,
  requirements,
  results,
  codePassed,
  reflection,
  setReflection,
  onPassedChange,
}: {
  script: LessonScript;
  step: LessonStep;
  mode: GuidanceMode;
  onModeChange: (mode: GuidanceMode) => void;
  requirements: string[];
  results: JourneyCheckResult[];
  codePassed: boolean;
  reflection: string;
  setReflection: (value: string) => void;
  onPassedChange: (passed: boolean) => void;
}) {
  return (
    <div className="lesson-journey" data-mode={mode}>
      <JourneyRail script={script} step={step} />
      {step === "notes" && <GuidanceControl mode={mode} onChange={onModeChange} />}
      {step === "notes" && <JourneyNotes script={script} mode={mode} />}
      {step === "practice" && (
        <JourneyPractice script={script} mode={mode} requirements={requirements} results={results} codePassed={codePassed} />
      )}
      {step === "check" && (
        <JourneyMastery script={script} reflection={reflection} setReflection={setReflection} onPassedChange={onPassedChange} />
      )}
    </div>
  );
}
