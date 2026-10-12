"use client";
import { forwardRef } from "react";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { healthColor } from "@/styles/tokens";
import { useCountUp } from "@/lib/hooks";

/** Live "EMR Health" gauge: pinned at the side on desktop, a bottom bar on mobile. */
export const HealthDock = forwardRef<HTMLDivElement, { health: number | null; answered: number; total: number; pulseKey: number; sectionsDone: { title: string; rating: number }[] }>(
  function HealthDock({ health, answered, total, pulseKey, sectionsDone }, ref) {
    const color = healthColor(health);
    const shown = useCountUp(health ?? 0, health !== null, 800);
    return (
      <>
        <aside className="hidden lg:block" aria-label="Live EMR health">
          <div className="glass sticky top-24 rounded-[24px] p-5 text-center">
            <p className="eyebrow">EMR Health</p>
            <div ref={ref} className="mt-2 flex justify-center">
              <RadialGauge value={health} size={200} suffix="%" label="live score" pulseKey={pulseKey} />
            </div>
            <p className="mt-1 text-xs text-muted" aria-live="polite">
              {answered} of {total} capabilities answered
            </p>
            {sectionsDone.length ? (
              <ul className="mt-4 space-y-1.5 text-left text-xs">
                {sectionsDone.map((s) => (
                  <li key={s.title} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                    <span className="truncate text-white/80">{s.title}</span>
                    <span className="font-bold tabular-nums" style={{ color: healthColor(s.rating * 20) }}>
                      {s.rating}/5
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-muted">Your score updates with every answer.</p>
            )}
          </div>
        </aside>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-deep/90 px-4 py-3 backdrop-blur-xl lg:hidden" aria-label="Live EMR health">
          <div className="mx-auto flex max-w-3xl items-center gap-4">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color }}>
                {health === null ? "—" : shown}
              </span>
              {health !== null ? <span className="text-sm text-muted">%</span> : null}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
                <span>EMR Health</span>
                <span>
                  {answered}/{total}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${health ?? 0}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);
