import type { Metadata } from "next";
import { LearningApp } from "@/components/LearningApp";
import { course16to18 } from "@/lib/course-16-18";

export const metadata: Metadata = {
  title: "Ages 16 to 18 | KidyCode",
  description: "Learn web application development through one complete working project.",
};

export default function Ages16To18LearnPage() {
  return <LearningApp course={course16to18} />;
}
