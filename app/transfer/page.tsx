import type { Metadata } from "next";
import TransferPage from "@/components/TransferPage";

export const metadata: Metadata = {
  title: "Continue on this device | KidyCode",
  description: "Use a transfer code to open your saved KidyCode course on another device.",
};

export default function Transfer() {
  return <TransferPage />;
}
