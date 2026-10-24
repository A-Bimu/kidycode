import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { codingCourseIds, practiceLab } from "@/lib/learning-experience";

export const metadata: Metadata = {
  title: "Practice Lab | KidyCode",
  description: "Work through the coding tasks and hints from every pathway, without the answer.",
};

export default function PracticePage() {
  const labs = codingCourseIds.map(practiceLab);
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Practice Lab</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">PRACTICE LAB</p>
        <h1>Work it out yourself</h1>
        <p className="kc-lede">
          Each card gives you the task, the automatic requirements your code will be checked against and three hints.
          The answer is not here on purpose: you find it by running your code and reading what the page does.
        </p>
      </header>
      <p className="kc-banner" role="status">
        Real course content: every task below comes from a published KidyCode lesson, and its requirements are the same
        automatic checks the course itself uses.
      </p>
      <ExperienceNav current="/practice" />
      {labs.map((lab) => (
        <section key={lab.courseId} className="kc-section">
          <h2>
            {lab.title} <span className="kc-muted">({lab.ageRange}, {lab.requirementCount} requirements)</span>
          </h2>
          <ul className="kc-cards">
            {lab.cards.map((card) => (
              <li key={card.lessonId} className="kc-card">
                <div className="kc-card-top">
                  <h3>{card.title}</h3>
                  <span className="kc-badge">{card.language}</span>
                </div>
                <p>{card.task}</p>
                <p className="kc-note">
                  <strong>Edit:</strong> {card.editableFiles.length > 0 ? card.editableFiles.join(", ") : "follow the task"}
                </p>
                <details className="kc-details">
                  <summary>Requirements ({card.requirements.length})</summary>
                  <ul>
                    {card.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </details>
                <details className="kc-details">
                  <summary>Hints</summary>
                  <ol>
                    {card.hints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ol>
                  {card.hasCheck ? <p className="kc-muted">This lesson has a quick check inside the course.</p> : null}
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
