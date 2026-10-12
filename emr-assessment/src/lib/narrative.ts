/**
 * The written parts of the report. The AI writes these when it can; otherwise
 * they're filled from the templates in content/evaluation.json, so the report
 * always renders.
 */
import { categoriesById, evaluation, itemsById, programLabel, type CategoryId } from "./content";
import type { Profile, ScoreResult } from "./scoring";

export interface FitEntry {
  categoryId: CategoryId;
  headline: string;
  body: string;
}

export interface Narrative {
  source: "ai" | "template";
  executiveSummary: string;
  /** Impact text keyed by checklist item id. */
  gapImpacts: Record<string, string>;
  fit: FitEntry[];
}

function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function frustrationLabels(profile: Profile): string[] {
  return evaluation.frustrations.filter((f) => profile.frustrations.includes(f.id)).map((f) => f.label.toLowerCase());
}

export function templateNarrative(profile: Profile, score: ScoreResult): Narrative {
  const weakest = [...score.categories]
    .sort((a, b) => a.rating - b.rating || a.coverage - b.coverage)
    .slice(0, 2)
    .map((c) => c.name);
  const frustrations = frustrationLabels(profile);

  const executiveSummary = fill(evaluation.templates.executiveSummary, {
    agency: profile.agency?.trim() || "Your agency",
    programs: programLabel(profile.program),
    locations: profile.locations === "1" ? "one location" : `${profile.locations} locations`,
    states: profile.states.length === 1 ? profile.states[0] : `${profile.states.length} states (${profile.states.join(", ")})`,
    total: String(score.total),
    band: score.band.label,
    weakest: listJoin(weakest),
    frustrationLine: frustrations.length
      ? fill(evaluation.templates.frustrationLine, { frustrations: listJoin(frustrations) })
      : "",
  }).replace(/\s+/g, " ").trim();

  const gapImpacts: Record<string, string> = {};
  for (const gap of [...score.highRiskGaps, ...score.gapsByCategory.flatMap((g) => g.gaps)]) {
    const item = itemsById.get(gap.id);
    if (item) gapImpacts[gap.id] = item.impact;
  }

  const fit: FitEntry[] = score.fit.map((id) => {
    const category = categoriesById.get(id)!;
    const result = score.categories.find((c) => c.id === id)!;
    return {
      categoryId: id,
      headline: `Rated ${result.rating} of 5 today`,
      body: `${category.fallbackImpact} ${category.careficient.text}`,
    };
  });

  return { source: "template", executiveSummary, gapImpacts, fit };
}

/** Fill any field the AI left out or that failed validation with template text. */
export function mergeWithTemplate(partial: Partial<Omit<Narrative, "source">>, template: Narrative): Narrative {
  const fitById = new Map((partial.fit ?? []).map((f) => [f.categoryId, f]));
  return {
    source: "ai",
    executiveSummary: partial.executiveSummary || template.executiveSummary,
    gapImpacts: { ...template.gapImpacts, ...(partial.gapImpacts ?? {}) },
    fit: template.fit.map((t) => fitById.get(t.categoryId) ?? t),
  };
}
