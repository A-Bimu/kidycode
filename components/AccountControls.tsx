"use client";

import Link from "next/link";
import { useState } from "react";

/*
 * Leaving a device, and deleting a profile.
 *
 * These are two different operations and the wording keeps them apart. Clearing this
 * device signs the learner out and keeps every piece of saved work. Deleting the
 * profile removes everything and cannot be undone, so it sits behind a second step
 * that states exactly what goes.
 */

type Step = "idle" | "clear" | "delete";

export default function AccountControls() {
  const [step, setStep] = useState<Step>("idle");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function clearDevice() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/learners", { method: "DELETE" });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "This device could not be signed out right now.");
      setStatus(data.message || "This device is signed out.");
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This device could not be signed out right now.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/learner", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "delete my profile" }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "The profile could not be deleted right now.");
      setStatus(data.message || "This profile has been deleted.");
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The profile could not be deleted right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-section" aria-labelledby="account-heading">
      <h2 id="account-heading">Your account and your data</h2>
      <p>
        You can sign out of this device without losing anything, or delete everything permanently. What KidyCode saves,
        and what a connected grown-up can see, is explained in{" "}
        <Link href="/privacy">Privacy and grown-ups</Link>.
      </p>

      <div className="account-actions">
        <button className="outline-button" type="button" onClick={() => setStep(step === "clear" ? "idle" : "clear")} disabled={busy} data-testid="clear-device">
          Clear this device
        </button>
        <button className="outline-button is-destructive" type="button" onClick={() => setStep(step === "delete" ? "idle" : "delete")} disabled={busy} data-testid="delete-profile">
          Delete my profile permanently
        </button>
      </div>

      {step === "clear" && (
        <div className="account-panel" role="group" aria-labelledby="clear-heading">
          <h3 id="clear-heading">Clear this device</h3>
          <p>
            This signs you out of the browser you are using. Nothing is deleted: your activities, your saved project
            versions and your final assessment all stay saved.
          </p>
          <p>
            To open the same course again, use <b>Move to another device</b> above to make a transfer code first, or ask
            a connected grown-up to make one for you. Without a code and without a connected grown-up, KidyCode cannot
            open the profile again.
          </p>
          <div className="account-confirm">
            <button className="primary-button" type="button" onClick={() => void clearDevice()} disabled={busy} data-testid="clear-device-confirm">
              {busy ? "Signing out..." : "Yes, sign out of this device"}
            </button>
            <button className="text-button" type="button" onClick={() => setStep("idle")} disabled={busy}>
              Keep me signed in
            </button>
          </div>
        </div>
      )}

      {step === "delete" && (
        <div className="account-panel is-destructive" role="group" aria-labelledby="delete-heading">
          <h3 id="delete-heading">Delete this profile permanently</h3>
          <p>This removes everything, for good. It cannot be undone, and KidyCode will not create a new profile for you.</p>
          <ul>
            <li>your nickname, age, chosen project and course</li>
            <li>every activity you completed and when you completed it</li>
            <li>all eight saved project versions and the reflections written with them</li>
            <li>your final assessment attempts, answers and repaired code</li>
            <li>the tutor evidence, including concepts that needed another look</li>
            <li>every grown-up connection, connection code and transfer code</li>
          </ul>
          <p>After this, a connected grown-up can no longer open your progress, and this device is signed out.</p>
          <div className="account-confirm">
            <button className="danger-button" type="button" onClick={() => void deleteProfile()} disabled={busy} data-testid="delete-profile-confirm">
              {busy ? "Deleting..." : "Yes, delete everything permanently"}
            </button>
            <button className="text-button" type="button" onClick={() => setStep("idle")} disabled={busy}>
              Keep my profile
            </button>
          </div>
        </div>
      )}

      {error ? <p className="form-message is-error" role="alert">{error}</p> : null}
      <p className="account-status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
