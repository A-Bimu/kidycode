"use client";

import { useEffect, useState } from "react";
import { buildPreview } from "@/lib/preview";

/*
 * The learner's portfolio.
 *
 * The overview is deliberately light: eight module cards in learning order, one
 * project title, one next action. Code and a browser preview belong to the focused
 * version view, which shows one saved module at a time, so the page never tries to
 * run eight previews at once.
 *
 * A version whose stored JSON cannot be read is reported as needing another save,
 * and never breaks the rest of the page.
 */

type PortfolioModule = {
  stageId: string;
  number: number;
  title: string;
  outcome: string;
  skill: string;
  saved: boolean;
  readable: boolean;
  savedAt: string | null;
  version: number | null;
  hasReflection: boolean;
};

type CompletionRecord = {
  recordName: string;
  courseTitle: string;
  ageRange: string;
  projectTitle: string;
  technologies: string;
  activities: { completed: number; required: number };
  modules: { saved: number; required: number };
  finalAssessment: { status: "not-started" | "attempted" | "passed"; bestScore: number; total: number };
  complete: boolean;
  completedAt: string | null;
  statement: string;
  missing: Array<{ kind: string; label: string; detail: string }>;
  nextRequirement: { kind: string; label: string; detail: string } | null;
};

type Portfolio = {
  project: { title: string; pitch: string; siteTitle: string; explanation: string };
  modules: PortfolioModule[];
  finalBuild: PortfolioModule | null;
  totals: { saved: number; required: number };
  completion: CompletionRecord;
};

type ModuleDetail = {
  stageId: string;
  number: number;
  title: string;
  outcome: string;
  reflection: string;
  savedAt: string | null;
  files: { html: string; css: string; javascript: string };
  truncated: boolean;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function PortfolioPage({ onContinue }: { onContinue: () => void }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [nickname, setNickname] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [detail, setDetail] = useState<ModuleDetail | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "error">("idle");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/portfolio", { signal: controller.signal, cache: "no-store" });
        const data = (await response.json()) as { portfolio?: Portfolio; learner?: { nickname: string }; error?: string };
        if (!response.ok || !data.portfolio) throw new Error(data.error || "Your portfolio could not be opened right now.");
        setPortfolio(data.portfolio);
        setNickname(data.learner?.nickname || "");
        setState("ready");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Your portfolio could not be opened right now.");
        setState("error");
      }
    })();
    return () => controller.abort();
  }, []);

  async function openVersion(stageId: string) {
    setOpenStage(stageId);
    setDetail(null);
    setDetailError("");
    setDetailState("loading");
    try {
      const response = await fetch(`/api/portfolio?module=${encodeURIComponent(stageId)}`, { cache: "no-store" });
      const data = (await response.json()) as { module?: ModuleDetail; error?: string };
      if (!response.ok || !data.module) throw new Error(data.error || "That saved version could not be opened.");
      setDetail(data.module);
      setDetailState("idle");
    } catch (caught) {
      setDetailError(caught instanceof Error ? caught.message : "That saved version could not be opened.");
      setDetailState("error");
    }
  }

  function backToOverview() {
    setOpenStage(null);
    setDetail(null);
    setDetailState("idle");
    setDetailError("");
  }

  if (state === "loading") {
    return (
      <main className="portfolio-page">
        <p className="portfolio-status-line" role="status" aria-live="polite">Opening your project.</p>
      </main>
    );
  }

  if (state === "error" || !portfolio) {
    return (
      <main className="portfolio-page">
        <section className="portfolio-head">
          <h1>Your project</h1>
          <p className="form-message is-error" role="alert">{error}</p>
          <button className="primary-button" type="button" onClick={onContinue}>Go back to learning</button>
        </section>
      </main>
    );
  }

  if (openStage) {
    const opened = portfolio.modules.find((entry) => entry.stageId === openStage);
    return (
      <main className="portfolio-page portfolio-version">
        <button className="text-button" type="button" onClick={backToOverview} data-testid="portfolio-back">
          Back to my project
        </button>

        {detailState === "loading" && (
          <p className="portfolio-status-line" role="status" aria-live="polite">Opening this saved version.</p>
        )}

        {detailState === "error" && (
          <section className="portfolio-head">
            <h1>{opened ? `Module ${opened.number}: ${opened.title}` : "Saved version"}</h1>
            <p className="form-message is-error" role="alert">{detailError}</p>
          </section>
        )}

        {detail && (
          <>
            <section className="version-head">
              <p className="kicker">{`MODULE ${detail.number} VERSION`}</p>
              <h1>{detail.title}</h1>
              <p className="version-outcome">{detail.outcome}</p>
              <p className="portfolio-quiet">{`Saved ${formatDate(detail.savedAt)}.`}</p>
            </section>

            <section className="version-reflection" aria-labelledby="version-reflection-heading">
              <h2 id="version-reflection-heading">What you wrote about this module</h2>
              <p>{detail.reflection || "No reflection was saved with this version."}</p>
            </section>

            <section className="version-preview" aria-labelledby="version-preview-heading">
              <h2 id="version-preview-heading">This version in the browser</h2>
              <iframe
                title={`Module ${detail.number} browser preview`}
                sandbox="allow-scripts"
                srcDoc={buildPreview(detail.files)}
              />
            </section>

            <section className="version-code" aria-labelledby="version-code-heading">
              <h2 id="version-code-heading">The code in this version</h2>
              <details><summary>View HTML</summary><pre><code>{detail.files.html}</code></pre></details>
              <details><summary>View CSS</summary><pre><code>{detail.files.css}</code></pre></details>
              <details><summary>View JavaScript</summary><pre><code>{detail.files.javascript}</code></pre></details>
              {detail.truncated && <p className="portfolio-quiet">This version is very long, so the code shown here is shortened.</p>}
            </section>
          </>
        )}
      </main>
    );
  }

  const { completion } = portfolio;

  return (
    <main className="portfolio-page">
      <section className="portfolio-head">
        <p className="kicker">YOUR PROJECT</p>
        <h1>{portfolio.project.title}</h1>
        <p>{portfolio.project.explanation}</p>
        {!completion.complete && (
          <button className="primary-button" type="button" onClick={onContinue} data-testid="portfolio-continue">
            Continue learning
          </button>
        )}
      </section>

      <section className="portfolio-modules" aria-labelledby="portfolio-modules-heading">
        <h2 id="portfolio-modules-heading">Your module versions</h2>
        <p className="portfolio-quiet">
          {`${portfolio.totals.saved} of ${portfolio.totals.required} saved. Each one keeps your website as it was at the end of that module.`}
        </p>
        <ul className="portfolio-module-list">
          {portfolio.modules.map((module) => (
            <li key={module.stageId}>
              <article className={module.saved && module.readable ? "portfolio-module is-saved" : "portfolio-module"}>
                <p className="portfolio-module-number">{`Module ${module.number}`}</p>
                <h3>{module.title}</h3>
                <p className="portfolio-skill">{module.skill}</p>
                <p className="portfolio-module-status">
                  {module.saved && module.readable
                    ? `Saved ${formatDate(module.savedAt)}`
                    : module.saved
                      ? "Saved, but the stored version cannot be read"
                      : "Not saved yet"}
                </p>
                {module.saved && module.readable ? (
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => void openVersion(module.stageId)}
                    data-testid={`open-module-${module.number}`}
                  >
                    Open this version
                  </button>
                ) : module.saved ? (
                  <p className="portfolio-warning">Open Module {module.number} again and save the version to repair it.</p>
                ) : (
                  <p className="portfolio-quiet">Finish the six activities in this module to save its version.</p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="portfolio-final" aria-labelledby="portfolio-final-heading">
        <h2 id="portfolio-final-heading">Your finished build</h2>
        {portfolio.finalBuild && portfolio.finalBuild.saved && portfolio.finalBuild.readable ? (
          <>
            <p>
              {`Module ${portfolio.finalBuild.number} is the last version of ${portfolio.project.title}, with every part of the site in place.`}
            </p>
            <button
              className="outline-button"
              type="button"
              onClick={() => void openVersion(portfolio.finalBuild!.stageId)}
              data-testid="open-final-build"
            >
              Open the finished build
            </button>
          </>
        ) : (
          <p className="portfolio-quiet">
            {`Module ${portfolio.finalBuild?.number || 8} is the last version of your website. It appears here once you save that module's project version.`}
          </p>
        )}
      </section>

      <section className="portfolio-record" aria-labelledby="portfolio-record-heading">
        <h2 id="portfolio-record-heading">Course completion record</h2>
        {completion.complete ? (
          <>
            <div className="record-sheet">
              <p className="record-brand">KidyCode</p>
              <h3 className="record-title">KidyCode course completion record</h3>
              <dl className="record-facts">
                <dt>Learner</dt><dd>{nickname}</dd>
                <dt>Course</dt><dd>{`${completion.courseTitle}, ${completion.ageRange}`}</dd>
                <dt>Project</dt><dd>{completion.projectTitle}</dd>
                <dt>Activities completed</dt><dd>{`${completion.activities.completed} of ${completion.activities.required}`}</dd>
                <dt>Module project versions saved</dt><dd>{`${completion.modules.saved} of ${completion.modules.required}`}</dd>
                <dt>Final assessment</dt><dd>Passed</dd>
                <dt>Completed</dt><dd>{formatDate(completion.completedAt)}</dd>
              </dl>
              <p className="record-statement">{completion.statement}</p>
            </div>
            <div className="portfolio-actions">
              <button className="primary-button" type="button" onClick={() => window.print()} data-testid="print-record">
                Print record
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="record-next">
              <b>{`Next: ${completion.nextRequirement?.label || "Finish the course requirements"}.`}</b>{" "}
              {completion.nextRequirement?.detail || ""}
            </p>
            <ul className="record-missing">
              {completion.missing.map((item) => (
                <li key={item.kind}>{item.label}</li>
              ))}
            </ul>
            <p className="portfolio-quiet">
              {`${completion.activities.completed} of ${completion.activities.required} activities, ${completion.modules.saved} of ${completion.modules.required} module versions saved, and the final assessment ${completion.finalAssessment.status === "passed" ? "passed" : "still to pass"}.`}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
