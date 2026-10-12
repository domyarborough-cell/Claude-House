import { z } from "zod";
import { loadReport, siteUrl } from "@/lib/report.server";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

const Body = z.object({ email: z.email().max(200), reportId: z.string().min(10).max(600) });

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(request: Request) {
  const limit = rateLimit(`email:${clientIp(request)}`, 3, 10 * 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const report = loadReport(parsed.data.reportId);
  if (!report) return Response.json({ error: "Invalid report" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return Response.json({ ok: false, reason: "not-configured" }, { status: 501 });

  const url = `${siteUrl()}/report/${report.id}`;
  const { total, band } = report.score;
  const html = `<div style="font-family:Arial,sans-serif;color:#0B2A3C;max-width:560px">
<h1 style="font-size:22px">Your EMR Intelligence Assessment</h1>
<p>Your current EMR scored <strong>${total} / 50</strong>: ${escape(band.label)}.</p>
<p><a href="${url}" style="display:inline-block;background:#22D3EE;color:#06202E;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">View your full report</a></p>
<p><a href="${siteUrl()}/api/pdf/${report.id}">Download the PDF</a></p>
<p style="color:#5b7486;font-size:12px">Careficient · Purpose Built for Care. Powered by Partnership.</p></div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [parsed.data.email], subject: `Your EMR assessment: ${total}/50`, html }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!res?.ok) return Response.json({ error: "We couldn't send the email. Please try again." }, { status: 502 });
  return Response.json({ ok: true });
}
