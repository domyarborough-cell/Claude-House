"use client";
import { motion, useReducedMotion } from "framer-motion";
import { AnswerGlyph } from "@/components/icons/SectionIcon";
import { evaluation, type AnswerId } from "@/lib/content";
import { answerColor } from "@/styles/tokens";

/**
 * One checklist item's four answers as a native radio group (arrow keys work),
 * styled as glowing cards with a tap animation.
 */
export function AnswerOptions({
  itemId,
  label,
  value,
  onChange,
}: {
  itemId: string;
  label: string;
  value: AnswerId | undefined;
  onChange: (answer: AnswerId) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <legend className="sr-only">{label}</legend>
      {evaluation.answerOptions.map((opt) => {
        const selected = value === opt.id;
        const color = answerColor[opt.id];
        const inputId = `${itemId}-${opt.id}`;
        return (
          <div key={opt.id} className="relative">
            <input
              id={inputId}
              type="radio"
              name={itemId}
              value={opt.id}
              checked={selected}
              onChange={() => onChange(opt.id)}
              className="peer sr-only"
            />
            <motion.label
              htmlFor={inputId}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              animate={selected && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.28 }}
              className="flex cursor-pointer select-none items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-cyan peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-deep"
              style={{
                borderColor: selected ? color : "rgba(108,180,228,0.2)",
                background: selected ? `${color}22` : "rgba(255,255,255,0.03)",
                boxShadow: selected ? `0 0 0 1px ${color}66, 0 0 22px ${color}40` : "none",
                color: selected ? "#fff" : "rgba(255,255,255,0.78)",
              }}
            >
              <span style={{ color }} className="shrink-0">
                <AnswerGlyph answer={opt.id} className="h-5 w-5" />
              </span>
              {opt.label}
            </motion.label>
          </div>
        );
      })}
    </fieldset>
  );
}
