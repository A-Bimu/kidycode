"use client";

import { useCallback, useEffect, useState } from "react";

/*
 * Grown-up access, on the learner's own progress page.
 *
 * A learner creates a one-time code and shows it to a grown-up they trust. The
 * code works once, expires after ten minutes, and a new code cancels any unused
 * one. The learner can also end a connection at any time.
 */

type Connection = {
  linkRef: string;
  guardianName: string;
  guardianEmailMasked: string;
  connectedAt: string;
};

type ConnectionsPayload = {
  connections: Connection[];
  pendingCode: { expiresAt: string } | null;
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function GrownUpAccess({ enabled }: { enabled: boolean }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [issuedCode, setIssuedCode] = useState("");
  const [pendingExpiry, setPendingExpiry] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/guardian/connections", { cache: "no-store" });
      const data = await response.json() as ConnectionsPayload & { error?: string };
      if (!response.ok) throw new Error(data.error || "This area could not be opened.");
      setConnections(data.connections || []);
      setPendingExpiry(data.pendingCode?.expiresAt || null);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This area could not be opened.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    async function open() {
      await load();
      if (!active) return;
    }
    void open();
    return () => { active = false; };
  }, [enabled, load]);

  async function createCode() {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/guardian/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await response.json() as { issuedCode?: string; pendingCode?: { expiresAt: string }; connections?: Connection[]; error?: string };
      if (!response.ok || !data.issuedCode) throw new Error(data.error || "A code could not be created.");
      setIssuedCode(data.issuedCode);
      setPendingExpiry(data.pendingCode?.expiresAt || null);
      setConnections(data.connections || []);
      setStatus(`New code created. It stops working at ${formatWhen(data.pendingCode?.expiresAt || "")}.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "A code could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(linkRef: string, name: string) {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/guardian/connections", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "revoke", linkRef }),
      });
      const data = await response.json() as { connections?: Connection[]; error?: string };
      if (!response.ok) throw new Error(data.error || "That connection could not be ended.");
      setConnections(data.connections || []);
      setStatus(`${name} can no longer see your progress.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That connection could not be ended.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <section className="grownup" aria-labelledby="grownup-heading">
      <h2 id="grownup-heading">Grown-up access</h2>
      <p className="grownup-lede">
        A grown-up you trust can follow your progress if you give them a code. They see your progress only,
        never your code and never your answers. You can end their access whenever you want.
      </p>

      {loading && <p className="progress-quiet">Opening grown-up access...</p>}

      {!loading && error && (
        <div className="grownup-error" role="alert">
          <p>{error}</p>
          <button className="outline-button" type="button" onClick={() => void load()}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grownup-code">
            <div>
              <h3>{issuedCode ? "Your connection code" : pendingExpiry ? "You have a code waiting" : "Connect a grown-up"}</h3>
              {issuedCode
                ? (
                  <p className="grownup-code-value" aria-label={`Connection code ${issuedCode}`}>{issuedCode}</p>
                )
                : (
                  <p className="progress-quiet">
                    {pendingExpiry
                      ? `A code is ready and stops working at ${formatWhen(pendingExpiry)}. Create a new one to replace it.`
                      : "Create a code, then show it to the grown-up in person."}
                  </p>
                )}
              {issuedCode && (
                <p className="grownup-note">
                  Show this to your grown-up now. It works once, stops working at {formatWhen(pendingExpiry || "")},
                  and never appears again.
                </p>
              )}
            </div>
            <button className="primary-button" type="button" disabled={busy} onClick={() => void createCode()}>
              {busy ? "Working..." : issuedCode || pendingExpiry ? "Create a new code" : "Create a code"}
            </button>
          </div>

          <div className="grownup-connected">
            <h3>Connected grown-ups</h3>
            {connections.length === 0
              ? <p className="progress-quiet">Nobody is connected yet.</p>
              : (
                <ul>
                  {connections.map((connection) => (
                    <li key={connection.linkRef}>
                      <div>
                        <b>{connection.guardianName}</b>
                        <small>{connection.guardianEmailMasked}, connected {formatWhen(connection.connectedAt)}</small>
                      </div>
                      <button
                        className="outline-button"
                        type="button"
                        disabled={busy}
                        onClick={() => void revoke(connection.linkRef, connection.guardianName)}
                      >
                        End access
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </>
      )}

      <p className="grownup-status" aria-live="polite">{status}</p>
    </section>
  );
}