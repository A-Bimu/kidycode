"use client";

import { useCallback, useEffect, useState } from "react";
import type { PilotWorkspace } from "@/lib/pilot-workspace";

/*
 * The institution pilot workspace screen.
 *
 * It holds no rules of its own. The server decides, through canRead and canActOn, what this
 * signed-in member may see, and this component only draws what came back. A refusal is
 * shown plainly rather than hidden, so a grown-up understands the boundary instead of
 * assuming the data is missing.
 */

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; workspace: PilotWorkspace }
  | { kind: "refused"; message: string; organisations: string[] }
  | { kind: "error"; message: string };

export function PilotWorkspacePanel() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/institution/workspace", { headers: { accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setState({ kind: "refused", message: payload.error || "Sign in to open the pilot workspace.", organisations: [] });
        return;
      }
      if (!response.ok) {
        setState({ kind: "refused", message: payload.error || "This workspace is not available to this account.", organisations: payload.organisations || [] });
        return;
      }
      setState({ kind: "ready", workspace: payload.workspace });
    } catch {
      setState({ kind: "error", message: "The pilot workspace could not be loaded. Try again." });
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function open() {
      await load();
      if (!active) return;
    }
    void open();
    return () => {
      active = false;
    };
  }, [load]);

  if (state.kind === "loading") {
    return <p className="kc-muted" aria-live="polite">Loading the pilot workspace...</p>;
  }

  if (state.kind === "error" || state.kind === "refused") {
    return (
      <div className="kc-banner kc-banner-pending" role="alert">
        <p>{state.message}</p>
        {state.kind === "refused" && state.organisations.length > 1 ? (
          <p className="kc-muted">This identity belongs to more than one organisation. Name the one to work in.</p>
        ) : null}
        <button
          type="button"
          className="outline-button"
          onClick={() => {
            setState({ kind: "loading" });
            void load();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const workspace = state.workspace;
  return (
    <div className="kc-workspace">
      <div className="kc-card-top">
        <h2>{workspace.organisation ? workspace.organisation.name : "Your organisation"}</h2>
        <span className="kc-badge">{workspace.role.replace(/_/g, " ")}</span>
      </div>
      <p className="kc-muted">
        {workspace.audience === "cohort" ? "Scoped to the cohorts you work in." : "Scoped to the whole organisation."}
        {workspace.readOnly ? " This role reads and does not change enrolments." : ""}
      </p>

      <div className="kc-facts">
        <div><dt>May read</dt><dd>{workspace.capabilities.mayRead.join(", ") || "nothing"}</dd></div>
        <div><dt>May do</dt><dd>{workspace.capabilities.mayAct.join(", ") || "nothing"}</dd></div>
      </div>

      {workspace.hidden.length > 0 ? (
        <p className="kc-banner kc-banner-pending">
          Not available to this role: {workspace.hidden.join(", ")}.
        </p>
      ) : null}

      <h3>Cohorts</h3>
      {workspace.cohorts.length === 0 ? (
        <p className="kc-muted">No cohort is visible to this role yet.</p>
      ) : (
        <ul className="kc-cards">
          {workspace.cohorts.map((cohort) => (
            <li key={cohort.cohortId} className="kc-card">
              <div className="kc-card-top">
                <h4>{cohort.name}</h4>
                <span className="kc-badge">{cohort.code}</span>
              </div>
              <p className="kc-muted">
                {cohort.courseId} | {cohort.activeEnrolments} active of {cohort.enrolments} enrolled
              </p>
              <ul>
                {cohort.learners.map((learner, index) => (
                  <li key={index}>
                    {learner.display} <span className="kc-muted">({learner.enrolmentStatus})</span>
                  </li>
                ))}
              </ul>
              {cohort.reviews.length > 0 ? (
                <details className="kc-details">
                  <summary>Academic reviews ({cohort.reviews.length})</summary>
                  <ul>
                    {cohort.reviews.map((review, index) => (
                      <li key={index}>
                        {review.scope}: {review.outcome} {review.decidedAt ? `(decided ${review.decidedAt.slice(0, 10)})` : "(pending)"}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {workspace.members.length > 0 ? (
        <details className="kc-details">
          <summary>Members ({workspace.members.length})</summary>
          <ul>
            {workspace.members.map((member, index) => (
              <li key={index}>{member.display} - {member.role.replace(/_/g, " ")}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
