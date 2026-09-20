import type { Metadata } from "next";
import { LearningApp } from "@/components/LearningApp";
import { course13to15 } from "@/lib/course-13-15";

export const metadata: Metadata = {
  title: "Ages 13 to 15 | KidyCode",
  description: "Build practical responsive websites with HTML, CSS and JavaScript.",
};

export default function Ages13To15LearnPage() {
  return <LearningApp course={course13to15} />;
}
