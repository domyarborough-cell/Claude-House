import { z } from "zod";
import { getNarrative, loadReport } from "@/lib/report.server";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

export const maxDuration = 60;

const Body = z.object({ id: z.string().min(10).max(600) });

export async function POST(request: Request) {
  const limit = rateLimit(`report:${clientIp(request)}`, 12, 10 * 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  // Scores are recomputed from the answers on the server; nothing score-related
  // is accepted from the browser.
  const report = loadReport(body.data.id);
  if (!report) return Response.json({ error: "Invalid report" }, { status: 400 });

  const narrative = await getNarrative(report);
  return Response.json({ narrative }, { headers: { "Cache-Control": "no-store" } });
}
