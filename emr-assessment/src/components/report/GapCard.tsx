import { SectionIcon } from "@/components/icons/SectionIcon";
import { itemsById, sectionsById } from "@/lib/content";
import type { Gap } from "@/lib/scoring";

/** "Gap → Solution": red-tinted gap card, animated arrow, cyan Careficient card. */
export function GapCard({ gap, impact, headingLevel = 4 }: { gap: Gap; impact: string | undefined; headingLevel?: 3 | 4 }) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  const item = itemsById.get(gap.id)!;
  const section = sectionsById.get(gap.sectionId)!;

  return (
    <article
      className="reveal group grid items-stretch gap-3 md:grid-cols-[1fr_48px_1fr]"
    >
      <div className="rounded-2xl border border-bad/35 bg-gradient-to-br from-bad/15 to-bad/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bad/15 text-bad">
            <SectionIcon icon={section.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
              <span className="text-bad">{gap.answer === "no" ? "Missing" : "Partial"}</span>
              {gap.critical ? <span className="rounded-full bg-warn/15 px-2 py-0.5 text-warn">High risk</span> : null}
              <span className="font-semibold normal-case tracking-normal text-muted">{section.title}</span>
            </div>
            <Heading className="mt-1 font-sans text-base font-semibold leading-snug">{item.label}</Heading>
            <p className="mt-2 text-sm text-white/80">{impact ?? item.impact}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center text-cyan" aria-hidden>
        <svg viewBox="0 0 48 24" className="h-6 w-12 rotate-90 md:rotate-0">
          <path d="M2 12h38" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="motion-safe:group-hover:animate-[dashflow_1.2s_linear_infinite]" />
          <path d="M34 5l9 7-9 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="rounded-2xl border border-cyan/35 bg-gradient-to-br from-cyan/15 to-cyan/[0.04] p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)] transition-shadow group-hover:shadow-[0_0_36px_rgba(34,211,238,0.22)]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan">How Careficient fills this gap</div>
        <p className="mt-2 text-sm text-white/90">{item.careficient.text}</p>
      </div>
    </article>
  );
}
