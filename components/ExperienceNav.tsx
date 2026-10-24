import Link from "next/link";

/* The one navigation bar for the Day 2 experiences, so every screen can reach the others.
 * It is a server component with no state, and it carries no learner data. */
const links: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogue", label: "Courses" },
  { href: "/notes", label: "Notes Library" },
  { href: "/practice", label: "Practice Lab" },
  { href: "/design", label: "UI and UX Design" },
  { href: "/build-outside", label: "Build Outside" },
  { href: "/curriculum", label: "Curriculum map" },
  { href: "/institution", label: "Pilot workspace" },
];

export function ExperienceNav({ current }: { current?: string }) {
  return (
    <nav className="kc-nav" aria-label="KidyCode experiences">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={current === link.href ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
