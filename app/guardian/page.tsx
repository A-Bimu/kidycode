import type { Metadata } from "next";
import { GuardianDashboard } from "@/components/GuardianDashboard";

export const metadata: Metadata = {
  title: "Grown-up progress view | KidyCode",
  description: "Follow a learner's KidyCode progress after they share a one-time connection code with you.",
};

export default function GuardianPage() {
  return <GuardianDashboard />;
}