"use client";

import { useEffect, useState } from "react";

/*
 * Moving a learner profile to another device.
 *
 * A code is shown once, on the device that asked for it. It works for ten
 * minutes, it works once, and using it signs this device out, so the copy says all
 * three plainly before anything is created.
 */

type Pending = { expiresAt: string } | null;

function minutesLeft(expiresAt: string): number {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return remaining <= 0 ? 0 : Math.max(1, Math.ceil(remaining / 60_000));
}

export default function MoveToAnotherDevice() {
  const [pending, setPending] = useState<Pending>(null);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/transfer/codes", { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { pending: Pending };
        setPending(data.pending);
      } catch {
        /* A transfer code is never required to keep learning. */
      }
    })();
    return () => controller.abort();
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/transfer/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = (await response.json()) as { transfer?: { code: string; expiresAt: string }; error?: string };
      if (!response.ok || !data.transfer) throw new Error(data.error || "A transfer code could not be created right now.");
      setCode(data.transfer.code);
      setExpiresAt(data.transfer.expiresAt);
      setPending({ expiresAt: data.transfer.expiresAt });
      setStatus("Transfer code created. It works for ten minutes and it works once.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A transfer code could not be created right now.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Transfer code copied. Keep it until the other device has it.");
    } catch {
      setStatus("Select the code and copy it by hand.");
    }
  }

  async function cancel() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/transfer/codes", { method: "DELETE" });
      const data = (await response.json()) as { cancelled?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "The code could not be cancelled.");
      setCode("");
      setExpiresAt("");
      setPending(null);
      setStatus(data.cancelled ? "Transfer code cancelled." : "There was no unused code to cancel.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code could not be cancelled.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="transfer-section" aria-labelledby="transfer-heading">
      <h2 id="transfer-heading">Move to another device</h2>
      <p>
        Open KidyCode on the new device and enter a transfer code. Your lessons and saved progress stay exactly as they
        are, and this device is signed out as soon as the new one takes over.
      </p>
      <ul className="transfer-facts">
        <li>The code expires ten minutes after you create it.</li>
        <li>It can be used once.</li>
        <li>Using it signs this device out of the learner profile.</li>
        <li>Your lessons, projects and progress remain saved.</li>
      </ul>

      {code ? (
        <div className="transfer-code">
          <p className="transfer-code-label">Your transfer code</p>
          <p className="transfer-code-value" data-testid="transfer-code">{code}</p>
          <p className="transfer-code-expiry">
            {expiresAt ? `Expires in about ${minutesLeft(expiresAt)} minutes.` : "This code expires ten minutes after it was created."}
          </p>
          <div className="transfer-actions">
            <button className="primary-button" type="button" onClick={() => void copy()} disabled={busy}>Copy the code</button>
            <button className="outline-button" type="button" onClick={() => void generate()} disabled={busy}>Replace it</button>
            <button className="outline-button" type="button" onClick={() => void cancel()} disabled={busy}>Cancel it</button>
          </div>
        </div>
      ) : (
        <div className="transfer-actions">
          <button className="primary-button" type="button" onClick={() => void generate()} disabled={busy} data-testid="create-transfer-code">
            {busy ? "Creating..." : pending ? "Create a new transfer code" : "Create a transfer code"}
          </button>
        </div>
      )}

      {pending && !code ? <p className="transfer-note">You already have an unused code. Creating a new one cancels it.</p> : null}
      {error ? <p className="form-message is-error" role="alert">{error}</p> : null}
      <p className="transfer-status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
