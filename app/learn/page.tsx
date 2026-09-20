import type { Metadata } from "next";
import { LearningApp } from "@/components/LearningApp";
import { course10to12 } from "@/lib/course";

export const metadata: Metadata = {
  title: "Ages 10 to 12 | KidyCode",
  description: "Learn HTML, CSS and JavaScript by building one complete website.",
};

export default function LearnPage() {
  return <LearningApp course={course10to12} />;
}
