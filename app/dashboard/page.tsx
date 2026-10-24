import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { codingCourseIds, learnerDashboard } from "@/lib/learning-experience";
import { courses } from "@/lib/course-catalog";

export const metadata: Metadata = {
  title: "Learning dashboard | KidyCode",
  description: "Where you are, what is next and where to go, for every KidyCode pathway.",
};

export default function DashboardPage() {
  const dashboards = codingCourseIds.map((courseId) =>
    learnerDashboard(courseId, {
      theme: courses[courseId].projectChoices[0]?.id || "interest",
      completedLessons: new Map<string, string>(),
      savedModules: new Map<string, string>(),
      exams: [],
    }),
  );

  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Dashboard</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">LEARNING DASHBOARD</p>
        <h1>Where you are, and what is next</h1>
        <p className="kc-lede">
          Each panel reads the same completion calculation the portfolio and the guardian summary use, so the three can
          never disagree. The figures below are a demonstration with no saved work, labelled so nobody mistakes them for
          a real learner.
        </p>
      </header>
      <p className="kc-banner kc-banner-demo" role="status">
        Demonstration data: no learner work is saved on this screen.
      </p>
      <ExperienceNav current="/dashboard" />
      <ul className="kc-cards">
        {dashboards.map((dashboard) => (
          <li key={dashboard.courseId} className="kc-card">
            <div className="kc-card-top">
              <h2>{dashboard.courseTitle}</h2>
              <span className="kc-badge">{dashboard.status}</span>
            </div>
            <p className="kc-muted">{dashboard.ageRange}</p>
            <dl className="kc-facts">
              <div><dt>Activities</dt><dd>{dashboard.activities.completed} / {dashboard.activities.required}</dd></div>
              <div><dt>Project versions</dt><dd>{dashboard.modules.saved} / {dashboard.modules.required}</dd></div>
            </dl>
            {dashboard.nextRequirement ? (
              <p className="kc-req"><strong>Next:</strong> {dashboard.nextRequirement.label}</p>
            ) : (
              <p className="kc-req"><strong>Complete:</strong> every requirement is met.</p>
            )}
            {dashboard.continueLesson ? (
              <p className="kc-note">
                Start with <strong>{dashboard.continueLesson.title}</strong>: {dashboard.continueLesson.objective}
              </p>
            ) : null}
            <ul className="kc-links">
              {dashboard.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                  <span className="kc-muted"> {link.reason}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
