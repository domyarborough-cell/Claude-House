"use client";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { ratingColor } from "@/styles/tokens";

// Illustrative values only; labelled as a sample on screen.
const SAMPLE = [
  { name: "Integrated Billing & Claims", rating: 2 },
  { name: "Advanced Scheduling & EVV", rating: 3 },
  { name: "Real-Time Alerts & Validation", rating: 2 },
  { name: "Analytics & Reporting", rating: 4 },
  { name: "Cloud-Based & Reliable", rating: 5 },
];

export function SampleReportPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="glass relative overflow-hidden rounded-[28px] p-5 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <span className="eyebrow">Sample report</span>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted">Illustrative data</span>
      </div>
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <RadialGauge value={inView ? 27 : null} max={50} size={190} label="EMR score" sublabel="out of 50" />
          <span className="mt-2 rounded-full bg-bad/15 px-3 py-1 text-xs font-semibold text-bad">Your EMR is holding you back</span>
        </div>
        <div className="space-y-3">
          {SAMPLE.map((c, i) => (
            <div key={c.name}>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{c.name}</span>
                <span className="tabular-nums">{c.rating}/5</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ratingColor(c.rating) }}
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${c.rating * 20}%` : 0 }}
                  transition={reduce ? { duration: 0 } : { delay: 0.2 + i * 0.12, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <motion.div
        className="mt-6 grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: reduce ? 0 : 1, duration: 0.6 }}
      >
        <div className="rounded-2xl border border-bad/30 bg-bad/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-bad">High-risk gap</div>
          <div className="mt-1 text-sm font-semibold">Payer rule enforcement engine</div>
          <p className="mt-1 text-xs text-muted">Errors are found by the payer as denials instead of by your team before submission.</p>
        </div>
        <div className="hidden items-center justify-center text-cyan sm:flex" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 12h15M14 6l6 6-6 6" />
          </svg>
        </div>
        <div className="rounded-2xl border border-cyan/30 bg-cyan/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan">How Careficient fills this gap</div>
          <p className="mt-1 text-xs text-white/85">Built-in payer rule enforcement and automated workflow validation reduce errors and billing delays.</p>
        </div>
      </motion.div>
    </div>
  );
}
