/**
 * Scoring engine. Pure functions only: no I/O, no randomness, no AI.
 * Scores are always computed here, never by the language model.
 */
import {
  evaluation,
  visibleSections,
  categoryForSection,
  type AnswerId,
  type CategoryId,
  type ProgramId,
  type ScoreBand,
  type Evaluation,
} from "./content";

export type Answers = Record<string, AnswerId>;

export interface Profile {
  program: ProgramId;
  locations: string;
  states: string[];
  frustrations: string[];
  agency?: string;
}

export const ANSWER_VALUE: Record<AnswerId, number | null> = {
  yes: 1,
  partial: 0.5,
  no: 0,
  unsure: null,
};

export interface ItemResult {
  id: string;
  label: string;
  sectionId: string;
  categoryId: CategoryId;
  answer: AnswerId | null;
  critical: boolean;
  weight: number;
}

export interface CategoryResult {
  id: CategoryId;
  name: string;
  short: string;
  /** 0-100, rounded. Coverage of answered (non-"Not sure") items, critical items weighted 2x. */
  coverage: number;
  rating: 1 | 2 | 3 | 4 | 5;
  earned: number;
  possible: number;
  answered: number;
  unsure: number;
  total: number;
  /** True when every item in the category was "Not sure", so the rating is a floor, not a measurement. */
  unverified: boolean;
}

export interface SectionResult {
  id: string;
  title: string;
  coverage: number;
  rating: 1 | 2 | 3 | 4 | 5;
  answered: number;
  total: number;
}

export interface Gap extends ItemResult {
  answer: "no" | "partial";
  categoryRating: number;
}

export interface ScoreResult {
  total: number;
  band: ScoreBand;
  categories: CategoryResult[];
  sections: SectionResult[];
  items: ItemResult[];
  highRiskGaps: Gap[];
  /** Non-critical gaps grouped by category, worst category first. */
  gapsByCategory: { category: CategoryResult; gaps: Gap[] }[];
  unsureItems: ItemResult[];
  fit: CategoryId[];
  answeredCount: number;
  itemCount: number;
}

export const CRITICAL_WEIGHT = 2;

export function ratingFromCoverage(coveragePct: number): 1 | 2 | 3 | 4 | 5 {
  if (coveragePct >= 90) return 5;
  if (coveragePct >= 75) return 4;
  if (coveragePct >= 50) return 3;
  if (coveragePct >= 25) return 2;
  return 1;
}

export function bandForTotal(total: number, content: Evaluation = evaluation): ScoreBand {
  const band = content.scoreBands.find((b) => total >= b.min && total <= b.max);
  if (band) return band;
  return total > 50 ? content.scoreBands[0] : content.scoreBands[content.scoreBands.length - 1];
}

interface Tally {
  earned: number;
  possible: number;
  answered: number;
  unsure: number;
  total: number;
}

function tally(items: ItemResult[]): Tally {
  const t: Tally = { earned: 0, possible: 0, answered: 0, unsure: 0, total: items.length };
  for (const item of items) {
    const value = item.answer ? ANSWER_VALUE[item.answer] : null;
    if (value === null) {
      t.unsure += 1;
      continue;
    }
    t.answered += 1;
    t.earned += value * item.weight;
    t.possible += item.weight;
  }
  return t;
}

function coverageOf(t: Tally): number {
  // Coverage is rounded down to a whole percent before banding so a category
  // at 89.6% is a 4, never silently promoted to a 5.
  return t.possible === 0 ? 0 : Math.floor((t.earned / t.possible) * 100 + 1e-9);
}

/**
 * Score a completed (or partially completed) assessment.
 * Unanswered items are treated the same as "Not sure".
 */
export function scoreAssessment(answers: Answers, profile: Pick<Profile, "program" | "frustrations">): ScoreResult {
  const sections = visibleSections(profile.program);

  const items: ItemResult[] = sections.flatMap((section) => {
    const categoryId = categoryForSection.get(section.id);
    if (!categoryId) throw new Error(`Section ${section.id} is not mapped to a category`);
    return section.items.map((item) => ({
      id: item.id,
      label: item.label,
      sectionId: section.id,
      categoryId,
      answer: answers[item.id] ?? null,
      critical: Boolean(item.critical),
      weight: item.critical ? CRITICAL_WEIGHT : 1,
    }));
  });

  const sectionResults: SectionResult[] = sections.map((section) => {
    const t = tally(items.filter((i) => i.sectionId === section.id));
    const coverage = coverageOf(t);
    return {
      id: section.id,
      title: section.title,
      coverage,
      rating: ratingFromCoverage(coverage),
      answered: t.answered,
      total: t.total,
    };
  });

  const categories: CategoryResult[] = evaluation.categories.map((category) => {
    const t = tally(items.filter((i) => i.categoryId === category.id));
    const coverage = coverageOf(t);
    return {
      id: category.id,
      name: category.name,
      short: category.short,
      coverage,
      rating: ratingFromCoverage(coverage),
      earned: t.earned,
      possible: t.possible,
      answered: t.answered,
      unsure: t.unsure,
      total: t.total,
      unverified: t.total > 0 && t.answered === 0,
    };
  });

  const total = categories.reduce((sum, c) => sum + c.rating, 0);
  const ratingOf = new Map(categories.map((c) => [c.id, c]));

  const worstFirst = (a: CategoryResult, b: CategoryResult) =>
    a.rating - b.rating || a.coverage - b.coverage || evaluation.categories.findIndex((c) => c.id === a.id) - evaluation.categories.findIndex((c) => c.id === b.id);

  const gaps: Gap[] = items
    .filter((i): i is ItemResult & { answer: "no" | "partial" } => i.answer === "no" || i.answer === "partial")
    .map((i) => ({ ...i, categoryRating: ratingOf.get(i.categoryId)!.rating }));

  // "No" before "Partially" within any list of gaps.
  const severity = (g: Gap) => (g.answer === "no" ? 0 : 1);

  const highRiskGaps = gaps
    .filter((g) => g.critical)
    .sort((a, b) => severity(a) - severity(b) || worstFirst(ratingOf.get(a.categoryId)!, ratingOf.get(b.categoryId)!));

  const gapsByCategory = [...categories]
    .sort(worstFirst)
    .map((category) => ({
      category,
      gaps: gaps.filter((g) => !g.critical && g.categoryId === category.id).sort((a, b) => severity(a) - severity(b)),
    }))
    .filter((group) => group.gaps.length > 0);

  return {
    total,
    band: bandForTotal(total),
    categories,
    sections: sectionResults,
    items,
    highRiskGaps,
    gapsByCategory,
    unsureItems: items.filter((i) => i.answer === "unsure" || i.answer === null),
    fit: rankFit(categories, highRiskGaps, profile.frustrations),
    answeredCount: items.filter((i) => i.answer !== null).length,
    itemCount: items.length,
  };
}

/**
 * The three categories where switching would help most: biggest rating gap first,
 * boosted by the visitor's stated frustrations and by high-risk gaps.
 */
export function rankFit(categories: CategoryResult[], highRiskGaps: Gap[], frustrations: string[]): CategoryId[] {
  const frustrationCategories = new Set(
    evaluation.frustrations.filter((f) => frustrations.includes(f.id)).map((f) => f.category),
  );
  const scored = categories.map((c, index) => {
    const highRisk = highRiskGaps.filter((g) => g.categoryId === c.id).length;
    const score = (5 - c.rating) * 2 + (frustrationCategories.has(c.id) ? 2 : 0) + highRisk * 1.5;
    return { id: c.id, score, coverage: c.coverage, index };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.coverage - b.coverage || a.index - b.index)
    .slice(0, 3)
    .map((s) => s.id);
}

/** Live running score while the visitor is mid-assessment: 0-100 across answered items. */
export function liveHealth(answers: Answers, program: ProgramId | null): number | null {
  const sections = visibleSections(program);
  let earned = 0;
  let possible = 0;
  for (const section of sections) {
    for (const item of section.items) {
      const a = answers[item.id];
      const v = a ? ANSWER_VALUE[a] : null;
      if (v === null) continue;
      const w = item.critical ? CRITICAL_WEIGHT : 1;
      earned += v * w;
      possible += w;
    }
  }
  return possible === 0 ? null : Math.round((earned / possible) * 100);
}
