"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { blockCatalog, lessons, themes, type Lesson, type PracticeQuestion, type Stage, type ThemeId } from "@/lib/course";
import { ExamPanel } from "@/components/ExamPanel";
import { MissionGame } from "@/components/MissionGame";

type CourseFacts = { title: string; ageRange: string; lessonCount: number; stageCount: number; estimatedHours: string; passMark: number };
type Session = { learner: { id: string; nickname: string; age: number; theme: ThemeId } };
type SavedProgress = { status: "started" | "completed"; questionCorrect: boolean | number; reflection: string; workspaceJson: string };
type Workspace = { blocks?: string[]; code?: string };
type CheckResult = { label: string; passed: boolean };

const mentorNames = {
  fox: "Fara plans the logic",
  owl: "Odi checks the details",
  elephant: "Ella remembers the values",
  cheetah: "Chui tests the controls",
  butterfly: "Bina improves the experience",
  lion: "Leo prepares the showcase",
};

const activityLabels = {
  theory: "Concept lesson",
  workshop: "Guided build",
  lab: "Independent checkpoint",
  review: "Stage review",
  quiz: "Stage quiz",
};

function parseWorkspace(value: string): Workspace {
  try { return JSON.parse(value) as Workspace; } catch { return {}; }
}

function generatedCode(blocks: string[]): string {
  return blocks.map((block) => blockCatalog[block]?.code || `// ${block}`).join("\n");
}

function activityLabel(activity: Lesson) {
  if (activity.activityType === "workshop") return `Build ${(activity.activityNumber || 2) - 1}`;
  if (activity.activityType === "lab") return "Checkpoint";
  if (activity.activityType === "review") return "Review";
  if (activity.activityType === "quiz") return "Quiz";
  return "Learn";
}

export function LearningApp({ courseFacts, stages }: { courseFacts: CourseFacts; stages: Stage[] }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Record<string, SavedProgress>>({});
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [assessmentChecked, setAssessmentChecked] = useState(false);
  const [workChecked, setWorkChecked] = useState(false);
  const [testResults, setTestResults] = useState<CheckResult[]>([]);
  const [reflection, setReflection] = useState("");
  const [hintIndex, setHintIndex] = useState(-1);
  const [runVersion, setRunVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"course" | "project" | "exam">("course");
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; stageId: string; version: number; createdAt: string }>>([]);

  const currentActivity = lessons[currentIndex];
  const currentStage = stages.find((stage) => stage.lessons.some((activity) => activity.id === currentActivity.id)) || stages[0];
  const stageActivityIndex = currentStage.lessons.findIndex((activity) => activity.id === currentActivity.id);
  const workspace = workspaces[currentActivity.id] || { blocks: currentActivity.starterBlocks || [], code: currentActivity.starterCode || "" };
  const validCompletedCount = lessons.filter((activity) => completed.has(activity.id)).length;
  const firstIncomplete = lessons.findIndex((activity) => !completed.has(activity.id));
  const allComplete = validCompletedCount === lessons.length;
  const stageDone = currentStage.lessons.filter((activity) => completed.has(activity.id)).length;
  const stageProgress = Math.round((stageDone / currentStage.lessons.length) * 100);
  const activityDone = completed.has(currentActivity.id);
  const questions = currentActivity.questions || [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((question, index) => answers[index] === question.answer).length;
  const theoryReady = currentActivity.activityType === "theory" && correctCount === questions.length;
  const quizPassed = currentActivity.activityType === "quiz" && assessmentChecked && correctCount >= 4;

  function loadActivityState(index: number, records: Record<string, SavedProgress>) {
    const activity = lessons[index];
    const record = records[activity.id];
    setCurrentIndex(index);
    setAnswers({});
    setAssessmentChecked(false);
    setWorkChecked(record?.status === "completed" && ["workshop", "lab"].includes(activity.activityType || ""));
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
        const nextWorkspaces = Object.fromEntries(progress.map((item) => [item.lessonId, parseWorkspace(item.workspaceJson)]));
        const nextCompleted = new Set(progress.filter((item) => item.status === "completed").map((item) => item.lessonId));
        setSaved(records);
        setWorkspaces(nextWorkspaces);
        setCompleted(nextCompleted);
        setCheckpoints(data.checkpoints || []);
        const nextActivityIndex = lessons.findIndex((activity) => !nextCompleted.has(activity.id));
        loadActivityState(nextActivityIndex === -1 ? lessons.length - 1 : nextActivityIndex, records);
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

  function setWorkspace(next: Workspace) {
    setWorkspaces((current) => ({ ...current, [currentActivity.id]: next }));
    setWorkChecked(false);
    setTestResults([]);
  }

  function chooseActivity(index: number) {
    const unlockedThrough = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete;
    if (index > unlockedThrough) return;
    loadActivityState(index, saved);
    setView("course");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addBlock(block: string) { setWorkspace({ ...workspace, blocks: [...(workspace.blocks || []), block] }); }

  function moveBlock(index: number, direction: -1 | 1) {
    const blocks = [...(workspace.blocks || [])];
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setWorkspace({ ...workspace, blocks });
  }

  function removeBlock(index: number) {
    setWorkspace({ ...workspace, blocks: (workspace.blocks || []).filter((_, blockIndex) => blockIndex !== index) });
  }

  function resetWorkspace() {
    setWorkspace({ blocks: currentActivity.starterBlocks || [], code: currentActivity.starterCode || "" });
    setMessage("The workspace is back at its starting point.");
  }

  function runWork() {
    setRunVersion((current) => current + 1);
    setMessage("Program run. Compare the preview with the goal, then check your work.");
  }

  function checkWork() {
    let correct = false;
    let results: CheckResult[] = [];
    if (currentActivity.mode === "blocks") {
      const blocks = workspace.blocks || [];
      const required = currentActivity.solutionBlocks || [];
      const allPresent = required.every((block) => blocks.includes(block));
      let cursor = -1;
      const usefulOrder = required.every((block) => {
        const next = blocks.indexOf(block, cursor + 1);
        if (next === -1) return false;
        cursor = next;
        return true;
      });
      correct = allPresent && usefulOrder;
      results = [
        { label: "All required instructions are present", passed: allPresent },
        { label: "The instructions are in a working order", passed: usefulOrder },
      ];
    } else {
      const compact = (workspace.code || "").replace(/\s+/g, " ");
      const changedStarter = (workspace.code || "").trim() !== (currentActivity.starterCode || "").trim();
      const tokenResults = (currentActivity.requiredCode || []).map((token) => ({ label: `The program includes ${token}`, passed: compact.includes(token) }));
      correct = changedStarter && tokenResults.every((result) => result.passed);
      if (currentActivity.id === "showcase-checkpoint") correct = correct && !/\b(goal|importantCode|repairedBug|improvement):\s*""/.test(compact);
      results = [{ label: "The starter code has been changed", passed: changedStarter }, ...tokenResults];
    }
    if (currentActivity.activityType === "lab" && currentActivity.requirements) {
      results = [...results, ...currentActivity.requirements.map((requirement) => ({ label: requirement, passed: correct }))];
    }
    setTestResults(results);
    setWorkChecked(correct);
    setMessage(correct ? "All checks passed. Keep this working version." : "One or more checks still need attention. Repair one thing, then run the checks again.");
  }

  async function saveActivity(status: "started" | "completed", knowledgePassed: boolean) {
    if (!session) return false;
    setSaving(true);
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: currentActivity.id, status, questionCorrect: knowledgePassed, reflection, workspace }),
      });
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
    const type = currentActivity.activityType;
    const allowed =
      (type === "theory" && theoryReady) ||
      (type === "workshop" && workChecked) ||
      (type === "lab" && workChecked && reflection.trim().length >= 10) ||
      type === "review" ||
      (type === "quiz" && quizPassed);
    if (!allowed) return;

    const knowledgePassed = type === "theory" || type === "quiz" ? correctCount >= Math.ceil(questions.length * 0.8) : true;
    const didSave = await saveActivity("completed", knowledgePassed);
    if (!didSave) return;

    const nextCompleted = new Set(completed).add(currentActivity.id);
    const nextSaved = { ...saved, [currentActivity.id]: { status: "completed" as const, questionCorrect: knowledgePassed, reflection, workspaceJson: JSON.stringify(workspace) } };
    setCompleted(nextCompleted);
    setSaved(nextSaved);

    if (type === "quiz" && session) {
      const labId = `${currentStage.id}-checkpoint`;
      const project = workspaces[labId] || parseWorkspace(saved[labId]?.workspaceJson || "{}");
      try {
        const response = await fetch("/api/checkpoints", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stageId: currentStage.id, reflection: saved[labId]?.reflection || reflection, project: { ...project, theme: session.learner.theme } }),
        });
        const data = await response.json() as { checkpoint?: { id: string; stageId: string; version: number; createdAt: string } };
        if (response.ok && data.checkpoint) setCheckpoints((current) => [data.checkpoint!, ...current]);
      } catch { setMessage("Your stage is complete. The project checkpoint can be saved again later."); }
    }

    if (currentIndex < lessons.length - 1) {
      loadActivityState(currentIndex + 1, nextSaved);
      setMessage(type === "quiz" ? `Stage ${currentStage.number} complete. Your next stage is ready.` : "Activity complete. The next step is ready.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else { setMessage("The course is complete. Your final practical check is ready."); }
  }

  if (loading) return <main className="loading-page"><div className="loading-mark">K</div><p>Opening your project...</p></main>;
  if (!session) return <Onboarding onCreated={setSession} />;
  if (view === "exam") return <ExamPanel onBack={() => setView("course")} />;

  const mentorAsset = `/assets/origami-${currentStage.mentor}.webp`;
  return (
    <div className="course-app learning-v2">
      <header className="course-header learning-header">
        <a className="course-brand" href="/" aria-label="KidyCode home"><span>K</span><b>KidyCode</b></a>
        <div className="local-progress" aria-label={`${stageProgress}% of this stage complete`}><div><span>Stage {currentStage.number} · activity {stageActivityIndex + 1} of {currentStage.lessons.length}</span><b>{currentStage.title}</b></div><div className="progress-track"><i style={{ width: `${stageProgress}%` }} /></div></div>
        <nav aria-label="Course views"><button className={view === "course" ? "is-active" : ""} type="button" onClick={() => setView("course")}>Continue</button><button className={view === "project" ? "is-active" : ""} type="button" onClick={() => setView("project")}>My project</button><button type="button" disabled={!allComplete} onClick={() => setView("exam")}>Final check</button></nav>
        <div className="learner-name"><span>{session.learner.age}</span>{session.learner.nickname}</div>
      </header>

      {view === "project" ? (
        <main className="project-page"><section className="project-heading"><p className="kicker">ONE PROJECT, TEN SAVED VERSIONS</p><h1>{themes.find((theme) => theme.id === session.learner.theme)?.title}</h1><p>Every completed stage adds a tested version here. You can explain what changed and show how the project grew.</p><button className="primary-button" type="button" onClick={() => setView("course")}>Continue the course</button></section><MissionGame theme={session.learner.theme} stageNumber={currentStage.number} runVersion={runVersion} blocks={workspace.blocks || []} /><section className="checkpoint-history"><h2>Saved versions</h2>{checkpoints.length ? checkpoints.map((checkpoint) => <article key={checkpoint.id}><span>Stage {stages.find((stage) => stage.id === checkpoint.stageId)?.number}</span><b>Version {checkpoint.version}</b><time>{new Date(checkpoint.createdAt).toLocaleDateString()}</time></article>) : <p>Your first saved version appears after the Stage 1 quiz.</p>}</section></main>
      ) : (
        <main className="fcc-course-layout">
          <aside className="fcc-rail">
            <div className="rail-title"><p className="kicker">AGES 10 TO 12</p><h2>{courseFacts.title}</h2><p>One project · {courseFacts.estimatedHours}</p></div>
            <div className="stage-list">{stages.map((stage) => {
              const done = stage.lessons.filter((activity) => completed.has(activity.id)).length;
              return <details key={stage.id} open={stage.id === currentStage.id}><summary><span>{String(stage.number).padStart(2, "0")}</span><div><b>{stage.title}</b><small>{done} of {stage.lessons.length} complete</small></div></summary><div className="rail-lessons">{stage.lessons.map((activity) => {
                const index = lessons.findIndex((item) => item.id === activity.id);
                const unlockedThrough = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete;
                const locked = index > unlockedThrough;
                return <button key={activity.id} type="button" disabled={locked} className={`${index === currentIndex ? "is-current" : ""}${completed.has(activity.id) ? " is-done" : ""}`} onClick={() => chooseActivity(index)}><i>{completed.has(activity.id) ? "✓" : activity.activityNumber}</i><span><small>{activityLabel(activity)}</small>{activity.title.replace(/^Build \d+: /, "")}</span></button>;
              })}</div></details>;
            })}</div>
          </aside>

          <article className="activity-page">
            {!backendReady && <div className="backend-warning" role="alert">Saving is temporarily unavailable. Keep this page open and try again shortly.</div>}
            <header className="activity-heading"><div><p className="activity-type">{activityLabels[currentActivity.activityType || "theory"]}</p><p className="kicker">STAGE {currentStage.number} · {currentActivity.minutes} MIN</p><h1>{currentActivity.title}</h1><p>{currentActivity.objective}</p></div><div className="mentor-single"><Image src={mentorAsset} alt={`Origami ${currentStage.mentor} learning guide`} width={118} height={118} priority /><span>{mentorNames[currentStage.mentor]}</span></div></header>
            <nav className="activity-strip" aria-label="Current stage activities">{currentStage.lessons.map((activity, index) => {
              const globalIndex = lessons.findIndex((item) => item.id === activity.id);
              const locked = firstIncomplete !== -1 && globalIndex > firstIncomplete;
              return <button key={activity.id} type="button" disabled={locked} className={`${activity.id === currentActivity.id ? "is-current" : ""}${completed.has(activity.id) ? " is-done" : ""}`} onClick={() => chooseActivity(globalIndex)}><span>{completed.has(activity.id) ? "✓" : index + 1}</span><b>{activityLabel(activity)}</b></button>;
            })}</nav>

            {currentActivity.activityType === "theory" && <TheoryActivity activity={currentActivity} answers={answers} setAnswers={setAnswers} complete={() => void completeActivity()} saving={saving} done={activityDone} />}
            {currentActivity.activityType === "workshop" && <BuildActivity activity={currentActivity} theme={session.learner.theme} stageNumber={currentStage.number} workspace={workspace} setWorkspace={setWorkspace} addBlock={addBlock} moveBlock={moveBlock} removeBlock={removeBlock} resetWorkspace={resetWorkspace} runWork={runWork} checkWork={checkWork} runVersion={runVersion} message={message} results={testResults} hintIndex={hintIndex} setHintIndex={setHintIndex} complete={() => void completeActivity()} saving={saving} done={activityDone} ready={workChecked} />}
            {currentActivity.activityType === "lab" && <BuildActivity activity={currentActivity} theme={session.learner.theme} stageNumber={currentStage.number} workspace={workspace} setWorkspace={setWorkspace} addBlock={addBlock} moveBlock={moveBlock} removeBlock={removeBlock} resetWorkspace={resetWorkspace} runWork={runWork} checkWork={checkWork} runVersion={runVersion} message={message} results={testResults} hintIndex={hintIndex} setHintIndex={setHintIndex} reflection={reflection} setReflection={setReflection} complete={() => void completeActivity()} saving={saving} done={activityDone} ready={workChecked && reflection.trim().length >= 10} isLab />}
            {currentActivity.activityType === "review" && <ReviewActivity activity={currentActivity} complete={() => void completeActivity()} saving={saving} done={activityDone} />}
            {currentActivity.activityType === "quiz" && <QuizActivity activity={currentActivity} answers={answers} setAnswers={setAnswers} checked={assessmentChecked} setChecked={setAssessmentChecked} correctCount={correctCount} answeredCount={answeredCount} complete={() => void completeActivity()} saving={saving} done={activityDone} />}

            <footer className="activity-footer"><button type="button" disabled={currentIndex === 0} onClick={() => chooseActivity(currentIndex - 1)}>← Previous activity</button><span>Stage {currentStage.number}, {stageActivityIndex + 1} of {currentStage.lessons.length}</span><button type="button" disabled={!activityDone || currentIndex === lessons.length - 1} onClick={() => chooseActivity(currentIndex + 1)}>Next activity →</button></footer>
          </article>
        </main>
      )}
    </div>
  );
}

function TheoryActivity({ activity, answers, setAnswers, complete, saving, done }: { activity: Lesson; answers: Record<number, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>; complete: () => void; saving: boolean; done: boolean }) {
  const questions = activity.questions || [];
  const correct = questions.filter((question, index) => answers[index] === question.answer).length;
  return (
    <div className="theory-layout">
      <aside className="learning-guide"><p className="start-marker">START HERE</p><h2>What you will understand</h2><p>{activity.objective}</p><h3>Key terms</h3><div className="term-list">{activity.keyTerms?.map((term) => <span key={term}>{term}</span>)}</div><p className="reading-tip">Read one section, inspect its example, then explain the idea in your own words.</p></aside>
      <div className="theory-reading">
        {activity.sections?.map((section, index) => <section className="theory-section" key={section.title}><p className="section-number">{String(index + 1).padStart(2, "0")}</p><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="inline-example"><div><small>WORKED EXAMPLE</small><h3>{section.exampleTitle}</h3><p>{section.exampleExplanation}</p></div><pre><code>{section.exampleCode}</code></pre></div></section>)}
        <section className="knowledge-check"><p className="kicker">CHECK YOUR UNDERSTANDING</p><h2>Answer all three correctly.</h2><QuestionList questions={questions} answers={answers} setAnswers={setAnswers} showFeedback /><div className="completion-bar"><span>{correct} of {questions.length} correct</span><button className="primary-button" type="button" disabled={correct !== questions.length || saving || done} onClick={complete}>{done ? "Concept lesson complete" : saving ? "Saving..." : "Complete concept lesson"}</button></div></section>
      </div>
    </div>
  );
}

type BuildActivityProps = {
  activity: Lesson; theme: ThemeId; stageNumber: number; workspace: Workspace; setWorkspace: (workspace: Workspace) => void;
  addBlock: (block: string) => void; moveBlock: (index: number, direction: -1 | 1) => void; removeBlock: (index: number) => void;
  resetWorkspace: () => void; runWork: () => void; checkWork: () => void; runVersion: number; message: string; results: CheckResult[];
  hintIndex: number; setHintIndex: React.Dispatch<React.SetStateAction<number>>; reflection?: string; setReflection?: React.Dispatch<React.SetStateAction<string>>;
  complete: () => void; saving: boolean; done: boolean; ready: boolean; isLab?: boolean;
};

function BuildActivity({ activity, theme, stageNumber, workspace, setWorkspace, addBlock, moveBlock, removeBlock, resetWorkspace, runWork, checkWork, runVersion, message, results, hintIndex, setHintIndex, reflection, setReflection, complete, saving, done, ready, isLab = false }: BuildActivityProps) {
  const blocks = workspace.blocks || [];
  return (
    <div className={`studio-page ${isLab ? "is-lab" : ""}`}>
      <aside className="instruction-panel"><p className="activity-type">{isLab ? "WORK INDEPENDENTLY" : "FOLLOW THE BUILD"}</p><h2>{isLab ? "Success requirements" : "Build steps"}</h2>{isLab ? <ul className="requirements-list">{activity.requirements?.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul> : <ol className="workshop-steps">{activity.steps?.map((step) => <li key={step}>{step}</li>)}</ol>}<div className="example-note"><small>EXAMPLE TO STUDY</small><h3>{activity.exampleTitle}</h3><pre><code>{activity.exampleCode}</code></pre><p>{activity.exampleExplanation}</p></div></aside>
      <section className="studio-workspace">
        <div className="studio-topline"><div><p className="kicker">YOUR PROJECT</p><h2>{activity.task}</h2></div><span>Saved when completed</span></div>
        <div className="build-grid v2-build-grid"><div className="workspace-card">
          {activity.mode === "blocks" ? <><div className="palette" aria-label="Available coding blocks"><h3>Available blocks</h3>{(activity.availableBlocks || []).map((block) => <button key={block} type="button" onClick={() => addBlock(block)}><small>{blockCatalog[block]?.group}</small>{blockCatalog[block]?.label}</button>)}</div><div className="block-workspace" aria-label="Program workspace"><h3>Your program</h3>{blocks.length ? blocks.map((block, index) => <div className={`code-block block-${blockCatalog[block]?.group.toLowerCase()}`} key={`${block}-${index}`}><span>{index + 1}</span><b>{blockCatalog[block]?.label || block}</b><div><button type="button" onClick={() => moveBlock(index, -1)} aria-label="Move block up">↑</button><button type="button" onClick={() => moveBlock(index, 1)} aria-label="Move block down">↓</button><button type="button" onClick={() => removeBlock(index)} aria-label="Remove block">×</button></div></div>) : <p className="empty-workspace">Choose the first instruction from the available blocks.</p>}<details className="generated-code"><summary>See the JavaScript</summary><pre><code>{generatedCode(blocks)}</code></pre></details></div></> : <div className="javascript-editor"><div><h3>JavaScript</h3><span>Change only what the task asks for.</span></div><textarea value={workspace.code || ""} onChange={(event) => setWorkspace({ ...workspace, code: event.target.value })} spellCheck={false} aria-label="JavaScript editor" /></div>}
          <div className="workspace-actions"><button className="outline-button" type="button" onClick={runWork}>Run project</button><button className="primary-button" type="button" onClick={checkWork}>Check my work</button><button className="text-button" type="button" onClick={resetWorkspace}>Reset</button></div>
          {message && <p className="workspace-message" aria-live="polite">{message}</p>}
          {results.length > 0 && <div className="test-results">{results.map((result) => <p className={result.passed ? "is-pass" : "is-fail"} key={result.label}><span>{result.passed ? "✓" : "×"}</span>{result.label}</p>)}</div>}
          <div className="hint-panel"><div><b>Need a nudge?</b><button type="button" onClick={() => setHintIndex((current) => Math.min(current + 1, activity.hints.length - 1))}>Show hint {Math.min(hintIndex + 2, activity.hints.length)}</button></div>{hintIndex >= 0 && <p>{activity.hints[hintIndex]}</p>}</div>
        </div><MissionGame theme={theme} stageNumber={stageNumber} runVersion={runVersion} blocks={blocks} /></div>
        {isLab && setReflection && <div className="lab-reflection"><label htmlFor="lab-reflection"><b>Explain one decision</b><span>{activity.reflection}</span></label><textarea id="lab-reflection" value={reflection || ""} onChange={(event) => setReflection(event.target.value)} placeholder="I chose... because..." /></div>}
        <div className="completion-bar"><span>{ready ? "Ready to save" : isLab ? "Pass the checks and explain one decision" : "Pass the project checks"}</span><button className="primary-button" type="button" disabled={!ready || saving || done} onClick={complete}>{done ? "Activity complete" : saving ? "Saving..." : isLab ? "Save checkpoint" : "Complete build"}</button></div>
      </section>
    </div>
  );
}

function ReviewActivity({ activity, complete, saving, done }: { activity: Lesson; complete: () => void; saving: boolean; done: boolean }) {
  return <div className="review-page"><aside><p className="activity-type">NO NEW IDEAS HERE</p><h2>Use this page to prepare.</h2><p>Everything below appeared earlier in this stage. Say each key term in your own words before opening the quiz.</p><div className="term-list">{activity.keyTerms?.map((term) => <span key={term}>{term}</span>)}</div></aside><div className="review-sheet">{activity.sections?.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<pre><code>{section.exampleCode}</code></pre></section>)}<div className="completion-bar"><span>Return here whenever you need to revise.</span><button className="primary-button" type="button" disabled={saving || done} onClick={complete}>{done ? "Review complete" : saving ? "Saving..." : "I am ready for the quiz"}</button></div></div></div>;
}

function QuizActivity({ activity, answers, setAnswers, checked, setChecked, correctCount, answeredCount, complete, saving, done }: { activity: Lesson; answers: Record<number, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>; checked: boolean; setChecked: React.Dispatch<React.SetStateAction<boolean>>; correctCount: number; answeredCount: number; complete: () => void; saving: boolean; done: boolean }) {
  const questions = activity.questions || [];
  const passed = checked && correctCount >= 4;
  return <div className="quiz-page"><header><p className="activity-type">STAGE QUIZ</p><h2>Five questions. Four correct answers to pass.</h2><p>No new ideas appear here. If you need help, return to the review and try again.</p></header><QuestionList questions={questions} answers={answers} setAnswers={(next) => { setChecked(false); setAnswers(next); }} showFeedback={checked} />{checked && <div className={`quiz-result ${passed ? "is-pass" : "is-fail"}`}><b>{correctCount} of {questions.length} correct</b><span>{passed ? "You are ready to finish this stage." : "Return to the review, then try a fresh attempt."}</span></div>}<div className="completion-bar"><span>{answeredCount} of {questions.length} answered</span>{!checked && <button className="outline-button" type="button" disabled={answeredCount !== questions.length} onClick={() => setChecked(true)}>Check quiz</button>}{checked && !passed && <button className="outline-button" type="button" onClick={() => { setAnswers({}); setChecked(false); }}>Try again</button>}{passed && <button className="primary-button" type="button" disabled={saving || done} onClick={complete}>{done ? "Stage complete" : saving ? "Saving..." : "Complete stage"}</button>}</div></div>;
}

function QuestionList({ questions, answers, setAnswers, showFeedback }: { questions: PracticeQuestion[]; answers: Record<number, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>; showFeedback: boolean }) {
  return <div className="question-list">{questions.map((question, questionIndex) => {
    const selected = answers[questionIndex];
    const correct = selected === question.answer;
    return <fieldset key={question.prompt}><legend><span>{questionIndex + 1}</span>{question.prompt}</legend><div>{question.options.map((option, optionIndex) => <label key={option} className={selected === optionIndex ? "is-selected" : ""}><input type="radio" name={`question-${questionIndex}`} checked={selected === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</label>)}</div>{showFeedback && selected !== undefined && <p className={correct ? "is-correct" : "is-wrong"}><b>{correct ? "Correct." : "Try that one again."}</b> {correct ? question.explanation : "Use the explanation and example from this stage."}</p>}</fieldset>;
  })}</div>;
}

function Onboarding({ onCreated }: { onCreated: (session: Session) => void }) {
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState(10);
  const [theme, setTheme] = useState<ThemeId>("wildlife");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const previewBlocks = useMemo(() => ["start", "score0", "lives3", "collect", "avoid", "win", "level2", "reset"], []);

  async function createLearner(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/learners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nickname, age, theme }) });
      const data = await response.json() as Session & { error?: string };
      if (!response.ok) throw new Error(data.error || "The learner profile could not be created.");
      onCreated(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The learner profile could not be created."); }
    finally { setSaving(false); }
  }

  return <main className="onboarding-page onboarding-v2"><a className="course-brand" href="/"><span>K</span><b>KidyCode</b></a><section className="onboarding-copy"><p className="kicker">AGES 10 TO 12 · SELF-PACED</p><h1>Choose a mission. Build the whole game.</h1><p>You will begin with exact instructions, add one tested feature at a time and finish with a two-level JavaScript game you can explain.</p><div className="course-facts"><span><b>10</b> stages</span><span><b>1</b> complete game</span><span><b>10</b> saved versions</span></div><div className="finished-preview"><div><p className="activity-type">WHAT YOU WILL FINISH</p><h2>{themes.find((option) => option.id === theme)?.title}</h2><p>Try the controls. Your own version will grow from Stage 1 to Stage 10.</p></div><MissionGame theme={theme} stageNumber={10} runVersion={0} blocks={previewBlocks} /></div></section><form className="onboarding-form" onSubmit={createLearner}><div><p className="kicker">START YOUR COURSE</p><h2>Set up the project.</h2><p>Use a nickname. Do not enter a full name, school or location.</p></div><label>Nickname<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={20} required placeholder="SkyCoder" /></label><fieldset><legend>Age</legend><div className="age-options">{[10, 11, 12].map((value) => <label key={value}><input type="radio" name="age" checked={age === value} onChange={() => setAge(value)} /><span>{value}</span></label>)}</div></fieldset><fieldset className="theme-options"><legend>Choose one mission</legend>{themes.map((option) => <label key={option.id}><input type="radio" name="theme" checked={theme === option.id} onChange={() => setTheme(option.id)} /><span><b>{option.title}</b><small>{option.pitch}</small></span></label>)}</fieldset>{message && <p className="form-message is-error" role="alert">{message}</p>}<button className="primary-button" type="submit" disabled={saving}>{saving ? "Preparing Stage 1..." : "Start Stage 1"}</button><p className="privacy-note">The profile stores only a nickname, age and project choice.</p></form></main>;
}
