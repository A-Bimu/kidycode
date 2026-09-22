"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { GuardianSummary } from "@/lib/guardian-view";

/*
 * The guardian dashboard.
 *
 * The identity is not chosen here. Every call is answered by the server using the
 * platform identity headers, so this page either shows the signed in guardian's
 * own learners or asks them to sign in. It is read only: a guardian can look and
 * can disconnect, and can change nothing about a learner's work.
 */

type Learner = { linkRef: string; firstName: string; courseGroup: string; connectedAt: string };
type SessionPayload = { guardian: { displayName: string; email: string }; learners: Learner[] };

const SIGN_IN_PATH = "/signin-with-chatgpt";

function formatWhen(value: string | null): string {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function minutesLeft(expiresAt: string): number {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return remaining <= 0 ? 0 : Math.max(1, Math.ceil(remaining / 60_000));
}

function finalAssessmentText(summary: GuardianSummary["finalAssessment"]): string {
  if (summary.status === "passed") return `Passed, best result ${summary.bestScore} of ${summary.total}`;
  if (summary.status === "attempted") return `Attempted, best result ${summary.bestScore} of ${summary.total}`;
  return "Not started";
}

export function GuardianDashboard() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [guardian, setGuardian] = useState<SessionPayload["guardian"] | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState<Learner | null>(null);
  const [summary, setSummary] = useState<GuardianSummary | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [transfer, setTransfer] = useState<{ linkRef: string; code: string; expiresAt: string } | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/guardian/session", { cache: "no-store" });
      if (response.status === 401) {
        setSignedIn(false);
        return;
      }
      const data = await response.json() as SessionPayload & { error?: string };
      if (!response.ok) throw new Error(data.error || "Your account could not be opened.");
      setSignedIn(true);
      setGuardian(data.guardian);
      setLearners(data.learners || []);
      setError("");
    } catch (failure) {
      setSignedIn(true);
      setError(failure instanceof Error ? failure.message : "Your account could not be opened.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function open() {
      await loadSession();
      if (!active) return;
    }
    void open();
    return () => { active = false; };
  }, [loadSession]);

  async function connect() {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/guardian/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json() as { learner?: { linkRef: string; firstName: string }; learners?: Learner[]; error?: string };
      if (!response.ok) throw new Error(data.error || "That code could not be used.");
      setCode("");
      setLearners(data.learners || []);
      setStatus(`You are now connected to ${data.learner?.firstName || "this learner"}.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That code could not be used.");
    } finally {
      setBusy(false);
    }
  }

  /* A transfer code is created for a learner through the guardian's own link, so a
   * revoked or unrelated account cannot ask for one. The learner's own session is
   * never handed to a guardian: only a code they can pass on. */
  async function createTransfer(learner: Learner) {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/guardian/transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ link: learner.linkRef }),
      });
      const data = await response.json() as { transfer?: { code: string; expiresAt: string }; error?: string };
      if (!response.ok || !data.transfer) throw new Error(data.error || "A transfer code could not be created.");
      setTransfer({ linkRef: learner.linkRef, code: data.transfer.code, expiresAt: data.transfer.expiresAt });
      setStatus(`A transfer code for ${learner.firstName} is ready. It expires in ten minutes.`);
    } catch (failure) {
      setTransfer(null);
      setError(failure instanceof Error ? failure.message : "A transfer code could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function openSummary(learner: Learner) {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch(`/api/guardian/summary?link=${encodeURIComponent(learner.linkRef)}`, { cache: "no-store" });
      const data = await response.json() as { summary?: GuardianSummary; error?: string };
      if (!response.ok || !data.summary) throw new Error(data.error || "That progress could not be opened.");
      setSelected(learner);
      setSummary(data.summary);
    } catch (failure) {
      setSelected(null);
      setSummary(null);
      setError(failure instanceof Error ? failure.message : "That progress could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(learner: Learner) {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/guardian/links", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ linkRef: learner.linkRef }),
      });
      const data = await response.json() as { learners?: Learner[]; error?: string };
      if (!response.ok) throw new Error(data.error || "That connection could not be ended.");
      setLearners(data.learners || []);
      if (selected?.linkRef === learner.linkRef) {
        setSelected(null);
        setSummary(null);
      }
      setStatus(`You are no longer connected to ${learner.firstName}.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That connection could not be ended.");
    } finally {
      setBusy(false);
    }
  }

  if (signedIn === null) {
    return (
      <main className="guardian-page" aria-busy="true">
        <section className="guardian-head">
          <p className="kicker">KIDYCODE GROWN-UPS</p>
          <h1>Checking your account...</h1>
        </section>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="guardian-page">
        <section className="guardian-head">
          <p className="kicker">KIDYCODE GROWN-UPS</p>
          <h1>Follow a learner&apos;s progress</h1>
          <p className="guardian-lede">
            Sign in with ChatGPT first. KidyCode uses that sign-in, so you never create another password here.
          </p>
          <a className="primary-button" href={`${SIGN_IN_PATH}?return_to=/guardian`}>Sign in with ChatGPT</a>
          <p className="guardian-quiet">
            After signing in, you will need the one-time code from the learner you look after.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="guardian-page">
      <section className="guardian-head">
        <p className="kicker">KIDYCODE GROWN-UPS</p>
        <h1>{guardian?.displayName || "Your learners"}</h1>
        <p className="guardian-lede">
          Signed in as {guardian?.email}. This view is read only: you can follow progress and disconnect,
          and nothing here can change a learner&apos;s work.
        </p>
        <a className="text-button" href={`/signout-with-chatgpt?return_to=/guardian`}>Sign out</a>
      </section>

      <section className="guardian-connect" aria-labelledby="guardian-connect-heading">
        <h2 id="guardian-connect-heading">Add a learner</h2>
        <p className="guardian-quiet">
          Ask the learner to open &quot;Grown-up access&quot; on their progress page, then type the code they show you.
          Codes work once and expire after ten minutes.
        </p>
        <form onSubmit={(event) => { event.preventDefault(); void connect(); }}>
          <label htmlFor="guardian-code-input">Connection code</label>
          <input
            id="guardian-code-input"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ABCD-EFGH-JKMN-PQRS"
            autoComplete="off"
            spellCheck={false}
            maxLength={32}
          />
          <button className="primary-button" type="submit" disabled={busy || code.trim().length < 8}>
            {busy ? "Checking..." : "Connect"}
          </button>
        </form>
      </section>

      <section className="guardian-learners" aria-labelledby="guardian-learners-heading">
        <h2 id="guardian-learners-heading">Your learners</h2>
        {learners.length === 0
          ? <p className="guardian-quiet">No learner is connected to this account yet.</p>
          : (
            <ul>
              {learners.map((learner) => (
                <li key={learner.linkRef}>
                  <div className="guardian-learner-copy">
                    <b>{learner.firstName}</b>
                    <small>{learner.courseGroup}, connected {formatWhen(learner.connectedAt)}</small>
                  </div>
                  <div className="guardian-learner-actions">
                    <button className="outline-button" type="button" disabled={busy} onClick={() => void openSummary(learner)}>
                      View progress
                    </button>
                    <button className="outline-button" type="button" disabled={busy} onClick={() => void createTransfer(learner)}>
                      Transfer code
                    </button>
                    <button className="text-button" type="button" disabled={busy} onClick={() => void disconnect(learner)}>
                      Disconnect
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        {transfer ? (
          <div className="guardian-transfer" data-testid="guardian-transfer">
            <p className="transfer-code-label">{`Transfer code for ${learners.find((learner) => learner.linkRef === transfer.linkRef)?.firstName || "your learner"}`}</p>
            <p className="transfer-code-value">{transfer.code}</p>
            <p className="transfer-code-expiry">
              Expires in about {minutesLeft(transfer.expiresAt)} minutes. It works once, and the device that uses it signs
              the learner in there.
            </p>
          </div>
        ) : null}
      </section>

      <p className="guardian-status" aria-live="polite">{status}</p>
      <p className="guardian-quiet">
        <Link href="/privacy">Privacy and grown-ups</Link>: what a connected grown-up can see, and what stays private.
      </p>
      {error && <p className="guardian-error" role="alert">{error}</p>}

      {summary && selected && (
        <section className="guardian-summary" aria-labelledby="guardian-summary-heading">
          <h2 id="guardian-summary-heading">{summary.learner.firstName}&apos;s progress</h2>
          <p className="guardian-quiet">{summary.learner.courseGroup}. Last activity {formatWhen(summary.lastActivityAt)}.</p>

          <dl className="guardian-figures">
            <div><dt>Activities completed</dt><dd>{summary.activities.completed} of {summary.activities.total}</dd></div>
            <div><dt>Course completion</dt><dd>{summary.activities.label}</dd></div>
            <div><dt>Project versions saved</dt><dd>{summary.project.saved} of {summary.project.total}</dd></div>
            <div><dt>Final assessment</dt><dd>{finalAssessmentText(summary.finalAssessment)}</dd></div>
            <div><dt>Recommended next lesson</dt><dd>{summary.nextLesson.title} (Module {summary.nextLesson.moduleNumber})</dd></div>
          </dl>

          <h3>Completion record</h3>
          <dl className="guardian-figures guardian-record" data-testid="guardian-record">
            <div><dt>Course</dt><dd>{summary.completion.courseTitle}</dd></div>
            <div><dt>Project</dt><dd>{summary.completion.projectTitle}</dd></div>
            <div><dt>Status</dt><dd>{summary.completion.status === "complete" ? "Complete" : "Still in progress"}</dd></div>
            <div><dt>Activities completed</dt><dd>{summary.completion.activities.completed} of {summary.completion.activities.required}</dd></div>
            <div><dt>Project versions saved</dt><dd>{summary.completion.modules.saved} of {summary.completion.modules.required}</dd></div>
            <div><dt>Final assessment</dt><dd>{summary.completion.finalAssessment.status === "passed" ? "Passed" : summary.completion.finalAssessment.status === "attempted" ? "Attempted, not passed yet" : "Not started"}</dd></div>
            {summary.completion.status === "complete" && summary.completion.completedAt
              ? <div><dt>Completed</dt><dd>{formatWhen(summary.completion.completedAt)}</dd></div>
              : null}
          </dl>

          <h3>Recent milestones</h3>
          {summary.milestones.length === 0 ? (
            <p className="guardian-quiet">No module version has been saved yet.</p>
          ) : (
            <ul className="guardian-milestones" data-testid="guardian-milestones">
              {summary.milestones.map((milestone) => (
                <li key={`${milestone.label}-${milestone.at}`}>
                  <span>{milestone.label}</span>
                  <small>{formatWhen(milestone.at)}</small>
                </li>
              ))}
            </ul>
          )}

          <h3>Modules</h3>
          <ul className="guardian-modules">
            {summary.modules.map((module) => (
              <li key={module.number}>
                <span>Module {module.number}. {module.title}</span>
                <small>{module.completed} of {module.total} activities, {module.masteryLabel}</small>
              </li>
            ))}
          </ul>

          <div className="guardian-concepts">
            <div>
              <h3>Needs another look</h3>
              {summary.needsReview.length === 0
                ? <p className="guardian-quiet">Nothing is waiting at the moment.</p>
                : <ul>{summary.needsReview.map((item) => <li key={item.focus}>{item.focus} <small>(Module {item.moduleNumber})</small></li>)}</ul>}
            </div>
            <div>
              <h3>Already strengthened</h3>
              {summary.strengthened.length === 0
                ? <p className="guardian-quiet">Nothing recalled yet.</p>
                : <ul>{summary.strengthened.map((item) => <li key={item.focus}>{item.focus}</li>)}</ul>}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
