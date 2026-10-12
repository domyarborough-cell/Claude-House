import Image from "next/image";
import { Counters } from "@/components/landing/Counters";
import { evaluation } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { BeforeAfterIsland } from "./ChartIslands";

function Hexagon({ value }: { value: number }) {
  return (
    <div className="relative grid h-[76px] w-[68px] shrink-0 place-items-center">
      <svg viewBox="0 0 68 76" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="hex-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E9F4FB" />
            <stop offset="100%" stopColor="#8EC3E6" />
          </linearGradient>
        </defs>
        <path d="M34 2l30 17v38L34 74 4 57V19z" fill="url(#hex-fill)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      </svg>
      <span className="relative font-display text-lg font-extrabold text-navy">{value}%</span>
    </div>
  );
}

export function ProofBlock() {
  const cs = evaluation.caseStudy;
  const stats = evaluation.company.stats.slice(0, 2);
  return (
    <section aria-labelledby="proof-heading" className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0b3b55] via-navy to-deep p-6 sm:p-10">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan/15 blur-3xl" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Proof from an agency like yours</p>
          <h2 id="proof-heading" className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Data-backed operational improvements with Careficient
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75">{cs.intro}</p>
        </div>
        <div className="rounded-2xl bg-white p-2">
          <Image src="/brand/faith-logo.png" alt="Faith Home Health and Hospice" width={88} height={88} className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
        </div>
      </div>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
        {cs.stats.map((s, i) => (
          <Reveal key={s.label} delay={0.04 * i} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.06] p-4">
            <Hexagon value={s.value} />
            <div>
              <h3 className="font-sans text-base font-bold">{s.label}</h3>
              <p className="mt-0.5 text-sm text-white/75">{s.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="relative mt-8 rounded-2xl border border-white/10 bg-deep/40 p-4 sm:p-6">
        <h3 className="font-sans text-sm font-semibold text-white/85">Faith Home Health and Hospice: before vs. after Careficient</h3>
        <BeforeAfterIsland series={cs.chart.series} />
        <table className="sr-only">
          <caption>Before and after Careficient</caption>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {cs.chart.series.map((r) => (
              <tr key={r.metric}>
                <td>{r.metric}</td>
                <td>{r.before}</td>
                <td>{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figure className="relative mt-8 grid items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <Image src={cs.person.photo} alt={cs.person.name} width={160} height={186} className="mx-auto h-36 w-32 rounded-2xl object-cover object-top shadow-glow sm:h-44 sm:w-40" />
        <div>
          <svg viewBox="0 0 32 24" className="h-7 w-9 text-cyan" fill="currentColor" aria-hidden>
            <path d="M0 24V14C0 6 4 1 12 0l1 4c-4 1-6 4-6 8h6v12zm19 0V14c0-8 4-13 12-14l1 4c-4 1-6 4-6 8h6v12z" />
          </svg>
          <blockquote className="mt-3 text-lg leading-relaxed text-white/90 sm:text-xl">{cs.quote}</blockquote>
          <figcaption className="mt-4 text-sm">
            <span className="font-bold">{cs.person.name}</span>
            <span className="text-muted"> · {cs.person.title}</span>
          </figcaption>
        </div>
      </figure>

      <div className="relative mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="w-full max-w-md">
          <Counters stats={stats} />
        </div>
        <p className="max-w-sm text-sm text-white/70">{evaluation.company.positioning}</p>
      </div>
    </section>
  );
}
