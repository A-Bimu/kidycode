"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import {
  lessons,
  projectChoices,
  type CodeFile,
  type Lesson,
  type PracticeQuestion,
  type ProjectId,
  type Stage,
  type WorkspaceFiles,
} from "@/lib/course";
import { ExamPanel } from "@/components/ExamPanel";

type CourseFacts = { title: string; ageRange: string; lessonCount: number; stageCount: number; estimatedHours: string; passMark: number };
type Session = { learner: { id: string; nickname: string; age: number; theme: string } };
type SavedProgress = { status: "started" | "completed"; questionCorrect: boolean | number; reflection: string; workspaceJson: string };
type CheckResult = { label: string; passed: boolean };

const emptyFiles: WorkspaceFiles = { html: "", css: "", javascript: "" };
const activityNames = { challenge: "Coding lesson", project: "Project checkpoint", quiz: "Module check" };
const fileNames: Record<CodeFile, string> = { html: "HTML", css: "CSS", javascript: "JavaScript" };

function parseWorkspace(value: string): Partial<WorkspaceFiles> {
  try { return JSON.parse(value) as Partial<WorkspaceFiles>; } catch { return {}; }
}

function normaliseFiles(value: Partial<WorkspaceFiles> | undefined, fallback: WorkspaceFiles = emptyFiles): WorkspaceFiles {
  return {
    html: typeof value?.html === "string" ? value.html : fallback.html,
    css: typeof value?.css === "string" ? value.css : fallback.css,
    javascript: typeof value?.javascript === "string" ? value.javascript : fallback.javascript,
  };
}

function normaliseProject(value: string): ProjectId {
  return projectChoices.some((choice) => choice.id === value) ? value as ProjectId : "interest";
}

function fillProjectTokens(source: WorkspaceFiles, projectId: ProjectId): WorkspaceFiles {
  const project = projectChoices.find((choice) => choice.id === projectId) || projectChoices[0];
  const replacements: Record<string, string> = {
    "{{TITLE}}": project.siteTitle,
    "{{INTRO}}": project.intro,
    "{{ITEM1}}": project.items[0],
    "{{ITEM2}}": project.items[1],
    "{{ITEM3}}": project.items[2],
  };
  const replace = (value: string) => Object.entries(replacements).reduce((result, [token, content]) => result.split(token).join(content), value);
  return { html: replace(source.html), css: replace(source.css), javascript: replace(source.javascript) };
}

function buildPreview(source: WorkspaceFiles): string {
  const script = source.javascript.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;padding:1rem;color:#111936}img{max-width:100%;height:auto}${source.css}</style></head><body>${source.html}<script>${script}</script></body></html>`;
}

function activityLabel(activity: Lesson): string {
  if (activity.activityType === "project") return "Build your website";
  if (activity.activityType === "quiz") return "Knowledge check";
  return activity.language;
}

export function LearningApp({ courseFacts, stages }: { courseFacts: CourseFacts; stages: Stage[] }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Record<string, SavedProgress>>({});
  const [workspaces, setWorkspaces] = useState<Record<string, WorkspaceFiles>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [assessmentChecked, setAssessmentChecked] = useState(false);
  const [workChecked, setWorkChecked] = useState(false);
  const [testResults, setTestResults] = useState<CheckResult[]>([]);
  const [reflection, setReflection] = useState("");
  const [hintIndex, setHintIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"course" | "project" | "exam">("course");
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; stageId: string; version: number; createdAt: string }>>([]);

  const currentActivity = lessons[currentIndex];
  const currentStage = stages.find((stage) => stage.lessons.some((activity) => activity.id === currentActivity.id)) || stages[0];
  const stageActivityIndex = currentStage.lessons.findIndex((activity) => activity.id === currentActivity.id);
  const projectId = normaliseProject(session?.learner.theme || "interest");
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

  function starterFor(activity: Lesson): WorkspaceFiles {
    const direct = workspaces[activity.id];
    if (direct) return direct;
    if (activity.activityType === "project") {
      const stageIndex = stages.findIndex((stage) => stage.lessons.some((lesson) => lesson.id === activity.id));
      for (let index = stageIndex - 1; index >= 0; index -= 1) {
        const previousProject = stages[index].lessons.find((lesson) => lesson.activityType === "project");
        if (!previousProject) continue;
        if (workspaces[previousProject.id]) return workspaces[previousProject.id];
        if (saved[previousProject.id]) return normaliseFiles(parseWorkspace(saved[previousProject.id].workspaceJson), fillProjectTokens(activity.starterFiles, projectId));
      }
    }
    return fillProjectTokens(activity.starterFiles, projectId);
  }

  const workspace = starterFor(currentActivity);

  function loadActivityState(index: number, records: Record<string, SavedProgress>) {
    const activity = lessons[index];
    const record = records[activity.id];
    setCurrentIndex(index);
    setAnswers({});
    setAssessmentChecked(false);
    setWorkChecked(record?.status === "completed" && activity.activityType !== "quiz");
    setTestResults([]);
    setReflection(record?.reflection || "");
    setHintIndex(-1);
    setMessage("");
  }

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      try {
        const response = await fetch("/api/progress");
        const data = await response.json() as {
          learner?: Session["learner"];
          progress?: Array<SavedProgress & { lessonId: string }>;
          checkpoints?: Array<{ id: string; stageId: string; version: number; createdAt: string }>;
          error?: string;
        };
        if (response.status === 401) { if (active) setSession(null); return; }
        if (!response.ok) throw new Error(data.error || "Progress is temporarily unavailable.");
        if (!active) return;
        if (data.learner) setSession({ learner: data.learner });
        const validIds = new Set(lessons.map((activity) => activity.id));
        const progress = (data.progress || []).filter((item) => validIds.has(item.lessonId));
        const records = Object.fromEntries(progress.map((item) => [item.lessonId, item]));
        const nextWorkspaces = Object.fromEntries(progress.map((item) => [item.lessonId, normaliseFiles(parseWorkspace(item.workspaceJson))]));
        const nextCompleted = new Set(progress.filter((item) => item.status === "completed").map((item) => item.lessonId));
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
          setMessage(error instanceof Error ? error.message : "Progress is temporarily unavailable.");
        }
      } finally { if (active) setLoading(false); }
    }
    void loadProgress();
    return () => { active = false; };
  }, []);

  function chooseActivity(index: number) {
    const unlockedThrough = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete;
    if (index > unlockedThrough) return;
    loadActivityState(index, saved);
    setView("course");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateWorkspace(next: WorkspaceFiles) {
    setWorkspaces((current) => ({ ...current, [currentActivity.id]: next }));
    setWorkChecked(false);
    setTestResults([]);
  }

  function checkWork() {
    const results = currentActivity.tests.map((test) => {
      let passed = false;
      try { passed = new RegExp(test.pattern, "i").test(workspace[test.file]); } catch { passed = false; }
      return { label: test.label, passed };
    });
    const passed = results.length > 0 && results.every((result) => result.passed);
    setTestResults(results);
    setWorkChecked(passed);
    setMessage(passed ? "All checks passed. You can complete this lesson." : "Read the failed check, make one repair and test again.");
  }

  async function saveActivity(status: "started" | "completed", knowledgePassed: boolean) {
    if (!session) return false;
    setSaving(true);
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId: currentActivity.id, status, questionCorrect: knowledgePassed, reflection, workspace }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Progress could not be saved.");
      setBackendReady(true);
      return true;
    } catch (error) {
      setBackendReady(false);
      setMessage(error instanceof Error ? error.message : "Progress could not be saved.");
      return false;
    } finally { setSaving(false); }
  }

  async function completeActivity() {
    if (activityDone) { if (currentIndex < lessons.length - 1) chooseActivity(currentIndex + 1); return; }
    const allowed = currentActivity.activityType === "challenge" ? workChecked : currentActivity.activityType === "project" ? workChecked && reflection.trim().length >= 10 : quizPassed;
    if (!allowed) return;
    const knowledgePassed = currentActivity.activityType === "quiz" ? correctCount >= 4 : true;
    const didSave = await saveActivity("completed", knowledgePassed);
    if (!didSave) return;

    const nextCompleted = new Set(completed).add(currentActivity.id);
    const nextSaved = { ...saved, [currentActivity.id]: { status: "completed" as const, questionCorrect: knowledgePassed, reflection, workspaceJson: JSON.stringify(workspace) } };
    setCompleted(nextCompleted);
    setSaved(nextSaved);

    if (currentActivity.activityType === "quiz" && session) {
      const projectActivity = currentStage.lessons.find((activity) => activity.activityType === "project");
      if (projectActivity) {
        const projectWorkspace = workspaces[projectActivity.id] || normaliseFiles(parseWorkspace(saved[projectActivity.id]?.workspaceJson || "{}"), fillProjectTokens(projectActivity.starterFiles, projectId));
        try {
          const response = await fetch("/api/checkpoints", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stageId: currentStage.id, reflection: saved[projectActivity.id]?.reflection || reflection || "Module work completed and checked.", project: { ...projectWorkspace, theme: projectId } }) });
          const data = await response.json() as { checkpoint?: { id: string; stageId: string; version: number; createdAt: string } };
          if (response.ok && data.checkpoint) setCheckpoints((current) => [data.checkpoint!, ...current]);
        } catch { setMessage("The module is complete. Its project version can be saved again later."); }
      }
    }

    if (currentIndex < lessons.length - 1) {
      loadActivityState(currentIndex + 1, nextSaved);
      setMessage(currentActivity.activityType === "quiz" ? `Module ${currentStage.number} complete. The next module is open.` : "Lesson complete. The next coding task is ready.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else { setMessage("The course is complete. Your final check is ready."); }
  }

  if (loading) return <main className="loading-page"><div className="loading-mark">K</div><p>Opening your coding course...</p></main>;
  if (!session) return <Onboarding courseFacts={courseFacts} onCreated={setSession} />;
  if (view === "exam") return <ExamPanel onBack={() => setView("course")} />;

  return (
    <div className="course-app coding-course">
      <header className="course-header coding-header">
        <a className="course-brand" href="/" aria-label="KidyCode home"><span>K</span><b>KidyCode</b></a>
        <div className="local-progress" aria-label={`${stageProgress}% of this module complete`}><div><span>Module {currentStage.number} · lesson {stageActivityIndex + 1} of {currentStage.lessons.length}</span><b>{currentStage.title}</b></div><div className="progress-track"><i style={{ width: `${stageProgress}%` }} /></div></div>
        <nav aria-label="Course views"><button className={view === "course" ? "is-active" : ""} type="button" onClick={() => setView("course")}>Learn</button><button className={view === "project" ? "is-active" : ""} type="button" onClick={() => setView("project")}>My website</button><button type="button" disabled={!allComplete} onClick={() => setView("exam")}>Final check</button></nav>
        <div className="learner-name"><span>{session.learner.age}</span>{session.learner.nickname}</div>
      </header>

      {view === "project" ? (
        <ProjectPage stages={stages} saved={saved} workspaces={workspaces} projectId={projectId} checkpoints={checkpoints} onContinue={() => setView("course")} />
      ) : (
        <main className="fcc-course-layout">
          <CourseRail stages={stages} currentStage={currentStage} completed={completed} currentIndex={currentIndex} firstIncomplete={firstIncomplete} chooseActivity={chooseActivity} courseFacts={courseFacts} />
          <article className="coding-lesson-page">
            {!backendReady && <div className="backend-warning" role="alert">Saving is temporarily unavailable. Keep this page open and try again shortly.</div>}
            {currentActivity.activityType === "quiz" ? (
              <QuizActivity activity={currentActivity} answers={answers} setAnswers={setAnswers} checked={assessmentChecked} setChecked={setAssessmentChecked} correctCount={correctCount} answeredCount={answeredCount} complete={() => void completeActivity()} saving={saving} done={activityDone} />
            ) : (
              <CodingActivity key={currentActivity.id} activity={currentActivity} stage={currentStage} projectId={projectId} workspace={workspace} updateWorkspace={updateWorkspace} checkWork={checkWork} message={message} results={testResults} hintIndex={hintIndex} setHintIndex={setHintIndex} reflection={reflection} setReflection={setReflection} complete={() => void completeActivity()} saving={saving} done={activityDone} ready={workChecked && (currentActivity.activityType !== "project" || reflection.trim().length >= 10)} />
            )}
            <footer className="activity-footer"><button type="button" disabled={currentIndex === 0} onClick={() => chooseActivity(currentIndex - 1)}>← Previous</button><span>Module {currentStage.number}, lesson {stageActivityIndex + 1}</span><button type="button" disabled={!activityDone || currentIndex === lessons.length - 1} onClick={() => chooseActivity(currentIndex + 1)}>Next →</button></footer>
          </article>
        </main>
      )}
    </div>
  );
}

function CourseRail({ stages, currentStage, completed, currentIndex, firstIncomplete, chooseActivity, courseFacts }: { stages: Stage[]; currentStage: Stage; completed: Set<string>; currentIndex: number; firstIncomplete: number; chooseActivity: (index: number) => void; courseFacts: CourseFacts }) {
  return <aside className="fcc-rail coding-rail"><div className="rail-title"><p className="kicker">AGES 10 TO 12</p><h2>{courseFacts.title}</h2><p>Real code · {courseFacts.estimatedHours}</p></div><div className="stage-list">{stages.map((stage) => { const done = stage.lessons.filter((lesson) => completed.has(lesson.id)).length; return <details key={stage.id} open={stage.id === currentStage.id}><summary><span>{String(stage.number).padStart(2, "0")}</span><div><b>{stage.title}</b><small>{done} of {stage.lessons.length} complete</small></div></summary><div className="rail-lessons">{stage.lessons.map((activity) => { const index = lessons.findIndex((item) => item.id === activity.id); const unlockedThrough = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete; return <button key={activity.id} type="button" disabled={index > unlockedThrough} className={`${index === currentIndex ? "is-current" : ""}${completed.has(activity.id) ? " is-done" : ""}`} onClick={() => chooseActivity(index)}><i>{completed.has(activity.id) ? "✓" : activity.activityNumber}</i><span><small>{activityLabel(activity)}</small>{activity.title}</span></button>; })}</div></details>; })}</div></aside>;
}

function CodingActivity({ activity, stage, projectId, workspace, updateWorkspace, checkWork, message, results, hintIndex, setHintIndex, reflection, setReflection, complete, saving, done, ready }: { activity: Lesson; stage: Stage; projectId: ProjectId; workspace: WorkspaceFiles; updateWorkspace: (files: WorkspaceFiles) => void; checkWork: () => void; message: string; results: CheckResult[]; hintIndex: number; setHintIndex: React.Dispatch<React.SetStateAction<number>>; reflection: string; setReflection: React.Dispatch<React.SetStateAction<string>>; complete: () => void; saving: boolean; done: boolean; ready: boolean }) {
  const [activeFile, setActiveFile] = useState<CodeFile>(activity.editableFiles[0] || "html");
  const [preview, setPreview] = useState(() => buildPreview(workspace));
  function runCode() { setPreview(buildPreview(workspace)); }
  return <div className="coding-workbench">
    <section className="coding-instructions">
      <div className="lesson-position"><span>Module {stage.number}</span><b>{activityNames[activity.activityType]}</b></div>
      <h1>{activity.title}</h1><p className="lesson-objective">{activity.objective}</p>
      <div className="lesson-notes"><h2>Learn</h2>{activity.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="term-list">{activity.keyTerms.map((term) => <span key={term}>{term}</span>)}</div></div>
      <div className="code-example"><small>EXAMPLE</small><h2>{activity.exampleTitle}</h2><pre><code>{activity.exampleCode}</code></pre><p>{activity.exampleExplanation}</p></div>
      <div className="coding-task"><small>YOUR TASK</small><h2>{activity.task}</h2><p>Change the code, run it and use the checks to find anything missing.</p></div>
      <div className="hint-panel"><div><b>Need a hint?</b><button type="button" onClick={() => setHintIndex((current) => Math.min(current + 1, activity.hints.length - 1))}>Show hint {Math.min(hintIndex + 2, activity.hints.length)}</button></div>{hintIndex >= 0 && <p>{activity.hints[hintIndex]}</p>}</div>
    </section>
    <section className="coding-studio">
      <div className="editor-panel"><div className="file-tabs" role="tablist" aria-label="Code files">{activity.editableFiles.map((file) => <button key={file} role="tab" aria-selected={activeFile === file} className={activeFile === file ? "is-active" : ""} onClick={() => setActiveFile(file)} type="button">{fileNames[file]}</button>)}</div><textarea aria-label={`${fileNames[activeFile]} code editor`} spellCheck={false} value={workspace[activeFile]} onChange={(event) => updateWorkspace({ ...workspace, [activeFile]: event.target.value })} /></div>
      <div className="preview-panel"><div><b>Browser preview</b><span>Updates when you run the code</span></div><iframe title="Website preview" sandbox="allow-scripts" srcDoc={preview} /></div>
      <div className="code-actions"><button className="outline-button" type="button" onClick={runCode}>Run code</button><button className="primary-button" type="button" onClick={() => { runCode(); checkWork(); }}>Check code</button><button className="text-button" type="button" onClick={() => updateWorkspace(fillProjectTokens(activity.starterFiles, projectId))}>Reset lesson</button></div>
      {message && <p className="workspace-message" aria-live="polite">{message}</p>}
      {results.length > 0 && <div className="test-results">{results.map((result) => <p className={result.passed ? "is-pass" : "is-fail"} key={result.label}><span>{result.passed ? "✓" : "×"}</span>{result.label}</p>)}</div>}
      {activity.activityType === "project" && <div className="project-reflection"><label htmlFor="project-reflection"><b>Explain one choice</b><span>{activity.reflection}</span></label><textarea id="project-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="I chose... because..." /></div>}
      <div className="completion-bar"><span>{ready ? "Checks passed. This lesson is ready." : activity.activityType === "project" ? "Pass the checks and explain one choice." : "Pass every code check to continue."}</span><button className="primary-button" type="button" disabled={!ready || saving || done} onClick={complete}>{done ? "Lesson complete" : saving ? "Saving..." : activity.activityType === "project" ? "Save project version" : "Complete lesson"}</button></div>
    </section>
  </div>;
}

function QuizActivity({ activity, answers, setAnswers, checked, setChecked, correctCount, answeredCount, complete, saving, done }: { activity: Lesson; answers: Record<number, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>; checked: boolean; setChecked: React.Dispatch<React.SetStateAction<boolean>>; correctCount: number; answeredCount: number; complete: () => void; saving: boolean; done: boolean }) {
  const questions = activity.questions || [];
  const passed = checked && correctCount >= 4;
  return <div className="quiz-page"><header><p className="activity-type">MODULE CHECK</p><h1>{activity.title}</h1><h2>Five questions. Four correct answers to continue.</h2><p>Every answer comes from code you already wrote.</p></header><QuestionList questions={questions} answers={answers} setAnswers={(next) => { setChecked(false); setAnswers(next); }} showFeedback={checked} />{checked && <div className={`quiz-result ${passed ? "is-pass" : "is-fail"}`}><b>{correctCount} of {questions.length} correct</b><span>{passed ? "The next module is ready." : "Review the lesson examples, then try again."}</span></div>}<div className="completion-bar"><span>{answeredCount} of {questions.length} answered</span>{!checked && <button className="outline-button" type="button" disabled={answeredCount !== questions.length} onClick={() => setChecked(true)}>Check answers</button>}{checked && !passed && <button className="outline-button" type="button" onClick={() => { setAnswers({}); setChecked(false); }}>Try again</button>}{passed && <button className="primary-button" type="button" disabled={saving || done} onClick={complete}>{done ? "Module complete" : saving ? "Saving..." : "Complete module"}</button>}</div></div>;
}

function QuestionList({ questions, answers, setAnswers, showFeedback }: { questions: PracticeQuestion[]; answers: Record<number, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>; showFeedback: boolean }) {
  return <div className="question-list">{questions.map((question, questionIndex) => { const selected = answers[questionIndex]; const correct = selected === question.answer; return <fieldset key={question.prompt}><legend><span>{questionIndex + 1}</span>{question.prompt}</legend><div>{question.options.map((option, optionIndex) => <label key={option} className={selected === optionIndex ? "is-selected" : ""}><input type="radio" name={`question-${questionIndex}`} checked={selected === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</label>)}</div>{showFeedback && selected !== undefined && <p className={correct ? "is-correct" : "is-wrong"}><b>{correct ? "Correct." : "Review this idea."}</b> {question.explanation}</p>}</fieldset>; })}</div>;
}

function ProjectPage({ stages, saved, workspaces, projectId, checkpoints, onContinue }: { stages: Stage[]; saved: Record<string, SavedProgress>; workspaces: Record<string, WorkspaceFiles>; projectId: ProjectId; checkpoints: Array<{ id: string; stageId: string; version: number; createdAt: string }>; onContinue: () => void }) {
  const project = projectChoices.find((choice) => choice.id === projectId) || projectChoices[0];
  let latestFiles = fillProjectTokens(stages[0].lessons.find((lesson) => lesson.activityType === "project")!.starterFiles, projectId);
  for (const stage of stages) { const activity = stage.lessons.find((lesson) => lesson.activityType === "project"); if (!activity) continue; if (workspaces[activity.id]) latestFiles = workspaces[activity.id]; else if (saved[activity.id]) latestFiles = normaliseFiles(parseWorkspace(saved[activity.id].workspaceJson), latestFiles); }
  return <main className="website-project-page">
    <section className="website-project-heading"><div><p className="kicker">YOUR GROWING WEBSITE</p><h1>{project.title}</h1><p>This is the latest version of the website you are building with HTML, CSS and JavaScript.</p></div><button className="primary-button" type="button" onClick={onContinue}>Continue learning</button></section>
    <section className="website-project-preview"><div><b>Latest browser preview</b><span>Saved lesson code</span></div><iframe title="Latest project preview" sandbox="allow-scripts" srcDoc={buildPreview(latestFiles)} /></section>
    <section className="project-code-summary"><details><summary>View HTML</summary><pre><code>{latestFiles.html}</code></pre></details><details><summary>View CSS</summary><pre><code>{latestFiles.css}</code></pre></details><details><summary>View JavaScript</summary><pre><code>{latestFiles.javascript}</code></pre></details></section>
    <section className="checkpoint-history"><h2>Saved module versions</h2>{checkpoints.length ? checkpoints.map((checkpoint) => <article key={checkpoint.id}><span>Module {stages.find((stage) => stage.id === checkpoint.stageId)?.number}</span><b>Version {checkpoint.version}</b><time>{new Date(checkpoint.createdAt).toLocaleDateString()}</time></article>) : <p>Your first saved version appears after the first module check.</p>}</section>
  </main>;
}

function Onboarding({ courseFacts, onCreated }: { courseFacts: CourseFacts; onCreated: (session: Session) => void }) {
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState(10);
  const [project, setProject] = useState<ProjectId>("interest");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const preview = useMemo(() => buildPreview(fillProjectTokens({
    html: "<header><h1>{{TITLE}}</h1></header><main><p>{{INTRO}}</p><section class=\"cards\"><article class=\"card\">{{ITEM1}}</article><article class=\"card\">{{ITEM2}}</article><article class=\"card\">{{ITEM3}}</article></section></main>",
    css: "body { margin: 0; padding: 1.5rem; background: #f7f3ea; color: #111936; } h1 { color: #4b1f63; } .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; } .card { padding: .8rem; border: 2px solid #111936; } @media (max-width: 650px) { .cards { grid-template-columns: 1fr; } }",
    javascript: "document.querySelector(\"h1\").addEventListener(\"click\", function () { this.textContent = \"You ran JavaScript\"; });",
  }, project)), [project]);
  async function createLearner(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try { const response = await fetch("/api/learners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nickname, age, theme: project }) }); const data = await response.json() as Session & { error?: string }; if (!response.ok) throw new Error(data.error || "The learner profile could not be created."); onCreated(data); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The learner profile could not be created."); }
    finally { setSaving(false); }
  }
  return <main className="onboarding-page coding-onboarding"><a className="course-brand" href="/"><span>K</span><b>KidyCode</b></a><section className="onboarding-copy"><p className="kicker">FIRST GROUP · AGES 10 TO 12</p><h1>Write real code from the first lesson.</h1><p>Learn HTML, CSS and JavaScript in a real editor. Every lesson gives you an explanation, an example, a coding task and automatic checks.</p><div className="course-facts"><span><b>{courseFacts.stageCount}</b> modules</span><span><b>{courseFacts.lessonCount}</b> lessons</span><span><b>1</b> complete website</span></div><div className="website-preview"><div><small>WHAT YOU WILL BUILD</small><h2>{projectChoices.find((choice) => choice.id === project)?.title}</h2><p>Click the heading inside the preview to test its JavaScript.</p></div><iframe title="Finished website example" sandbox="allow-scripts" srcDoc={preview} /></div></section><form className="onboarding-form" onSubmit={createLearner}><div><p className="kicker">START WITH HTML</p><h2>Set up your course.</h2><p>Use a nickname. Do not enter a full name, school or location.</p></div><label>Nickname<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={20} required placeholder="SkyCoder" /></label><fieldset><legend>Age</legend><div className="age-options">{[10, 11, 12].map((value) => <label key={value}><input type="radio" name="age" checked={age === value} onChange={() => setAge(value)} /><span>{value}</span></label>)}</div></fieldset><fieldset className="theme-options"><legend>Choose the website you will build</legend>{projectChoices.map((option) => <label key={option.id}><input type="radio" name="project" checked={project === option.id} onChange={() => setProject(option.id)} /><span><b>{option.title}</b><small>{option.pitch}</small></span></label>)}</fieldset>{message && <p className="form-message is-error" role="alert">{message}</p>}<button className="primary-button" type="submit" disabled={saving}>{saving ? "Preparing the editor..." : "Start the first HTML lesson"}</button><p className="privacy-note">The profile stores only a nickname, age and project choice.</p></form></main>;
}
