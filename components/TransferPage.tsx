"use client";

import Link from "next/link";
import { useState } from "react";

/*
 * The new device.
 *
 * Nothing here is trusted until the server has claimed the code and answered with
 * its own cookie. The page only ever sends the code, and the reply tells it which
 * course to open.
 */

type Failure = { state: "idle" | "working" | "ok" | "problem"; message: string };

export default function TransferPage() {
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<Failure>({ state: "idle", message: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFailure({ state: "working", message: "" });
    try {
      const response = await fetch("/api/transfer/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { coursePath?: string; nickname?: string; error?: string };
      if (!response.ok || !data.coursePath) {
        setFailure({ state: "problem", message: data.error || "That code could not be used. Ask for a new one." });
        return;
      }
      setFailure({ state: "ok", message: `You are in. Opening your saved course now, ${data.nickname}.` });
      window.location.assign(data.coursePath);
    } catch {
      setFailure({ state: "problem", message: "The transfer could not be completed right now. Your code is still valid, so please try again." });
    }
  }

  return (
    <main className="transfer-page">
      <Link className="course-brand" href="/"><span>K</span><b>KidyCode</b></Link>
      <section>
        <p className="kicker">MOVE TO THIS DEVICE</p>
        <h1>Continue on this device</h1>
        <p>
          On the device that already has your course open, go to My progress and choose Move to another device. It
          shows a code that lasts ten minutes and works once.
        </p>
        <form className="transfer-form" onSubmit={(event) => void submit(event)}>
          <label htmlFor="transfer-code-input">Transfer code</label>
          <input
            id="transfer-code-input"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            required
          />
          <button className="primary-button" type="submit" disabled={failure.state === "working" || code.trim().length < 4}>
            {failure.state === "working" ? "Moving..." : "Move my course here"}
          </button>
        </form>

        <h2>What happens next</h2>
        <ul className="transfer-facts">
          <li>Your existing course, lessons and saved progress open on this device.</li>
          <li>The device that made the code is signed out of the learner profile.</li>
          <li>Nothing is deleted and no new profile is created.</li>
        </ul>

        {failure.state === "problem" ? <p className="form-message is-error" role="alert">{failure.message}</p> : null}
        {failure.state === "ok" ? <p className="form-message" role="status" aria-live="polite">{failure.message}</p> : null}

        <h2>If you cannot open the old device</h2>
        <p className="transfer-help">
          A transfer code has to be created on a device that is already signed in, or by a grown-up who is connected to
          the learner profile. If neither is possible, KidyCode cannot restore the profile automatically, so a new
          profile is the only option. There is no other way in, by design.
        </p>
      </section>
    </main>
  );
}
