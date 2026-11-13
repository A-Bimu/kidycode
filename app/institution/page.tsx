import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { PilotWorkspacePanel } from "@/components/PilotWorkspacePanel";
import { institutionRoles } from "@/lib/institution-roles";

export const metadata: Metadata = {
  title: "Institution pilot workspace | KidyCode",
  description: "The supervised workspace where a school or programme sees its cohorts, rosters and academic reviews.",
};

const roleSummary: Record<string, string> = {
  organisation_admin: "Manages the organisation and its members. Does not enrol learners and never reads learner code.",
  programme_coordinator: "Creates cohorts and enrols learners across the organisation.",
  cohort_lead: "Enrols learners and reads their work inside the cohorts they lead.",
  instructor: "Reads rosters, progress, evidence and learner code inside their own cohorts only.",
  academic_reviewer: "Decides an academic review from evidence, and never reads learner code or a learner identity.",
};

export default function InstitutionPage() {
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Pilot workspace</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">INSTITUTION PILOT WORKSPACE</p>
        <h1>One workspace, five roles, one boundary</h1>
        <p className="kc-lede">
          A school or programme signs in with the same platform identity it already uses. There is no second account.
          What this screen shows is decided on the server by the same permission table the whole platform uses, so a
          role can never reach beyond the cohorts and the organisation it belongs to.
        </p>
      </header>
      <ExperienceNav current="/institution" />
      <p className="kc-banner kc-banner-pending" role="status">
        Pilot: this workspace runs with real cohorts only in a controlled beta, never with a live school register.
      </p>
      <PilotWorkspacePanel />
      <section className="kc-section">
        <h2>The five roles</h2>
        <dl className="kc-facts kc-facts-wide">
          {institutionRoles.map((role) => (
            <div key={role}>
              <dt>{role.replace(/_/g, " ")}</dt>
              <dd>{roleSummary[role]}</dd>
            </div>
          ))}
        </dl>
        <p className="kc-note">
          No role crosses an organisation, a reviewer never reads a learner identity or learner code, and no role issues
          a certificate from inside a review.
        </p>
      </section>
    </main>
  );
}
