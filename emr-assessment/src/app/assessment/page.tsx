import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { AssessmentLoader } from "@/components/assessment/AssessmentLoader";
import { NetworkBackdrop } from "@/components/ui/NetworkBackdrop";

export const metadata: Metadata = {
  title: "Start your assessment",
  description: "Score your current EMR across 80+ home health and hospice capabilities in about 5 minutes.",
  alternates: { canonical: "/assessment" },
};

export default function AssessmentPage() {
  return (
    <>
      <NetworkBackdrop />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-5 sm:px-6">
        <Logo className="h-7 w-auto" />
        <span className="hidden text-sm text-muted sm:inline">EMR Intelligence Assessment</span>
      </div>
      <AssessmentLoader />
    </>
  );
}
