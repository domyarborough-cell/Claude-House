import { describe, expect, it } from "vitest";
import { allItems, evaluation, visibleSections, type AnswerId } from "@/lib/content";
import { bandForTotal, liveHealth, rankFit, ratingFromCoverage, scoreAssessment, type Answers } from "@/lib/scoring";

const sectionItems = (id: string) => evaluation.sections.find((s) => s.id === id)!.items;

function answerAll(answer: AnswerId, overrides: Answers = {}): Answers {
  return { ...Object.fromEntries(allItems.map((i) => [i.id, answer])), ...overrides };
}

describe("content", () => {
  it("has every PDF section and maps each one to exactly one category", () => {
    expect(evaluation.sections).toHaveLength(12);
    for (const section of evaluation.sections) {
      const owners = evaluation.categories.filter((c) => c.sections.includes(section.id));
      expect(owners, section.id).toHaveLength(1);
    }
    expect(evaluation.categories).toHaveLength(10);
  });

  it("has 89 checklist items with unique ids", () => {
    expect(allItems).toHaveLength(89);
    expect(new Set(allItems.map((i) => i.id)).size).toBe(89);
  });

  it("flags exactly the critical items from the brief", () => {
    const critical = allItems.filter((i) => i.critical).map((i) => i.id).sort();
    expect(critical).toEqual(["bc-clearinghouse", "bc-payer-rules", "cg-cop", "co-orders-driven", "hp-scrubber", "io-clearinghouse", "se-evv-builtin"].sort());
  });

  it("marks every Careficient statement for marketing review", () => {
    for (const item of allItems) expect(item.careficient.status).toBe("TODO-REVIEW");
    for (const c of evaluation.categories) expect(c.careficient.status).toBe("TODO-REVIEW");
  });

  it("contains no internal PDF notes or known typos", () => {
    const text = JSON.stringify(evaluation);
    expect(text).not.toMatch(/Executive Deck|RFP responses|immediatley|IImproved|Reimbursment/);
  });
});

describe("ratingFromCoverage", () => {
  it.each([
    [100, 5], [90, 5], [89, 4], [75, 4], [74, 3], [50, 3], [49, 2], [25, 2], [24, 1], [0, 1],
  ])("%i%% → %i", (coverage, rating) => expect(ratingFromCoverage(coverage)).toBe(rating));
});

describe("bandForTotal", () => {
  it("uses the brief's bands", () => {
    expect(bandForTotal(50).id).toBe("strong");
    expect(bandForTotal(40).id).toBe("strong");
    expect(bandForTotal(39).id).toBe("gaps");
    expect(bandForTotal(30).id).toBe("gaps");
    expect(bandForTotal(29).id).toBe("holding-back");
    expect(bandForTotal(10).id).toBe("holding-back");
  });
});

describe("scoreAssessment", () => {
  it("scores 50 when everything is Yes and 10 when everything is No", () => {
    expect(scoreAssessment(answerAll("yes"), { program: "both", frustrations: [] }).total).toBe(50);
    const none = scoreAssessment(answerAll("no"), { program: "both", frustrations: [] });
    expect(none.total).toBe(10);
    expect(none.band.id).toBe("holding-back");
  });

  it("treats Partially as half credit", () => {
    const r = scoreAssessment(answerAll("partial"), { program: "home-health", frustrations: [] });
    for (const c of r.categories) expect(c.coverage).toBe(50);
    expect(r.total).toBe(30);
  });

  it("excludes Not sure from the math and lists it to verify", () => {
    const answers = answerAll("yes");
    for (const item of sectionItems("interoperability").slice(0, 3)) answers[item.id] = "unsure";
    const r = scoreAssessment(answers, { program: "home-health", frustrations: [] });
    const interop = r.categories.find((c) => c.id === "interop")!;
    expect(interop.coverage).toBe(100);
    expect(interop.rating).toBe(5);
    expect(interop.unsure).toBe(3);
    expect(r.unsureItems.map((i) => i.id)).toEqual(sectionItems("interoperability").slice(0, 3).map((i) => i.id));
  });

  it("marks a category unverified when every item is Not sure", () => {
    const answers = answerAll("yes");
    for (const item of sectionItems("reporting-analytics")) answers[item.id] = "unsure";
    const analytics = scoreAssessment(answers, { program: "home-health", frustrations: [] }).categories.find((c) => c.id === "analytics")!;
    expect(analytics.unverified).toBe(true);
    expect(analytics.rating).toBe(1);
  });

  it("weights critical items 2x", () => {
    // Billing has 9 items, 2 critical: weights total 11. Missing both critical items → 7/11 = 63% → 3.
    const answers = answerAll("yes", { "bc-clearinghouse": "no", "bc-payer-rules": "no" });
    const billing = scoreAssessment(answers, { program: "home-health", frustrations: [] }).categories.find((c) => c.id === "billing")!;
    expect(billing.possible).toBe(11);
    expect(billing.earned).toBe(7);
    expect(billing.coverage).toBe(63);
    expect(billing.rating).toBe(3);

    // Missing two non-critical items instead → 9/11 = 81% → 4.
    const other = scoreAssessment(answerAll("yes", { "bc-era": "no", "bc-nightly": "no" }), { program: "home-health", frustrations: [] });
    expect(other.categories.find((c) => c.id === "billing")!.rating).toBe(4);
  });

  it("lists missing critical items as high-risk gaps, No before Partially", () => {
    const r = scoreAssessment(answerAll("yes", { "cg-cop": "partial", "se-evv-builtin": "no" }), { program: "home-health", frustrations: [] });
    expect(r.highRiskGaps.map((g) => g.id)).toEqual(["se-evv-builtin", "cg-cop"]);
    expect(r.gapsByCategory.flatMap((g) => g.gaps)).toHaveLength(0);
  });

  it("orders category gaps worst category first", () => {
    const answers = answerAll("yes");
    for (const item of sectionItems("reporting-analytics")) answers[item.id] = "no";
    answers["cs-fields"] = "no";
    const r = scoreAssessment(answers, { program: "home-health", frustrations: [] });
    expect(r.gapsByCategory[0].category.id).toBe("analytics");
    expect(r.gapsByCategory[1].category.id).toBe("documentation");
  });

  it("only includes HOPE for hospice programs, inside Real-Time Alerts", () => {
    const hh = scoreAssessment(answerAll("yes"), { program: "home-health", frustrations: [] });
    expect(hh.items.some((i) => i.sectionId === "hope")).toBe(false);
    expect(hh.categories.find((c) => c.id === "alerts")!.total).toBe(5);

    const hospice = scoreAssessment(answerAll("yes", { "hp-scrubber": "no" }), { program: "hospice", frustrations: [] });
    const alerts = hospice.categories.find((c) => c.id === "alerts")!;
    expect(alerts.total).toBe(10);
    // Compliance: 5 items + 1 critical = 6; HOPE: 5 items + 1 critical = 6. Missing the scrubber: 10/12.
    expect(alerts.possible).toBe(12);
    expect(alerts.earned).toBe(10);
    expect(hospice.highRiskGaps.map((g) => g.id)).toEqual(["hp-scrubber"]);
    expect(visibleSections("both").some((s) => s.id === "hope")).toBe(true);
    expect(visibleSections("home-health").some((s) => s.id === "hope")).toBe(false);
  });

  it("ignores HOPE answers for home-health-only agencies", () => {
    const answers = answerAll("yes");
    for (const item of sectionItems("hope")) answers[item.id] = "no";
    expect(scoreAssessment(answers, { program: "home-health", frustrations: [] }).total).toBe(50);
  });

  it("rolls Clinical Documentation and Configuration into one category", () => {
    const answers = answerAll("yes");
    for (const item of sectionItems("configuration-scalability")) answers[item.id] = "no";
    const doc = scoreAssessment(answers, { program: "home-health", frustrations: [] }).categories.find((c) => c.id === "documentation")!;
    expect(doc.total).toBe(14);
    expect(doc.coverage).toBe(64);
  });

  it("treats unanswered items as Not sure", () => {
    const r = scoreAssessment({}, { program: "home-health", frustrations: [] });
    expect(r.total).toBe(10);
    expect(r.answeredCount).toBe(0);
    expect(r.unsureItems).toHaveLength(r.itemCount);
  });
});

describe("rankFit", () => {
  it("returns three categories, biggest gaps first, boosted by frustrations", () => {
    const answers = answerAll("yes");
    for (const item of sectionItems("billing-claims-rcm")) answers[item.id] = "no";
    for (const item of sectionItems("reporting-analytics")) answers[item.id] = "partial";
    for (const item of sectionItems("scheduling-evv-workforce")) answers[item.id] = "partial";
    const r = scoreAssessment(answers, { program: "hospice", frustrations: ["scheduling-evv"] });
    expect(r.fit).toHaveLength(3);
    expect(r.fit[0]).toBe("billing");
    expect(r.fit[1]).toBe("scheduling");
    expect(r.fit[2]).toBe("analytics");
  });

  it("is deterministic for a perfect score", () => {
    const r = scoreAssessment(answerAll("yes"), { program: "both", frustrations: [] });
    expect(rankFit(r.categories, [], [])).toEqual(["cloud", "billing", "eligibility"]);
  });
});

describe("liveHealth", () => {
  it("is null before any answer and a 0-100 percent after", () => {
    expect(liveHealth({}, "hospice")).toBeNull();
    expect(liveHealth({ "ps-onc": "yes", "ps-mfa": "no" }, "hospice")).toBe(50);
    expect(liveHealth({ "ps-onc": "unsure" }, "hospice")).toBeNull();
  });
});
