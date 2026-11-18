import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceNav } from "@/components/ExperienceNav";
import { buildOutside } from "@/lib/build-outside";

export const metadata: Metadata = {
  title: "Build Outside KidyCode | KidyCode",
  description: "Six supervised stations that move a page into real files, an editor, developer tools, Git, GitHub and a published link.",
};

export default function BuildOutsidePage() {
  return (
    <main className="kc-page">
      <nav aria-label="Breadcrumb" className="kc-crumb">
        <Link href="/">KidyCode</Link>
        <span>/</span>
        <span>Build Outside</span>
      </nav>
      <header className="kc-head">
        <p className="kicker">BUILD OUTSIDE KIDYCODE</p>
        <h1>From the browser to the real tools</h1>
        <p className="kc-lede">{buildOutside.promise}</p>
      </header>
      <p className="kc-banner kc-banner-pending" role="status">
        Pending supervised pilot: the account and publishing stations run only with guardian consent.
      </p>
      <ExperienceNav current="/build-outside" />
      <ol className="kc-stations">
        {buildOutside.stations.map((station) => (
          <li key={station.id} className="kc-card">
            <div className="kc-card-top">
              <h2>
                {station.order}. {station.title}
              </h2>
              <span className="kc-badge">{station.tool}</span>
            </div>
            <p>{station.why}</p>
            <ol>
              {station.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="kc-note"><strong>Practice:</strong> {station.practice}</p>
            <p className="kc-req"><strong>Check:</strong> {station.check}</p>
            <p className="kc-safety"><strong>Safety:</strong> {station.safety}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
