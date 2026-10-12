import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/brand/Logo";
import { SectionIcon } from "@/components/icons/SectionIcon";
import { Counters } from "@/components/landing/Counters";
import { DeviceMockups } from "@/components/landing/DeviceMockups";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { SampleReportPreview } from "@/components/landing/SampleReportPreview";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkBackdrop } from "@/components/ui/NetworkBackdrop";
import { evaluation } from "@/lib/content";

const STEPS = [
  { title: "Tell us about your agency", body: "Programs, locations, current EMR, and what frustrates your team most." },
  { title: "Answer the checklist", body: "Yes, Partially, No, or Not sure for 80+ capabilities, one section at a time." },
  { title: "Get your scored report", body: "A 10-category score, high-risk gaps, and exactly how Careficient fills each one." },
];

function CredentialIcon({ id }: { id: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (id === "inc5000")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden {...common}>
        <path d="M4 18l5-6 4 3 7-9" />
        <path d="M15 6h5v5" />
      </svg>
    );
  if (id === "age-friendly")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden {...common}>
        <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.6-7.5 10-7.5 10z" />
        <path d="M3 12h4l1.5-2.5L11 15l1.5-3H15" />
      </svg>
    );
  return <SectionIcon icon="badge" className="h-5 w-5" />;
}

export default function Home() {
  return (
    <>
      <NetworkBackdrop />
      <SiteHeader
        right={
          <Link href="/assessment" className="btn-ghost !py-2 text-sm">
            Start assessment
          </Link>
        }
      />
      <main id="main">
        {/* HERO */}
        <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
          <div className="relative z-10">
            <div>
              <p className="eyebrow mb-5">Careficient EMR Intelligence Assessment</p>
              <h1 className="text-[clamp(2.5rem,6vw,4.6rem)] font-extrabold leading-[1.02]">
                <span className="glow-text">Is your EMR holding your agency back?</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl">Get your free AI-powered EMR assessment in 5 minutes.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/assessment" className="btn-primary text-lg">
                  Start my assessment
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <span className="text-sm text-muted">Free · No patient information · Instant score</span>
              </div>
            </div>
            <div className="mt-12">
              <Counters stats={evaluation.company.stats} />
            </div>
          </div>
          <div className="relative min-h-[360px] sm:min-h-[460px]">
            <div className="absolute inset-[-10%] opacity-90">
              <HeroVisual />
            </div>
            <div className="relative z-10 pt-6 sm:pt-10">
              <DeviceMockups />
            </div>
          </div>
        </section>

        {/* CREDIBILITY */}
        <section aria-label="Recognition" className="border-y border-white/10 bg-white/[0.02]">
          <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
            {evaluation.company.credentials.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
                  <CredentialIcon id={c.id} />
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </section>

        {/* HOW IT WORKS + SAMPLE */}
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Reveal>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.4vw,2.6rem)] font-extrabold leading-tight">A gap analysis, not a sales form.</h2>
              <p className="mt-4 max-w-lg text-white/75">
                Built from Careficient&apos;s Complete EMR Evaluation Guide, the assessment scores your current EMR the same way agencies run a formal RFP. You get the score instantly.
              </p>
            </Reveal>
            <ol className="mt-10 space-y-5">
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={0.1 * i} className="glass flex gap-4 rounded-2xl p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan to-sky font-display font-extrabold text-ink">{i + 1}</span>
                  <div>
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal delay={0.1}>
            <SampleReportPreview />
          </Reveal>
        </section>

        {/* WHAT WE ANALYZE */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <Reveal className="text-center">
            <p className="eyebrow">What we analyze</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.4vw,2.6rem)] font-extrabold">12 areas. 10 scored categories.</h2>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {evaluation.sections.map((s, i) => (
              <Reveal as="li" key={s.id} delay={0.03 * i} className="group glass flex items-center gap-3 rounded-2xl p-4 transition hover:border-cyan/50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan">
                  <SectionIcon icon={s.icon} className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold leading-snug">{s.title}</span>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 pt-24 sm:px-6">
          <Reveal className="glass relative overflow-hidden rounded-[32px] p-8 text-center sm:p-14">
            <div className="absolute -top-24 left-1/2 h-48 w-[60%] -translate-x-1/2 rounded-full bg-cyan/25 blur-3xl" aria-hidden />
            <h2 className="relative text-[clamp(1.75rem,3.4vw,2.6rem)] font-extrabold">Find out where your EMR falls short.</h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-white/75">{evaluation.company.positioning} See exactly how it compares to what your agency runs today.</p>
            <Link href="/assessment" className="btn-primary relative mt-8 text-lg">
              Start my assessment
            </Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
