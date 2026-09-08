import { courseFacts, stages } from "@/lib/course";
import { LearningApp } from "@/components/LearningApp";

export default function LearnPage() {
  return <LearningApp courseFacts={courseFacts} stages={stages} />;
}
