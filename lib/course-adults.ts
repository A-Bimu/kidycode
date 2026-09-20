import type { ProjectChoice } from "@/lib/course";
import { buildPathwayCourse } from "@/lib/pathway-course";

const projectChoices: ProjectChoice[] = [
  {
    id: "interest",
    title: "Professional Portfolio",
    pitch: "Present your experience, services and selected work to future clients or employers.",
    siteTitle: "Professional Portfolio",
    intro: "A concise introduction to my work, capabilities and current direction.",
    items: ["Profile", "Selected work", "Contact details"],
  },
  {
    id: "club",
    title: "Organisation Website",
    pitch: "Explain a community organisation, its programmes and how people can participate.",
    siteTitle: "Community Organisation",
    intro: "Practical information about our purpose, programmes and participation options.",
    items: ["Our purpose", "Programmes", "Get involved"],
  },
  {
    id: "magazine",
    title: "Service Business Website",
    pitch: "Create a credible online home for a small business or independent service.",
    siteTitle: "Service Business",
    intro: "Straightforward information about the service, process and next steps.",
    items: ["Services", "Our process", "Request a quote"],
  },
];

export const adultCourse = buildPathwayCourse({
  id: "adults",
  title: "Web Skills for Work and Business",
  ageRange: "Adults",
  ages: [19],
  estimatedHours: "26 to 34 hours",
  audience: "an adult beginner learning for work, business or an independent project",
  advanced: false,
  projectChoices,
});
