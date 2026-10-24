import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { courseCatalogue } from "@/lib/learning-experience";

export const metadata: Metadata = {
  title: "Course catalogue | KidyCode",
  description: "Every KidyCode pathway and programme, with what it teaches and how it is assessed.",
};

const provenanceLabel: Record<string, string> = {
  real: "Published pathway",
  demo: "Demonstration programme",
  pending: "Pending supervised pilot",
};

export default function CataloguePage() {
  const entries = courseCatalogue();
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Catalogue</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">COURSE CATALOGUE</p>
        <h1>What KidyCode teaches</h1>
        <p className="kc-lede">
          Four coding pathways, one standalone design course and one programme that moves the work out of the
          browser. Each entry is labelled with how far it has been run, so a learner, a guardian or a school can
          see what is published and what is still being proved.
        </p>
      </header>
      <ExperienceNav current="/catalogue" />
      <ul className="kc-cards">
        {entries.map((entry) => (
          <li key={entry.id} className="kc-card">
            <div className="kc-card-top">
              <h2>{entry.title}</h2>
              <span className={`kc-badge kc-badge-${entry.provenance}`}>{provenanceLabel[entry.provenance]}</span>
            </div>
            <dl className="kc-facts">
              <div><dt>For</dt><dd>{entry.ageRange}</dd></div>
              <div><dt>Units</dt><dd>{entry.units}</dd></div>
              <div><dt>Activities</dt><dd>{entry.lessons}</dd></div>
              <div><dt>Time</dt><dd>{entry.estimatedHours}</dd></div>
            </dl>
            <p className="kc-note">{entry.provenanceNote}</p>
            <p className="kc-req"><strong>To complete:</strong> {entry.requirement}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
