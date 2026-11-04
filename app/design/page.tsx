import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { DesignQuickCheck } from "@/components/DesignQuickCheck";
import { designAgeBands, designCourseFor, isDesignAgeBand, type DesignAgeBand } from "@/lib/design-course";

export const metadata: Metadata = {
  title: "UI and UX Design | KidyCode",
  description: "Learn design in six hands-on modules and practice in the KidyCode Design Studio.",
};

const chooseProject = (module: string, age: DesignAgeBand) => {
  if (age === "adults") return "portfolio";
  if (module === "people" || module === "interface") return "welcome";
  if (module === "system") return "logo";
  if (module === "present") return "welcome";
  return "login";
};

export default async function DesignPage({
  searchParams,
}: { searchParams: Promise<{ age?: string }> }) {
  const params = await searchParams;
  const age: DesignAgeBand = isDesignAgeBand(params.age ?? "") ? params.age as DesignAgeBand : "ages-10-12";
  const course = designCourseFor(age);
  const bands = designAgeBands.map(designCourseFor);
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>UI and UX Design</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">UI AND UX DESIGN</p>
        <h1>Learn to design, then try it yourself</h1>
        <p className="kc-lede">
          Start with a small idea, build real screens in KidyCode Design Studio, then improve what you made.
          You do not need to know how to code. Your learning activities are adapted to your pathway.
        </p>
      </header>
      <p className="kc-banner kc-banner-demo" role="status">
        Practice Studio is under development. Drafts are saved on this device, not to a learner account.
        The course has not yet completed supervised learner testing.
      </p>
      <ExperienceNav current="/design" />
      <section className="kc-section">
        <h2>Choose your learning pathway</h2>
        <ul className="kc-chips">
          {bands.map((band) => (
            <li key={band.adaptedFor}>
              <Link href={"/design?age=" + band.adaptedFor}
                aria-current={age === band.adaptedFor ? "page" : undefined}>
                <strong>{band.ageRange}</strong>
              </Link>
              <span className="kc-muted"> {band.estimatedHours}</span>
            </li>
          ))}
        </ul>
        <p className="kc-note"><strong>Selected:</strong> {course.ageRange}. Each lesson tells you what to make and gives you a way to practise in the Studio.</p>
        <Link href={"/studio?age=" + age + "&project=" + (age === "adults" ? "portfolio" : "welcome")}
          className="primary-button">Open my Design Studio</Link>
      </section>
      {course.modules.map((module) => (
        <section key={module.id} className="kc-section" id={module.id}>
          <h2>Module {module.number}: {module.title}</h2>
          <p className="kc-note">{module.outcome}</p>
          {module.lessons.map((lesson) => (
            <article key={lesson.id} className="kc-note-card">
              <h3>{lesson.title}</h3>
              <p className="kc-objective">{lesson.objective}</p>
              {lesson.notes.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              <p className="kc-note"><strong>Try this:</strong> {lesson.activity}</p>
              <DesignQuickCheck check={lesson.check} />
            </article>
          ))}
          <p className="kc-req"><strong>Your Studio project:</strong> {module.studio}</p>
          <Link href={"/studio?age=" + age + "&module=" + module.id + "&project=" + chooseProject(module.id, age)}
            className="primary-button">Practise this module in Design Studio</Link>
        </section>
      ))}
    </main>
  );
}
