"use client";

import { useState } from "react";
import Link from "next/link";

type Mode = "email" | "code";

export default function AdultLoginPage() {
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    if (!isAdult) { setError("This sign-in is for grown-ups aged 18 or older."); return; }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/adult-auth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, adultConfirmation: true }),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "The email could not be sent.");
      setMode("code");
      setMessage(data.message || "Check your email for the one-time code.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The email could not be sent.");
    } finally { setWorking(false); }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/adult-auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, token: code }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "The code could not be verified.");
      window.location.assign("/guardian");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The code could not be verified.");
    } finally { setWorking(false); }
  }

  return (
    <main className="guardian-page">
      <section className="guardian-head" style={{ maxWidth: "560px", margin: "0 auto", paddingBlock: "5rem" }}>
        <p className="kicker">KIDYCODE GROWN-UPS</p>
        <h1>Sign in to follow their progress</h1>
        <p className="guardian-lede">This secure sign-in is for parents, guardians and educators. Children use their own learner access.</p>

        <form onSubmit={mode === "email" ? requestCode : verifyCode} style={{ display: "grid", gap: "1rem", marginBlock: "2rem" }}>
          <label htmlFor="adult-email">Your email address</label>
          <input
            id="adult-email" name="email" type="email" required autoComplete="email"
            value={email} onChange={event => setEmail(event.target.value)}
            disabled={working || mode === "code"} maxLength={254}
            placeholder="you@example.com"
          />
          {mode === "email" ? (
            <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <input type="checkbox" checked={isAdult} onChange={event => setIsAdult(event.target.checked)} required />
              <span>I am 18 or older and I am signing in as a grown-up. I understand that this declaration does not itself verify guardianship.</span>
            </label>
          ) : (
            <>
              <label htmlFor="adult-code">One-time email code</label>
              <input
                id="adult-code" name="code" inputMode="numeric" autoComplete="one-time-code"
                pattern="[0-9]{6,8}" maxLength={8} required
                value={code} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="6-digit code" disabled={working}
              />
            </>
          )}
          {message && <p role="status" className="guardian-quiet">{message}</p>}
          {error && <p role="alert" className="guardian-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={working || (mode === "email" && !isAdult) || (mode === "code" && code.length < 6)}>
            {working ? "Checking..." : mode === "email" ? "Send my sign-in code" : "Verify and continue"}
          </button>
          {mode === "code" && <button className="text-button" type="button" onClick={() => {setMode("email");setCode("");setError("");setMessage("");}}>Use a different email or request a new code</button>}
        </form>

        <p className="guardian-quiet">Only connect a learner you are authorized to support. Signing in does not grant access to any learner automatically.</p>
        <Link href="/guardian" className="text-button">Back to grown-up dashboard</Link>
      </section>
    </main>
  );
}
