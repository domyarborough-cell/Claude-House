import { Suspense } from "react";
import { SectionIcon } from "@/components/icons/SectionIcon";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { Reveal } from "@/components/ui/Reveal";
import { evaluation, programLabel, sectionsById, type CategoryId } from "@/lib/content";
import { templateNarrative, type Narrative } from "@/lib/narrative";
import { getNarrative, type LoadedReport } from "@/lib/report.server";
import type { Gap } from "@/lib/scoring";
import { bandColor, ratingColor } from "@/styles/tokens";
import { BarsIsland, RadarIsland } from "./ChartIslands";
import { GapCard } from "./GapCard";
import { Heatmap } from "./Heatmap";
import { ProofBlock } from "./ProofBlock";
import { ReportActions } from "./ReportActions";

const CATEGORY_ICON = {
  cloud: "shield",
  billing: "dollar",
  eligibility: "inbox",
  orders: "careplan",
  interop: "nodes",
  documentation: "clipboard",
  alerts: "badge",
  scheduling: "calendar",
  analytics: "chart",
  support: "headset",
} as const satisfies Record<CategoryId, string>;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass rounded-[28px] p-5 sm:p-8 ${className}`}>{children}</div>;
}

function SectionTitle({ eyebrow, title, children, id }: { eyebrow: string; title: string; children?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-6">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-2xl font-extrabold sm:text-3xl">
        {title}
      </h2>
      {children ? <p className="mt-2 max-w-3xl text-sm text-white/70 sm:text-base">{children}</p> : null}
    </div>
  );
}

/* ---------- narrative-dependent sections (streamed) ---------- */

function SummaryText({ narrative }: { narrative: Narrative }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Executive summary</p>
        {narrative.source === "ai" ? <span className="rounded-full border border-cyan/30 px-2.5 py-1 text-[11px] text-cyan">AI-written · scores computed by our engine</span> : null}
      </div>
      <p className="mt-4 text-lg leading-relaxed text-white/90">{narrative.executiveSummary}</p>
    </>
  );
}

async function ExecutiveSummary({ report, allowAi }: { report: LoadedReport; allowAi: boolean }) {
  return <SummaryText narrative={await getNarrative(report, { allowAi })} />;
}

function SummarySkeleton() {
  return (
    <>
      <p className="eyebrow">Executive summary</p>
      <div className="mt-4 space-y-3" aria-busy aria-label="Writing your summary">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </>
  );
}

function GapsList({ report, narrative }: { report: LoadedReport; narrative: Narrative }) {
  const { score } = report;
  const card = (g: Gap, level: 3 | 4) => <GapCard key={g.id} headingLevel={level} gap={g} impact={narrative.gapImpacts[g.id]} />;
  return (
    <>
      {score.highRiskGaps.length ? (
        <section aria-labelledby="highrisk-heading">
          <SectionTitle id="highrisk-heading" eyebrow="Fix these first" title="High-risk gaps">
            These critical capabilities are missing or only partly in place. Each one carries outsized compliance or revenue risk.
          </SectionTitle>
          <div className="space-y-4">{score.highRiskGaps.map((g) => card(g, 3))}</div>
        </section>
      ) : null}

      {score.gapsByCategory.length ? (
        <section aria-labelledby="gaps-heading">
          <SectionTitle id="gaps-heading" eyebrow="Gap analysis" title="Gaps by category, worst first" />
          <div className="space-y-10">
            {score.gapsByCategory.map(({ category, gaps }) => (
              <div key={category.id}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06] text-sky">
                    <SectionIcon icon={CATEGORY_ICON[category.id]} className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold">{category.name}</h3>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: ratingColor(category.rating), background: `${ratingColor(category.rating)}1f` }}>
                    {category.rating}/5
                  </span>
                </div>
                <div className="space-y-4">{gaps.map((g) => card(g, 4))}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

async function Gaps({ report, allowAi }: { report: LoadedReport; allowAi: boolean }) {
  return <GapsList report={report} narrative={await getNarrative(report, { allowAi })} />;
}

function FitCards({ report, narrative }: { report: LoadedReport; narrative: Narrative }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {narrative.fit.map((f, i) => {
        const cat = report.score.categories.find((c) => c.id === f.categoryId)!;
        return (
          <Reveal key={f.categoryId} delay={0.08 * i} className="group relative overflow-hidden rounded-[24px] border border-cyan/30 bg-gradient-to-b from-cyan/[0.12] to-transparent p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan/15 text-cyan shadow-glow">
                <SectionIcon icon={CATEGORY_ICON[f.categoryId]} className="h-6 w-6" />
              </span>
              <span className="font-display text-5xl font-extrabold text-white/10" aria-hidden>
                0{i + 1}
              </span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-cyan">{cat.name}</p>
            <h3 className="mt-1 text-lg font-bold leading-snug">{f.headline}</h3>
            <p className="mt-2 text-sm text-white/80">{f.body}</p>
            <p className="mt-4 text-xs text-muted">
              Your rating: <span style={{ color: ratingColor(cat.rating) }}>{cat.rating}/5</span> → Careficient standard: <span className="text-cyan">5/5</span>
            </p>
          </Reveal>
        );
      })}
    </div>
  );
}

async function Fit({ report, allowAi }: { report: LoadedReport; allowAi: boolean }) {
  return <FitCards report={report} narrative={await getNarrative(report, { allowAi })} />;
}

/* ---------- page body ---------- */

export function ReportBody({ report, demoUrl, shareUrl, generatedOn, allowAi }: { report: LoadedReport; demoUrl: string; shareUrl: string; generatedOn: string; allowAi: boolean }) {
  const { score, profile, id } = report;
  const band = score.band;
  const bc = bandColor(band.color);
  const agency = profile.agency?.trim();
  const totalGaps = score.highRiskGaps.length + score.gapsByCategory.reduce((n, g) => n + g.gaps.length, 0);
  // Shown while the AI narrative streams in: the same report with template text.
  const template = templateNarrative(profile, score);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-10 sm:px-6">
      {/* SCORE REVEAL */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-navy via-deep to-[#0a3a52] p-6 sm:p-10" aria-labelledby="score-heading">
        <div className="absolute left-1/2 top-0 h-64 w-[70%] -translate-x-1/2 rounded-full blur-3xl" style={{ background: `${bc}22` }} aria-hidden />
        <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center">
            <RadialGauge value={score.total} max={50} size={260} label="EMR score" sublabel="out of 50" colorOverride={bc} ariaLabel={`EMR score ${score.total} out of 50`} />
          </div>
          <div>
            <p className="eyebrow">EMR Intelligence Report{agency ? ` · ${agency}` : ""}</p>
            <h1 id="score-heading" className="mt-3 text-[clamp(1.75rem,4vw,2.9rem)] font-extrabold leading-tight">
              <span style={{ color: bc, textShadow: `0 0 32px ${bc}66` }}>{band.label}</span>
            </h1>
            <p className="mt-3 text-white/75">{band.summary}</p>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/[0.05] p-3">
                <dt className="text-xs text-muted">High-risk gaps</dt>
                <dd className="font-display text-2xl font-extrabold text-bad">{score.highRiskGaps.length}</dd>
              </div>
              <div className="rounded-2xl bg-white/[0.05] p-3">
                <dt className="text-xs text-muted">Total gaps</dt>
                <dd className="font-display text-2xl font-extrabold text-warn">{totalGaps}</dd>
              </div>
              <div className="rounded-2xl bg-white/[0.05] p-3">
                <dt className="text-xs text-muted">To verify</dt>
                <dd className="font-display text-2xl font-extrabold text-unknown">{score.unsureItems.length}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              {programLabel(profile.program).replace(/^./, (c) => c.toUpperCase())} · {profile.locations} location{profile.locations === "1" ? "" : "s"} · {profile.states.join(", ")} · {generatedOn}
            </p>
          </div>
        </div>
      </section>

      {/* EXECUTIVE SUMMARY */}
      <Card>
        <Suspense fallback={<SummarySkeleton />}>
          <ExecutiveSummary report={report} allowAi={allowAi} />
        </Suspense>
      </Card>

      {/* CHARTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <SectionTitle eyebrow="10-category profile" title="Your EMR vs. the Careficient standard" />
            <RadarIsland categories={score.categories} />
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <SectionTitle eyebrow="Category ratings" title="Where your EMR stands" />
            <BarsIsland categories={score.categories} />
            <table className="sr-only">
              <caption>Category ratings</caption>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Rating (1-5)</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {score.categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.rating}</td>
                    <td>{c.coverage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Reveal>
      </div>

      {/* HEATMAP */}
      <Reveal>
        <Card>
          <SectionTitle eyebrow="Capability heatmap" title={`All ${score.itemCount} capabilities at a glance`} />
          <Heatmap items={score.items} />
        </Card>
      </Reveal>

      {/* GAPS */}
      <Suspense fallback={<GapsList report={report} narrative={template} />}>
        <Gaps report={report} allowAi={allowAi} />
      </Suspense>

      {score.unsureItems.length ? (
        <Reveal>
          <Card>
            <SectionTitle eyebrow="Verify with your vendor" title={`${score.unsureItems.length} capabilities to confirm`}>
              {evaluation.templates.unsureNote}
            </SectionTitle>
            <ul className="grid gap-2 sm:grid-cols-2">
              {score.unsureItems.map((i) => (
                <li key={i.id} className="flex items-start gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="mt-0.5 text-unknown" aria-hidden>
                    ?
                  </span>
                  <span>
                    {i.label}
                    <span className="block text-xs text-muted">{sectionsById.get(i.sectionId)?.title}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      ) : null}

      {/* FIT */}
      <section aria-labelledby="fit-heading">
        <SectionTitle id="fit-heading" eyebrow="Your Careficient fit" title="Where switching would help most">
          {evaluation.templates.fitIntro}
        </SectionTitle>
        <Suspense fallback={<FitCards report={report} narrative={template} />}>
          <Fit report={report} allowAi={allowAi} />
        </Suspense>
      </section>

      {/* PROOF */}
      <ProofBlock />

      {/* CTAS */}
      <section aria-labelledby="next-heading">
        <Card className="relative overflow-hidden">
          <div className="absolute -top-20 right-0 h-48 w-1/2 rounded-full bg-cyan/20 blur-3xl" aria-hidden />
          <h2 id="next-heading" className="relative text-2xl font-extrabold sm:text-3xl">
            See how Careficient closes your gaps
          </h2>
          <p className="relative mt-2 max-w-2xl text-white/75">
            Book a personalized demo. Your top gaps are added to the booking notes, so the walkthrough starts with what matters to {agency || "your agency"}.
          </p>
          <div className="relative mt-6">
            <ReportActions reportId={id} demoUrl={demoUrl} shareUrl={shareUrl} score={score.total} />
          </div>
        </Card>
      </section>

    </div>
  );
}
