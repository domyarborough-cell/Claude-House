"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionIcon } from "@/components/icons/SectionIcon";
import { evaluation, type Section } from "@/lib/content";
import type { Answers } from "@/lib/scoring";
import { answerColor } from "@/styles/tokens";

const STATUS = [
  "Mapping 80+ capabilities",
  "Weighting critical items",
  "Identifying compliance exposure",
  "Scoring 10 categories",
  "Matching gaps to Careficient capabilities",
  "Building your report",
];

const CATEGORY_ICONS = ["shield", "dollar", "inbox", "careplan", "nodes", "clipboard", "badge", "calendar", "chart", "headset"] as const;

/** Full-screen scan over a wireframe of the visitor's answers while the AI report is generated. */
export function AnalyzingScreen({ sections, answers, durationMs, onDone }: { sections: Section[]; answers: Answers; durationMs: number; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      setProgress(p);
      setStatusIndex(Math.min(STATUS.length - 1, Math.floor(p * STATUS.length)));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setTimeout(onDone, 250);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = 54;
  const c = 2 * Math.PI * r;
  const litCategories = Math.floor(progress * evaluation.categories.length + 0.0001);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-deep/95 px-4 backdrop-blur-xl" role="status" aria-live="polite">
      {/* Wireframe of answers */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50" aria-hidden>
        <div className="relative grid w-full max-w-5xl gap-3 px-6" style={{ gridTemplateColumns: `repeat(${Math.min(sections.length, 6)}, minmax(0, 1fr))` }}>
          {sections.map((s) => (
            <div key={s.id} className="rounded-xl border border-sky/20 p-2">
              <div className="mb-2 h-1.5 w-2/3 rounded bg-sky/30" />
              <div className="grid grid-cols-4 gap-1">
                {s.items.map((item) => {
                  const a = answers[item.id] ?? "unsure";
                  return <span key={item.id} className="h-2.5 rounded-sm" style={{ background: answerColor[a], opacity: 0.6 }} />;
                })}
              </div>
            </div>
          ))}
          {!reduce ? (
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
              <div className="h-1/3 w-full bg-gradient-to-b from-transparent via-cyan/25 to-transparent motion-safe:animate-scan" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="relative h-64 w-64">
          {/* category nodes around the ring */}
          {CATEGORY_ICONS.map((icon, i) => {
            const angle = (i / CATEGORY_ICONS.length) * Math.PI * 2 - Math.PI / 2;
            const lit = i < litCategories;
            return (
              <motion.span
                key={icon + i}
                className="absolute grid h-9 w-9 place-items-center rounded-full border"
                style={{ left: 128 + Math.cos(angle) * 112 - 18, top: 128 + Math.sin(angle) * 112 - 18 }}
                animate={{
                  borderColor: lit ? "#22D3EE" : "rgba(108,180,228,0.25)",
                  backgroundColor: lit ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.02)",
                  boxShadow: lit ? "0 0 18px rgba(34,211,238,0.6)" : "0 0 0 rgba(0,0,0,0)",
                  color: lit ? "#ffffff" : "#5d7a8f",
                }}
                transition={{ duration: 0.3 }}
              >
                <SectionIcon icon={icon} className="h-4 w-4" />
              </motion.span>
            );
          })}
          <svg viewBox="0 0 128 128" className="absolute inset-[44px] h-[168px] w-[168px] -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(108,180,228,0.15)" strokeWidth="8" />
            <circle cx="64" cy="64" r={r} fill="none" stroke="#22D3EE" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.7))" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-extrabold tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-extrabold sm:text-3xl">Analyzing your EMR…</h2>
        <motion.p key={statusIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-cyan">
          {STATUS[statusIndex]}
        </motion.p>
      </div>
    </div>
  );
}
