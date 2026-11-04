import type { Metadata } from "next";
import { DesignStudio } from "@/components/DesignStudio";

export const metadata: Metadata = {
  title: "Practice Studio | KidyCode",
  description: "Create your own logo, screens and project prototypes in the beginner-friendly KidyCode Design Studio.",
};
export default function StudioPage() { return <DesignStudio />; }
