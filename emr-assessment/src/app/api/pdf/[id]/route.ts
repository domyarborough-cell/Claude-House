import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { createElement } from "react";
import { ReportDocument } from "@/lib/pdf/ReportDocument";
import { demoUrl, getNarrative, loadReport, siteUrl } from "@/lib/report.server";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request, ctx: RouteContext<"/api/pdf/[id]">) {
  const limit = rateLimit(`pdf:${clientIp(request)}`, 10, 10 * 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const { id } = await ctx.params;
  const report = loadReport(id);
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

  const narrative = await getNarrative(report);
  const demo = demoUrl(report);
  const qrDataUrl = await QRCode.toDataURL(demo, { margin: 1, width: 360, color: { dark: "#0B2A3C", light: "#FFFFFF" } });
  const generatedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const buffer = await renderToBuffer(
    createElement(ReportDocument, {
      profile: report.profile,
      score: report.score,
      narrative,
      reportUrl: `${siteUrl()}/report/${id}`,
      demoUrl: demo,
      qrDataUrl,
      generatedOn,
    }) as Parameters<typeof renderToBuffer>[0],
  );

  const slug = (report.profile.agency || "agency").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agency";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="careficient-emr-report-${slug}.pdf"`,
      "Cache-Control": "private, max-age=600",
    },
  });
}
