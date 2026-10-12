import "server-only";
import { decodeReport, type ReportInput } from "./encode";
import { scoreAssessment, type ScoreResult } from "./scoring";
import { generateNarrative } from "./ai.server";
import { templateNarrative, type Narrative } from "./narrative";

export interface LoadedReport extends ReportInput {
  id: string;
  score: ScoreResult;
}

export function loadReport(id: string): LoadedReport | null {
  const input = decodeReport(id);
  if (!input) return null;
  return { ...input, id, score: scoreAssessment(input.answers, input.profile) };
}

// Narratives are cached per instance so the report page, PDF and repeat visits
// reuse one AI call. Concurrent requests for the same report share one promise.
const MAX_ENTRIES = 500;
const cache = new Map<string, Promise<Narrative>>();

export function getNarrative(report: LoadedReport, { allowAi = true }: { allowAi?: boolean } = {}): Promise<Narrative> {
  const hit = cache.get(report.id);
  if (hit) return hit;
  if (!allowAi) return Promise.resolve(templateNarrative(report.profile, report.score));
  const pending = generateNarrative(report.profile, report.score).then((narrative) => {
    // Don't pin template fallbacks: a later request may reach the AI.
    if (narrative.source === "template") cache.delete(report.id);
    return narrative;
  });
  cache.set(report.id, pending);
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return pending;
}

export function siteUrl(): string {
  return (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, "");
}

export function demoUrl(report: LoadedReport | null, contact?: { firstName?: string; lastName?: string; email?: string }): string {
  const base = process.env.DEMO_URL || "https://careficient.com";
  try {
    const url = new URL(base);
    if (report) {
      const gaps = [...report.score.highRiskGaps, ...report.score.gapsByCategory.flatMap((g) => g.gaps)]
        .slice(0, 8)
        .map((g) => g.label);
      const notes = `EMR Assessment score ${report.score.total}/50 (${report.score.band.short}). Top gaps: ${gaps.join("; ")}. Report: ${siteUrl()}/report/${report.id}`;
      url.searchParams.set(process.env.DEMO_NOTES_PARAM || "notes", notes.slice(0, 1500));
    }
    if (contact?.firstName) url.searchParams.set("firstname", contact.firstName);
    if (contact?.lastName) url.searchParams.set("lastname", contact.lastName);
    if (contact?.email) url.searchParams.set("email", contact.email);
    return url.toString();
  } catch {
    return base;
  }
}
