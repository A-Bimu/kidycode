import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { curriculumMap } from "@/lib/curriculum-map";
import { codingCourseIds } from "@/lib/learning-experience";
import { skillsEvidenceRecord } from "@/lib/skills-evidence";
import { certificateWording } from "@/lib/certificate-language";

export const metadata: Metadata = {
  title: "Curriculum map and evidence | KidyCode",
  description: "Every pathway, the evidence it produces, the Skills Evidence Record and the pending certificate wording.",
};

export default function CurriculumPage() {
  const map = curriculumMap();
  const records = codingCourseIds.map(skillsEvidenceRecord);
  const wordings = codingCourseIds.map(certificateWording);

  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Curriculum and evidence</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">CURRICULUM MAP</p>
        <h1>What is taught, and the evidence it leaves</h1>
        <p className="kc-lede">
          {map.totals.pathways} pathways and programmes, {map.totals.units} units and {map.totals.activities} activities.
          Each pathway is derived from the course itself, so this map changes only when the course does.
        </p>
      </header>
      <ExperienceNav current="/curriculum" />

      <section className="kc-section">
        <h2>The map</h2>
        {map.pathways.map((pathway) => (
          <details key={pathway.id} className="kc-details">
            <summary>
              {pathway.title} <span className="kc-muted">({pathway.ageRange})</span>
            </summary>
            <p className="kc-muted">Provenance: {pathway.provenance}</p>
            <table className="kc-table">
              <thead>
                <tr><th>Unit</th><th>Outcome</th><th>Activities</th></tr>
              </thead>
              <tbody>
                {pathway.units.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.number}. {unit.title}</td>
                    <td>{unit.outcome}</td>
                    <td>{unit.activities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="kc-note"><strong>Project:</strong> {pathway.project}</p>
            <p className="kc-note"><strong>Assessment:</strong> {pathway.assessment}</p>
            {pathway.transfer ? (
              <p className="kc-note">
                <strong>Transfer:</strong> {pathway.transfer.title} ({pathway.transfer.projects.join(", ")}). Evidence:
                {" "}{pathway.transfer.evidence.join(", ")}.
              </p>
            ) : null}
          </details>
        ))}
      </section>

      <section className="kc-section">
        <h2>Gates</h2>
        <dl className="kc-facts kc-facts-wide">
          {map.gates.map((gate) => (
            <div key={gate.label}>
              <dt>{gate.label}</dt>
              <dd>{gate.statement}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="kc-section">
        <h2>Skills Evidence Record</h2>
        <p className="kc-note">
          A completion record says a course was finished. A Skills Evidence Record says what the learner can do and on
          what evidence. Every entry names its source and its provenance, and the record never asserts accreditation.
        </p>
        {records.map((record) => (
          <details key={record.courseId} className="kc-details">
            <summary>
              {record.courseTitle} <span className="kc-muted">({record.ageRange})</span>
            </summary>
            <p className="kc-muted">{record.technologies}</p>
            <ul className="kc-evidence">
              {record.entries.map((entry) => (
                <li key={entry.kind} className="kc-evidence-item">
                  <div className="kc-card-top">
                    <strong>{entry.label}</strong>
                    <span className={`kc-badge kc-badge-${entry.provenance}`}>{entry.provenance}</span>
                  </div>
                  <p>{entry.statement}</p>
                  <p className="kc-muted">Source: {entry.source}</p>
                </li>
              ))}
            </ul>
            <p className="kc-req">{record.certificateRelationship}</p>
          </details>
        ))}
      </section>

      <section className="kc-section">
        <h2>Pending-approval certificate wording</h2>
        <p className="kc-note">
          A certificate is a claim made in KidyCode&apos;s name. The wording below is held in its pending state until a
          written approval exists, and no co-branding is used before then.
        </p>
        {wordings.map((wording) => (
          <details key={wording.courseId} className="kc-details">
            <summary>
              {wording.provisionalTitle} <span className="kc-badge kc-badge-pending">{wording.status}</span>
            </summary>
            <p><strong>It will state:</strong></p>
            <ul>
              {wording.asserts.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <p><strong>It will never state:</strong></p>
            <ul>
              {wording.withholds.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <p className="kc-muted">Approval required by: {wording.approvalRequiredBy}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
