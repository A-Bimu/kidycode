"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Certification, CertificationGate } from "@/lib/certification";
import type { SkillsPassport as Passport } from "@/lib/passport";

/*
 * The private Skills Passport and the printable certificate.
 *
 * The passport is learner-only and read-only: it shows what the recorded evidence already
 * supports, in plain language, and never invents a skill from a page visit. The certificate is
 * issued by the server, and the page can only ask for it. Nothing about the level, the date, the
 * credential id or the result is sent from here.
 *
 * The flow the learner walks is My progress, Skills Passport, Certificate, Print.
 */

type CertificationView = {
  certificateName: string;
  level: string | null;
  status: Certification["status"];
  statusLabel: string;
  eligible: boolean;
  gates: Array<{ id: string; label: string; met: boolean; detail: string }>;
  missing: Array<{ id: string; label: string; detail: string }>;
  nextAction: { label: string; detail: string };
};

type CertificateView = {
  credentialId: string;
  certificateName: string;
  level: string;
  courseTitle: string;
  projectTitle: string;
  learnerFirstName: string;
  issuedAt: string;
  skills: string[];
  statement: string;
};

type Payload = {
  certification: CertificationView;
  passport: Passport;
  certificate: CertificateView | null;
};

export function SkillsPassport({
  onBack,
  onOpenAssessment,
  onOpenNext,
}: {
  onBack: () => void;
  onOpenAssessment?: () => void;
  onOpenNext?: (lessonId: string) => void;
}) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [step, setStep] = useState<"passport" | "certificate">("passport");
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const response = await fetch("/api/certification", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as (Payload & { error?: string }) | null;
        if (cancelled) return;
        if (!response.ok || !data || !data.certification) {
          throw new Error(data?.error || "Your Skills Passport could not be read right now.");
        }
        setPayload(data);
        setError("");
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Your Skills Passport could not be read right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, loading]);

  /* Asking for the certificate is the only thing this page can do. The server decides whether
   * one may be issued, from evidence it already holds. */
  const issue = useCallback(async () => {
    setBusy(true);
    setNotice("Requesting your certificate...");
    try {
      const response = await fetch("/api/certification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "issue" }),
      });
      const data = (await response.json().catch(() => null)) as
        | { issued?: boolean; alreadyHeld?: boolean; certificate?: CertificateView; error?: string; certification?: { missing?: Array<{ label: string }> } }
        | null;
      if (response.ok && data?.certificate) {
        setPayload((current) => (current ? { ...current, certificate: data.certificate || null } : current));
        setNotice(data.alreadyHeld ? "This is your certificate, issued on the date shown." : "Your certificate is ready.");
        setStep("certificate");
        return;
      }
      setNotice(data?.error || "Your certificate is not ready yet. The list below shows what is still to do.");
    } catch {
      setNotice("Your certificate could not be requested right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="passport-page" aria-busy="true">
        <h1 ref={headingRef} tabIndex={-1}>Skills Passport</h1>
        <p className="passport-lede">Reading your recorded work...</p>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="passport-page">
        <h1 ref={headingRef} tabIndex={-1}>Skills Passport</h1>
        <p className="passport-lede" role="alert">{error || "Your Skills Passport could not be read right now."}</p>
        <div className="passport-actions">
          <button className="primary-button" type="button" onClick={() => { setLoading(true); setError(""); setReloadKey((count) => count + 1); }}>Try again</button>
          <button className="text-button" type="button" onClick={onBack}>Back to my progress</button>
        </div>
      </main>
    );
  }

  const { certification, passport, certificate } = payload;
  const demonstrated = passport.skills.filter((skill) => skill.status === "demonstrated");
  const remaining = passport.skills.filter((skill) => skill.status === "still-to-demonstrate");

  return (
    <main className="passport-page">
      <p className="kicker">{passport.level ? passport.level.toUpperCase() : "SKILLS"}</p>
      <h1 ref={headingRef} tabIndex={-1}>{step === "passport" ? "Skills Passport" : "Your certificate"}</h1>
      <p className="passport-lede" role="status">{notice}</p>

      {step === "passport" && (
        <>
          <section className="passport-status" aria-labelledby="passport-status-heading">
            <h2 id="passport-status-heading">{passport.certificateName}</h2>
            <dl className="passport-figures">
              <div>
                <dt>Certificate level</dt>
                <dd>{passport.level || "Not available for this course"}</dd>
              </div>
              <div>
                <dt>Certification</dt>
                <dd>{passport.certificationLabel}</dd>
              </div>
              <div>
                <dt>Course</dt>
                <dd>{passport.courseCompletion.label}{passport.courseCompletion.completedAt ? ` on ${dateText(passport.courseCompletion.completedAt)}` : ""}</dd>
              </div>
              <div>
                <dt>Project</dt>
                <dd>{passport.projectTitle}</dd>
              </div>
              <div>
                <dt>Assessment</dt>
                <dd>{passport.assessment.label}. {passport.assessment.detail}</dd>
              </div>
              <div>
                <dt>Code defence</dt>
                <dd>{passport.defence.label}. {passport.defence.detail}</dd>
              </div>
              {passport.issuedAt && (
                <div>
                  <dt>Certificate issued</dt>
                  <dd>{dateText(passport.issuedAt)}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="passport-skills" aria-labelledby="passport-skills-heading">
            <h2 id="passport-skills-heading">Skills demonstrated</h2>
            {demonstrated.length === 0 ? (
              <p>No skill is demonstrated yet. Everything below appears as you complete your work.</p>
            ) : (
              <ul>
                {demonstrated.map((skill) => (
                  <li key={skill.name}>
                    <b>{skill.name}: Demonstrated.</b> {skill.evidence}
                    {skill.sources.length > 0 && (
                      <span className="passport-evidence"> Evidence: {skill.sources.map((source) => source.label).join("; ")}.</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {remaining.length > 0 && (
              <>
                <h3>Still to demonstrate</h3>
                <ul>
                  {remaining.map((skill) => (
                    <li key={skill.name}>
                      <b>{skill.name}: Still to demonstrate.</b> {skill.evidence}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {certification.eligible ? (
            <section className="passport-actions" aria-labelledby="passport-ready-heading">
              <h2 id="passport-ready-heading">Your certificate is ready</h2>
              <p>{certification.nextAction.detail}</p>
              <div className="passport-buttons">
                <button className="primary-button" type="button" disabled={busy} onClick={() => void issue()}>
                  {busy ? "Preparing..." : certificate ? "Open my certificate" : "Get my certificate"}
                </button>
                <button className="text-button" type="button" onClick={onBack}>Back to my progress</button>
              </div>
            </section>
          ) : (
            <section className="passport-actions" aria-labelledby="passport-remaining-heading">
              <h2 id="passport-remaining-heading">What is still to do</h2>
              <ul className="passport-remaining">
                {certification.missing.map((gate) => (
                  <li key={gate.id}><b>{gate.label}</b> {gate.detail}</li>
                ))}
              </ul>
              <p>Next: <b>{certification.nextAction.label}</b>. {certification.nextAction.detail}</p>
              <div className="passport-buttons">
                {onOpenAssessment && (
                  <button className="primary-button" type="button" onClick={onOpenAssessment}>{certification.nextAction.label}</button>
                )}
                {onOpenNext && certification.nextAction.label === "Finish the course" && (
                  <button className="primary-button" type="button" onClick={() => onOpenNext("")}>Open my course</button>
                )}
                <button className="text-button" type="button" onClick={onBack}>Back to my progress</button>
              </div>
            </section>
          )}
        </>
      )}

      {step === "certificate" && (
        <>
          {certificate ? (
            <>
              <section className="certificate-sheet" aria-labelledby="certificate-heading">
                <p className="certificate-brand">KidyCode</p>
                <h2 id="certificate-heading">{certificate.certificateName}</h2>
                <p className="certificate-name">{certificate.learnerFirstName}</p>
                <p className="certificate-course">Course: {certificate.courseTitle}</p>
                <p className="certificate-level">Level: {certificate.level}</p>
                <p className="certificate-project">Project: {certificate.projectTitle}</p>
                <h3>Skills demonstrated</h3>
                <ul className="certificate-skills">
                  {certificate.skills.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
                <p className="certificate-statement">{certificate.statement}</p>
                <p className="certificate-meta">Issued {dateText(certificate.issuedAt)}. Private credential ID {certificate.credentialId}.</p>
              </section>
              <div className="passport-buttons no-print">
                <button className="primary-button" type="button" onClick={() => window.print()}>Print my certificate</button>
                <button className="text-button" type="button" onClick={() => setStep("passport")}>Back to my Skills Passport</button>
                <button className="text-button" type="button" onClick={onBack}>Back to my progress</button>
              </div>
            </>
          ) : (
            <section className="passport-actions">
              <h2>No certificate yet</h2>
              <p>Your certificate is issued once every requirement above is met. Nothing is lost, and your work is kept.</p>
              <div className="passport-buttons">
                {certification.eligible && (
                  <button className="primary-button" type="button" disabled={busy} onClick={() => void issue()}>
                    {busy ? "Preparing..." : "Get my certificate"}
                  </button>
                )}
                <button className="text-button" type="button" onClick={() => setStep("passport")}>Back to my Skills Passport</button>
              </div>
            </section>
          )}
        </>
      )}

      {step === "passport" && certificate && (
        <div className="passport-buttons">
          <button className="text-button" type="button" onClick={() => setStep("certificate")}>Open my certificate</button>
        </div>
      )}
    </main>
  );
}

/* A plain date. The learner reads a day, not a database timestamp. */
function dateText(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "an earlier date";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export type { CertificationGate };