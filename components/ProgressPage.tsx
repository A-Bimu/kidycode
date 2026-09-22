"use client";

import { GrownUpAccess } from "@/components/GrownUpAccess";
import AccountControls from "@/components/AccountControls";
import MoveToAnotherDevice from "@/components/MoveToAnotherDevice";
import type { CourseBundle } from "@/lib/course";
import type { Summary } from "@/lib/summary";

/* One calm page built from evidence the learner already produced. Counts and
 * plain labels only. No grade, no percentage, and colour never carries meaning
 * on its own because every status also states what it means. */

function formatDate(value: string | null): string {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusText(status: Summary["courseProgress"]["status"]): string {
  if (status === "complete") return "Complete";
  if (status === "in-progress") return "In progress";
  return "Not started";
}

function moduleStatusText(status: Summary["modules"][number]["status"]): string {
  if (status === "complete") return "Complete";
  if (status === "in-progress") return "In progress";
  return "Not started";
}

function finalAssessmentText(summary: Summary["finalAssessment"]): string {
  if (summary.status === "passed") return `Passed, best result ${summary.bestScore} of ${summary.total}`;
  if (summary.status === "attempted") return `Attempted, best result ${summary.bestScore} of ${summary.total} so far`;
  return "Not started";
}

export function ProgressPage({
  course,
  summary,
  loading,
  error,
  onRetry,
  onBack,
  onOpenNext,
}: {
  course: CourseBundle;
  summary: Summary | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onBack: () => void;
  onOpenNext: (lessonId: string) => void;
}) {
  if (loading) {
    return (
      <main className="progress-page" aria-busy="true">
        <section className="progress-head">
          <p className="kicker">{course.courseFacts.ageRange.toUpperCase()}</p>
          <h1>My progress</h1>
          <p className="progress-lede">Reading your saved work...</p>
        </section>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="progress-page">
        <section className="progress-head">
          <p className="kicker">{course.courseFacts.ageRange.toUpperCase()}</p>
          <h1>My progress</h1>
          <p className="progress-lede" role="alert">{error || "Your progress could not be read right now."}</p>
          <div className="progress-actions">
            <button className="primary-button" type="button" onClick={onRetry}>Try again</button>
            <button className="text-button" type="button" onClick={onBack}>Back to learning</button>
          </div>
        </section>
      </main>
    );
  }

  const empty = summary.courseProgress.lessonsCompleted === 0 && summary.recentActivityAt === null;

  return (
    <main className="progress-page">
      <section className="progress-head">
        <p className="kicker">{summary.course.ageRange.toUpperCase()}</p>
        <h1>My progress</h1>
        <p className="progress-lede">
          Everything here comes from the work you have already done in {summary.course.title}.
        </p>
        <div className="progress-actions">
          <button className="text-button" type="button" onClick={onBack}>Back to learning</button>
        </div>
      </section>

      {empty && (
        <section className="progress-empty">
          <h2>Nothing to measure yet</h2>
          <p>
            Your progress appears here after your first activity. Nothing is missing and nothing is wrong.
            Start with the next step below and this page fills in as you work.
          </p>
        </section>
      )}

      <section className="progress-course" aria-labelledby="progress-course-heading">
        <h2 id="progress-course-heading">Course progress</h2>
        <dl className="progress-figures">
          <div>
            <dt>Activities completed</dt>
            <dd>{summary.courseProgress.lessonsCompleted} of {summary.courseProgress.lessonsTotal}</dd>
          </div>
          <div>
            <dt>Checks passed</dt>
            <dd>{summary.courseProgress.checksPassed} of {summary.courseProgress.checksAvailable}</dd>
          </div>
          <div>
            <dt>Course completion</dt>
            <dd><span className="progress-state">{summary.courseProgress.completionLabel}</span> ({statusText(summary.courseProgress.status)})</dd>
          </div>
          <div>
            <dt>Modules finished</dt>
            <dd>{summary.modules.filter((module) => module.status === "complete").length} of {summary.course.modulesTotal}</dd>
          </div>
          <div>
            <dt>Corrected without help</dt>
            <dd>{summary.independentCorrections} {summary.independentCorrections === 1 ? "time" : "times"}</dd>
          </div>
          <div>
            <dt>Final assessment</dt>
            <dd>{finalAssessmentText(summary.finalAssessment)}</dd>
          </div>
          <div>
            <dt>Most recent activity</dt>
            <dd>{formatDate(summary.recentActivityAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="progress-modules" aria-labelledby="progress-modules-heading">
        <h2 id="progress-modules-heading">Modules</h2>
        <ul>
          {summary.modules.map((module) => (
            <li key={module.id}>
              <div className="module-copy">
                <b>Module {module.number}. {module.title}</b>
                <small>{module.lessonsCompleted} of {module.lessonsTotal} activities complete, {module.checksPassed} of {module.checksAvailable} checks passed</small>
              </div>
              <div className="module-state">
                <span className="progress-state">{module.masteryLabel}</span>
                <small>{moduleStatusText(module.status)}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="progress-review" aria-labelledby="progress-review-heading">
        <div className="review-column">
          <h2 id="progress-review-heading">Needs another look</h2>
          {summary.needsReview.length === 0
            ? <p className="progress-quiet">Nothing is waiting. Your recent work has no open gaps.</p>
            : (
              <ul>
                {summary.needsReview.map((item) => (
                  <li key={item.concept}>
                    <b>{item.focus}</b>
                    <small>From {item.lessonTitle} (Module {item.moduleNumber}). Missed {item.timesFailed === 1 ? "once so far" : `${item.timesFailed} times so far`}.</small>
                  </li>
                ))}
              </ul>
            )}
        </div>
        <div className="review-column">
          <h2>Already strengthened</h2>
          {summary.strengthened.length === 0
            ? <p className="progress-quiet">Recall a concept on the review card and it appears here.</p>
            : (
              <ul>
                {summary.strengthened.map((item) => (
                  <li key={item.concept}>
                    <b>{item.focus}</b>
                    <small>
                      {item.reviewStreak >= 2
                        ? "Recalled twice, so it is settled."
                        : `Recalled ${item.reviewStreak === 1 ? "once" : "and returned to"} and met correctly ${item.timesRecovered} ${item.timesRecovered === 1 ? "time" : "times"}.`}
                    </small>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </section>

      <section className="progress-project" aria-labelledby="progress-project-heading">
        <h2 id="progress-project-heading">Your project</h2>
        <p>
          <b>{summary.project.checkpointsSaved} of {summary.project.modulesTotal} module versions saved.</b>{" "}
          {summary.project.label}. {summary.project.latestAt ? `Last saved ${formatDate(summary.project.latestAt)}.` : "Your first version saves when you finish the first module."}
        </p>
      </section>

      <section className="progress-record" aria-labelledby="progress-record-heading">
        <h2 id="progress-record-heading">Course completion record</h2>
        {summary.completion.complete ? (
          <p>
            <b>Complete.</b>{" "}
            {`${summary.completion.activities.completed} of ${summary.completion.activities.required} activities, ${summary.completion.modules.saved} of ${summary.completion.modules.required} module versions and a passed final assessment.`}
            {summary.completion.completedAt ? ` Completed ${formatDate(summary.completion.completedAt)}.` : ""}
          </p>
        ) : (
          <p>
            <b>{`Not complete yet. Next: ${summary.completion.nextRequirement?.label || "finish the course requirements"}.`}</b>{" "}
            {summary.completion.nextRequirement?.detail || ""}
          </p>
        )}
        <p className="progress-quiet">Open My website to see every saved version and your completion record.</p>
      </section>

      <section className="progress-next" aria-labelledby="progress-next-heading">
        <h2 id="progress-next-heading">Next step</h2>
        <p className="next-title">{summary.nextAction.title}</p>
        <p className="progress-quiet">{summary.nextAction.detail}</p>
        {summary.nextAction.lessonId && (
          <button className="primary-button" type="button" onClick={() => onOpenNext(summary.nextAction.lessonId as string)}>
            Open this activity
          </button>
        )}
      </section>

      {/* Kept last and deliberately small, so it never competes with the next
          action. Adult learners keep their progress to themselves. */}
      <GrownUpAccess enabled={course.courseFacts.id !== "adults"} />

      {/* Available on every path, including adults, because losing a device
          should never mean losing a course. */}
      <MoveToAnotherDevice />

      <AccountControls />
    </main>
  );
}
