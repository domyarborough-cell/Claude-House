import { describe, expect, it } from "vitest";
import { allItems } from "@/lib/content";
import { decodeReport, encodeReport } from "@/lib/encode";
import type { Answers } from "@/lib/scoring";

describe("report encoding", () => {
  it("round-trips profile and answers", () => {
    const codes = ["yes", "partial", "no", "unsure"] as const;
    const answers: Answers = Object.fromEntries(allItems.map((item, i) => [item.id, codes[i % 4]]));
    delete answers[allItems[5].id];
    const profile = { program: "hospice" as const, locations: "2-5", states: ["KS", "MO"], frustrations: ["billing-denials", "support"], agency: "Prairie Hospice Care" };
    const id = encodeReport({ profile, answers });
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(id.length).toBeLessThan(200);
    expect(decodeReport(id)).toEqual({ profile, answers });
  });

  it("strips markup from agency names", () => {
    const id = encodeReport({ profile: { program: "both", locations: "1", states: [], frustrations: [], agency: "<b>Acme</b>\n Home  Health" }, answers: {} });
    expect(decodeReport(id)!.profile.agency).toBe("bAcme/b Home Health");
  });

  it("rejects garbage", () => {
    expect(decodeReport("not-a-report")).toBeNull();
    expect(decodeReport("AAAAAAAAAAAAAAAA")).toBeNull();
    expect(decodeReport("../../etc/passwd")).toBeNull();
  });
});
