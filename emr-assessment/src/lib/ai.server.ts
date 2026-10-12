import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  categoriesById,
  evaluation,
  itemsById,
  programLabel,
  usableStatement,
} from "./content";
import { mergeWithTemplate, templateNarrative, frustrationLabels, type Narrative } from "./narrative";
import type { Profile, ScoreResult } from "./scoring";

const MAX_AI_GAPS = 14;

const NarrativeSchema = z.object({
  executiveSummary: z.string(),
  gapImpacts: z.array(z.object({ itemId: z.string(), impact: z.string() })),
  fit: z.array(z.object({ categoryId: z.string(), headline: z.string(), body: z.string() })),
});

const SYSTEM_PROMPT = `You write the narrative sections of the Careficient EMR Intelligence Assessment, a free report for home health and hospice agencies that compares their current EMR to a checklist.

Rules you must follow:
- All scores are already computed. Never state a score, rating, percentage, or number that is not given to you in the input, and never recalculate anything.
- Describe Careficient ONLY with the approved statements provided in the input. Do not add features, capabilities, integrations, statistics, prices, timelines, guarantees, or customer names that are not in those statements. Paraphrasing is fine; adding facts is not.
- Never name, compare, or criticize any other EMR vendor or product. Always refer to the visitor's system as "your current EMR".
- Do not mention patients by name or ask for any patient information.
- Write in plain, confident, professional American English addressed to the agency ("you", "your agency"). No hype words like "revolutionary" or "game-changing", no exclamation marks, no markdown.

What to write:
- executiveSummary: one paragraph of 3-5 sentences. Personalize it to the agency's programs, size (locations and states), and stated frustrations, and connect those frustrations to the weakest categories and any high-risk gaps. End with a sentence about what Careficient would change, using the approved statements.
- gapImpacts: for each gap provided, one or two sentences on the operational, compliance, or financial impact of that gap for an agency like this one. Use the gap's itemId exactly as given. Do not describe Careficient here.
- fit: for each fit category provided, in the same order, a short headline (under 10 words) and a 2-3 sentence body explaining why switching would help this agency in that area, grounded only in the approved statements for that category and its gaps.`;

function buildPromptInput(profile: Profile, score: ScoreResult) {
  const gaps = [...score.highRiskGaps, ...score.gapsByCategory.flatMap((g) => g.gaps)].slice(0, MAX_AI_GAPS);
  return {
    agency: {
      name: profile.agency?.trim() || null,
      programs: programLabel(profile.program),
      locations: profile.locations,
      stateCount: profile.states.length,
      states: profile.states,
      statedFrustrations: frustrationLabels(profile),
    },
    scores: {
      total: score.total,
      outOf: 50,
      band: score.band.label,
      categories: score.categories.map((c) => ({
        id: c.id,
        name: c.name,
        rating: c.rating,
        outOf: 5,
        notSureCount: c.unsure,
      })),
    },
    gaps: gaps.map((g) => ({
      itemId: g.id,
      item: g.label,
      category: categoriesById.get(g.categoryId)!.name,
      answer: g.answer === "no" ? "missing" : "partially in place",
      highRisk: g.critical,
      referenceImpact: itemsById.get(g.id)!.impact,
    })),
    fitCategories: score.fit.map((id) => {
      const category = categoriesById.get(id)!;
      const categoryGaps = gaps.filter((g) => g.categoryId === id);
      return {
        categoryId: id,
        name: category.name,
        rating: score.categories.find((c) => c.id === id)!.rating,
        approvedStatements: [
          category.careficient,
          ...categoryGaps.map((g) => itemsById.get(g.id)!.careficient),
        ]
          .filter(usableStatement)
          .map((s) => s.text),
      };
    }),
    approvedCompanyStatements: evaluation.company.approvedStatements.filter(usableStatement).map((s) => s.text),
  };
}

// Guardrails applied to the model's output on top of the prompt instructions.
const vendorPattern = new RegExp(
  evaluation.emrOptions
    .filter((o) => !/paper/i.test(o))
    .flatMap((o) => o.split(/[()]/))
    .map((o) => o.trim())
    .filter((o) => o.length > 2)
    .map((o) => o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "i",
);

function allowedNumbers(input: ReturnType<typeof buildPromptInput>): Set<string> {
  return new Set(JSON.stringify(input).match(/\d[\d,]*/g) ?? []);
}

/** Reject text that names a vendor or introduces a number we didn't supply. */
function isSafe(text: string, numbers: Set<string>): boolean {
  if (!text || text.length > 1500) return false;
  if (vendorPattern.test(text)) return false;
  for (const n of text.match(/\d[\d,]*/g) ?? []) {
    if (!numbers.has(n)) return false;
  }
  return true;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateNarrative(profile: Profile, score: ScoreResult): Promise<Narrative> {
  const fallback = templateNarrative(profile, score);
  if (!aiConfigured()) return fallback;

  const input = buildPromptInput(profile, score);
  const numbers = allowedNumbers(input);
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: evaluation.settings.aiTimeoutMs,
    maxRetries: 1,
  });

  try {
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low", format: zodOutputFormat(NarrativeSchema) },
      messages: [
        {
          role: "user",
          content: `Write the narrative for this assessment. Input JSON:\n${JSON.stringify(input, null, 2)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      console.warn("[report] AI returned no usable output, using template", response.stop_reason);
      return fallback;
    }
    const parsed = response.parsed_output;
    const gapIds = new Set(input.gaps.map((g) => g.itemId));
    const fitIds = new Set<string>(input.fitCategories.map((f) => f.categoryId));

    return mergeWithTemplate(
      {
        executiveSummary: isSafe(parsed.executiveSummary, numbers) ? parsed.executiveSummary.trim() : undefined,
        gapImpacts: Object.fromEntries(
          parsed.gapImpacts
            .filter((g) => gapIds.has(g.itemId) && isSafe(g.impact, numbers))
            .map((g) => [g.itemId, g.impact.trim()]),
        ),
        fit: parsed.fit
          .filter((f) => fitIds.has(f.categoryId) && isSafe(f.headline, numbers) && isSafe(f.body, numbers))
          .map((f) => ({ categoryId: f.categoryId as never, headline: f.headline.trim(), body: f.body.trim() })),
      },
      fallback,
    );
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`[report] Anthropic API error ${error.status}: ${error.message}`);
    } else {
      console.error("[report] AI generation failed", error);
    }
    return fallback;
  }
}
