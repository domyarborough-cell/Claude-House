import { z } from "zod";
import { demoUrl, loadReport, siteUrl } from "@/lib/report.server";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import { evaluation } from "@/lib/content";

const Body = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  agency: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).regex(/^[0-9+().\-\s]*$/).optional().or(z.literal("")),
  currentEmr: z.string().trim().max(120).optional(),
  reportId: z.string().min(10).max(600),
  pageUri: z.string().max(500).optional(),
  hutk: z.string().max(100).optional(),
  // Honeypot: real visitors never fill this in.
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`lead:${clientIp(request)}`, 6, 10 * 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please check the highlighted fields.", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const lead = parsed.data;
  const report = loadReport(lead.reportId);
  if (!report) return Response.json({ error: "Invalid report" }, { status: 400 });

  const { score, profile } = report;
  const topGaps = [...score.highRiskGaps, ...score.gapsByCategory.flatMap((g) => g.gaps)].slice(0, 10).map((g) => g.label);
  const reportUrl = `${siteUrl()}/report/${report.id}`;
  const programs = evaluation.programs.find((p) => p.id === profile.program)?.label ?? profile.program;

  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;
  if (!portalId || !formId) {
    console.warn("[lead] HUBSPOT_PORTAL_ID / HUBSPOT_FORM_ID not set; lead not sent to HubSpot");
    return Response.json({ ok: true, delivered: false, demoUrl: demoUrl(report, lead) });
  }

  // Contact properties. The emr_assessment_* fields must exist as (hidden) fields on the HubSpot form.
  const fields: Record<string, string> = {
    firstname: lead.firstName,
    lastname: lead.lastName,
    email: lead.email,
    company: lead.agency,
    jobtitle: lead.role,
    phone: lead.phone ?? "",
    emr_assessment_score: String(score.total),
    emr_assessment_band: score.band.label,
    emr_assessment_top_gaps: topGaps.join("; "),
    emr_assessment_high_risk_gaps: score.highRiskGaps.map((g) => g.label).join("; "),
    emr_assessment_report_url: reportUrl,
    emr_assessment_programs: programs,
    emr_assessment_locations: profile.locations,
    emr_assessment_states: profile.states.join(", "),
    emr_assessment_current_emr: lead.currentEmr ?? "",
  };

  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(portalId)}/${encodeURIComponent(formId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: Object.entries(fields)
          .filter(([, value]) => value !== "")
          .map(([name, value]) => ({ objectTypeId: "0-1", name, value })),
        context: {
          pageUri: lead.pageUri || `${siteUrl()}/assessment`,
          pageName: "Careficient EMR Intelligence Assessment",
          ...(lead.hutk ? { hutk: lead.hutk } : {}),
        },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  ).catch((error: unknown) => {
    console.error("[lead] HubSpot request failed", error);
    return null;
  });

  if (!response?.ok) {
    console.error("[lead] HubSpot rejected submission", response?.status, await response?.text().catch(() => ""));
    // Never block the visitor from their report because the CRM is unavailable.
    return Response.json({ ok: true, delivered: false, demoUrl: demoUrl(report, lead) });
  }
  return Response.json({ ok: true, delivered: true, demoUrl: demoUrl(report, lead) });
}
