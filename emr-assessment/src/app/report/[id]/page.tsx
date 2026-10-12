import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/brand/Logo";
import { ReportBody } from "@/components/report/ReportBody";
import { NetworkBackdrop } from "@/components/ui/NetworkBackdrop";
import { demoUrl, loadReport, siteUrl } from "@/lib/report.server";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function generateMetadata({ params }: PageProps<"/report/[id]">): Promise<Metadata> {
  const { id } = await params;
  const report = loadReport(id);
  if (!report) return { title: "Report not found" };
  const who = report.profile.agency ? `${report.profile.agency}: ` : "";
  const title = `${who}EMR score ${report.score.total}/50`;
  return {
    title,
    description: `${report.score.band.label}. See the full EMR gap analysis and how Careficient fills each gap.`,
    // Reports are personal; keep them out of search results.
    robots: { index: false, follow: false },
    openGraph: { title, description: report.score.band.label },
    twitter: { card: "summary_large_image", title, description: report.score.band.label },
  };
}

export default async function ReportPage({ params }: PageProps<"/report/[id]">) {
  const { id } = await params;
  const report = loadReport(id);
  if (!report) notFound();

  // Page views can trigger an AI call (when the narrative isn't cached), so they share the AI rate limit budget.
  const allowAi = rateLimit(`report-page:${clientIp({ headers: await headers() })}`, 20, 10 * 60_000).ok;
  const generatedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <NetworkBackdrop />
      <SiteHeader
        right={
          <Link href="/assessment" className="btn-ghost !py-2 text-sm">
            Retake assessment
          </Link>
        }
      />
      <main id="main" className="pt-2">
        <ReportBody report={report} demoUrl={demoUrl(report)} shareUrl={`${siteUrl()}/report/${id}`} generatedOn={generatedOn} allowAi={allowAi} />
      </main>
      <SiteFooter />
    </>
  );
}
