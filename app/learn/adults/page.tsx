import type { Metadata } from "next";
import { LearningApp } from "@/components/LearningApp";
import { adultCourse } from "@/lib/course-adults";

export const metadata: Metadata = {
  title: "Adult Beginners | KidyCode",
  description: "Learn practical web skills for work, business or an independent project.",
};

export default function AdultLearnPage() {
  return <LearningApp course={adultCourse} />;
}
