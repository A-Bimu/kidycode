import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { codingCourseIds, notesLibrary } from "@/lib/learning-experience";
import { courses } from "@/lib/course-catalog";

export const metadata: Metadata = {
  title: "Notes Library | KidyCode",
  description: "The written reasoning behind every lesson, grouped by module, for all four coding pathways.",
};

export default function NotesPage() {
  const libraries = codingCourseIds.map(notesLibrary);
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Notes Library</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">NOTES LIBRARY</p>
        <h1>Read the reasoning again</h1>
        <p className="kc-lede">
          Every lesson explains one idea and why it matters. This library gathers those explanations by module so you
          can go over the thinking without replaying the activity. {libraries.reduce((total, library) => total + library.noteCount, 0)} notes across the four
          pathways, and {libraries.reduce((total, library) => total + library.termCount, 0)} terms to know.
        </p>
      </header>
      <p className="kc-banner" role="status">
        Real course content: these are the published KidyCode pathways explaining their own lessons, not sample copy.
      </p>
      <ExperienceNav current="/notes" />
      {libraries.map((library) => (
        <section key={library.courseId} className="kc-section">
          <h2>
            {library.title} <span className="kc-muted">({library.ageRange})</span>
          </h2>
          {library.sections.map((section) => (
            <details key={section.stageId} className="kc-details" open={section.number === 1}>
              <summary>
                Module {section.number}: {section.title}
              </summary>
              <p className="kc-note">{section.outcome}</p>
              {section.notes.map((note) => (
                <article key={note.lessonId} className="kc-note-card">
                  <h3>
                    {note.title} <span className="kc-muted">{note.language}, {note.minutes} minutes</span>
                  </h3>
                  <p className="kc-objective">{note.objective}</p>
                  {note.notes.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  {note.keyTerms.length > 0 ? (
                    <p className="kc-terms">
                      <strong>Words to know:</strong> {note.keyTerms.join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </details>
          ))}
        </section>
      ))}
      <p className="kc-foot">
        {courses["ages-10-12"].courseFacts.title} and the three pathways beside it are the published KidyCode courses.
        The notes shown here are the courses&apos; own explanations and change only when the course changes.
      </p>
    </main>
  );
}
