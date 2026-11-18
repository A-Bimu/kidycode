import type { ProjectChoice } from "@/lib/course";
import { buildPathwayCourse } from "@/lib/pathway-course";

const projectChoices: ProjectChoice[] = [
  {
    id: "interest",
    title: "Personal Portfolio",
    pitch: "Present your interests, skills and selected work in a clear personal website.",
    siteTitle: "My Portfolio",
    intro: "A focused introduction to the skills and ideas I am developing.",
    items: ["About me", "Selected work", "What I am learning"],
  },
  {
    id: "club",
    title: "Community Event Hub",
    pitch: "Help people understand an event, its programme and how to take part.",
    siteTitle: "Community Event Hub",
    intro: "Useful information for everyone planning to attend or contribute.",
    items: ["Event overview", "Programme", "How to take part"],
  },
  {
    id: "magazine",
    title: "Small Business Website",
    pitch: "Create a trustworthy website for a fictional local service or shop.",
    siteTitle: "Local Business",
    intro: "Clear information about a useful service and how customers can enquire.",
    items: ["Our services", "How it works", "Send an enquiry"],
  },
];

export const course13to15 = buildPathwayCourse({
  id: "ages-13-15",
  title: "Practical Web Development",
  ageRange: "Ages 13 to 15",
  ages: [13, 14, 15],
  estimatedHours: "24 to 30 hours",
  audience: "a learner aged 13 to 15",
  advanced: false,
  projectChoices,
});
