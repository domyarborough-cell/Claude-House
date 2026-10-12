"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { healthColor } from "@/styles/tokens";

const COLORS = ["#22D3EE", "#6CB4E4", "#34D399", "#FFFFFF", "#FBBF24"];

export interface CelebrationState {
  id: number;
  title: string;
  rating: number;
  /** Viewport point to fly the badge into (center of the live gauge). */
  dest: { x: number; y: number };
  origin: { x: number; y: number };
}

/**
 * Section-complete moment: a small confetti burst and the section's score badge
 * flying into the live gauge. Renders nothing under reduced motion.
 */
export function Celebration({ state, onDone }: { state: CelebrationState | null; onDone: () => void }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const angle = (i / 26) * Math.PI * 2 + ((state?.id ?? 0) % 7) * 0.3;
        const dist = 90 + ((i * 37) % 70);
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 40, rot: (i * 47) % 360, color: COLORS[i % COLORS.length], w: i % 3 ? 6 : 9 };
      }),
    [state?.id],
  );

  if (!state || reduce) return null;
  const color = healthColor(state.rating * 20);
  const { origin, dest } = state;

  return (
    <div key={state.id} className="pointer-events-none fixed inset-0 z-50" aria-hidden>
      <div className="absolute" style={{ left: origin.x, top: origin.y }}>
        {pieces.map((p, i) => (
          <motion.span
            key={i}
            className="absolute block rounded-sm"
            style={{ width: p.w, height: p.w * 0.45, background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: p.y + 60, opacity: 0, rotate: p.rot }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1] }}
          />
        ))}
      </div>
      <motion.div
        className="absolute left-0 top-0 flex items-center gap-2 rounded-full border px-4 py-2 font-display text-sm font-bold text-white"
        style={{ borderColor: color, background: "rgba(6,32,46,0.92)", boxShadow: `0 0 24px ${color}80` }}
        initial={{ x: origin.x - 90, y: origin.y - 20, scale: 0.6, opacity: 0 }}
        animate={{
          x: [origin.x - 90, origin.x - 90, dest.x - 60],
          y: [origin.y - 20, origin.y - 40, dest.y - 16],
          scale: [0.6, 1.1, 0.4],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 1.4, times: [0, 0.35, 1], ease: "easeInOut" }}
        onAnimationComplete={onDone}
      >
        <span className="max-w-[9rem] truncate">{state.title}</span>
        <span style={{ color }}>{state.rating}/5</span>
      </motion.div>
    </div>
  );
}
