import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { designAgeBands, designCourseFor } from "@/lib/design-course";

export const metadata: Metadata = {
  title: "UI and UX Design | KidyCode",
  description: "A standalone design course in six modules: research, structure, interface, testing, systems and presenting.",
};

export default function DesignPage() {
  const base = designCourseFor("ages-13-15");
  const bands = designAgeBands.map((band) => designCourseFor(band));
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>UI and UX Design</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">UI AND UX DESIGN</p>
        <h1>Design the interface before the code</h1>
        <p className="kc-lede">
          A separate course with no code workspace and no code test. Six modules take a learner from who the design is
          for, through structure and interface, to testing, a design system and a short, honest presentation. Every
          module teaches the same idea and its wording adapts to the age band.
        </p>
      </header>
      <p className="kc-banner kc-banner-demo" role="status">
        Demonstration programme: the content is complete, but it has not yet run with a learner group.
      </p>
      <ExperienceNav current="/design" />
      <section className="kc-section">
        <h2>Age bands</h2>
        <ul className="kc-chips">
          {bands.map((band) => (
            <li key={band.adaptedFor}>
              <strong>{band.ageRange}</strong> <span className="kc-muted">{band.estimatedHours}</span>
            </li>
          ))}
        </ul>
      </section>
      {base.modules.map((module) => (
        <section key={module.id} className="kc-section">
          <h2>
            Module {module.number}: {module.title}
          </h2>
          <p className="kc-note">{module.outcome}</p>
          {module.lessons.map((lesson) => (
            <article key={lesson.id} className="kc-note-card">
              <h3>{lesson.title}</h3>
              <p className="kc-objective">{lesson.objective}</p>
              {lesson.notes.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <p className="kc-note"><strong>Do this:</strong> {lesson.activity}</p>
              <p className="kc-muted">Check: {lesson.check.prompt}</p>
            </article>
          ))}
          <p className="kc-req"><strong>Studio:</strong> {module.studio}</p>
        </section>
      ))}
    </main>
  );
}
