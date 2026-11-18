import type { ProjectChoice } from "@/lib/course";
import { buildPathwayCourse } from "@/lib/pathway-course";

const projectChoices: ProjectChoice[] = [
  {
    id: "interest",
    title: "Revision Planner",
    pitch: "Build a useful planner that organises study topics and visible progress.",
    siteTitle: "Revision Planner",
    intro: "A practical place to organise topics, priorities and the next study session.",
    items: ["Current priorities", "Study resources", "Progress notes"],
  },
  {
    id: "club",
    title: "Opportunity Directory",
    pitch: "Organise courses, programmes or volunteer opportunities into a searchable resource.",
    siteTitle: "Opportunity Directory",
    intro: "A clear directory for comparing useful learning and community opportunities.",
    items: ["Latest opportunities", "Useful categories", "Application guidance"],
  },
  {
    id: "magazine",
    title: "Service Dashboard",
    pitch: "Create an interface that presents service records, status and visitor actions.",
    siteTitle: "Service Dashboard",
    intro: "A simple interface for finding information and completing a clear task.",
    items: ["Service records", "Current status", "Request support"],
  },
];

export const course16to18 = buildPathwayCourse({
  id: "ages-16-18",
  title: "Web Application Development",
  ageRange: "Ages 16 to 18",
  ages: [16, 17, 18],
  estimatedHours: "30 to 38 hours",
  audience: "a learner aged 16 to 18 preparing for further study or work",
  advanced: true,
  projectChoices,
});
