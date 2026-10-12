import raw from "../../content/evaluation.json";

export type AnswerId = "yes" | "partial" | "no" | "unsure";
export type ProgramId = "home-health" | "hospice" | "both";
export type CategoryId =
  | "cloud"
  | "billing"
  | "eligibility"
  | "orders"
  | "interop"
  | "documentation"
  | "alerts"
  | "scheduling"
  | "analytics"
  | "support";
export type IconId =
  | "shield"
  | "nodes"
  | "inbox"
  | "clipboard"
  | "careplan"
  | "calendar"
  | "dollar"
  | "badge"
  | "chart"
  | "sliders"
  | "headset"
  | "heartclock";

export interface Statement {
  text: string;
  status: "TODO-REVIEW" | "approved";
  evidence: "case-study" | "why-careficient" | "checklist-only";
}

export interface Item {
  id: string;
  label: string;
  critical?: boolean;
  impact: string;
  careficient: Statement;
}

export interface Section {
  id: string;
  title: string;
  icon: IconId;
  intro: string;
  hospiceOnly?: boolean;
  items: Item[];
}

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  sections: string[];
  careficient: Statement;
  fallbackImpact: string;
}

export interface ScoreBand {
  id: "strong" | "gaps" | "holding-back";
  min: number;
  max: number;
  label: string;
  short: string;
  color: "green" | "amber" | "red";
  summary: string;
}

export interface Evaluation {
  meta: Record<string, string>;
  settings: { onlyApprovedStatements: boolean; aiTimeoutMs: number; analyzingMinMs: number };
  company: {
    name: string;
    tagline: string;
    positioning: string;
    stats: { value: number; suffix: string; label: string }[];
    credentials: { id: string; label: string }[];
    whySwitch: string[];
    approvedStatements: (Statement & { id: string })[];
  };
  answerOptions: { id: AnswerId; label: string; value: number | null; hint: string }[];
  ratingScale: { rating: number; label: string; description: string; minCoverage: number }[];
  scoreBands: ScoreBand[];
  programs: { id: ProgramId; label: string }[];
  locationOptions: string[];
  emrOptions: string[];
  roles: string[];
  frustrations: { id: string; label: string; category: CategoryId }[];
  categories: Category[];
  sections: Section[];
  caseStudy: {
    agency: string;
    headline: string;
    about: string;
    intro: string;
    person: { name: string; title: string; photo: string };
    quote: string;
    stats: { value: number; label: string; detail: string; reviewNote?: string }[];
    chart: { reviewNote: string; series: { metric: string; before: number; after: number }[] };
  };
  templates: Record<"executiveSummary" | "frustrationLine" | "fitIntro" | "unsureNote", string>;
}

export const evaluation = raw as unknown as Evaluation;

export const sectionsById = new Map(evaluation.sections.map((s) => [s.id, s]));
export const categoriesById = new Map(evaluation.categories.map((c) => [c.id, c]));

/** Every item in content order, with the section it belongs to. */
export const allItems = evaluation.sections.flatMap((section) =>
  section.items.map((item) => ({ ...item, sectionId: section.id })),
);
export const itemsById = new Map(allItems.map((i) => [i.id, i]));

/** Which category a section rolls up into. */
export const categoryForSection = new Map<string, CategoryId>(
  evaluation.categories.flatMap((c) => c.sections.map((s) => [s, c.id] as const)),
);

export function includesHospice(program: ProgramId | null | undefined): boolean {
  return program === "hospice" || program === "both";
}

export function visibleSections(program: ProgramId | null | undefined): Section[] {
  return evaluation.sections.filter((s) => !s.hospiceOnly || includesHospice(program));
}

export function programLabel(program: ProgramId): string {
  if (program === "both") return "home health and hospice";
  return program === "hospice" ? "hospice" : "home health";
}

/** Statements the AI is allowed to use, honoring settings.onlyApprovedStatements. */
export function usableStatement(s: Statement): boolean {
  return !evaluation.settings.onlyApprovedStatements || s.status === "approved";
}
