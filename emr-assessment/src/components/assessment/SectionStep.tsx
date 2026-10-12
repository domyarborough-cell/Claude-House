"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { AnswerId, Section } from "@/lib/content";
import type { Answers } from "@/lib/scoring";
import { AnswerOptions } from "./AnswerOptions";
import { SectionHeader } from "./SectionHeader";

export function SectionStep({
  section,
  index,
  count,
  answers,
  onAnswer,
  onBack,
  onNext,
  isLast,
}: {
  section: Section;
  index: number;
  count: number;
  answers: Answers;
  onAnswer: (itemId: string, answer: AnswerId) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const answered = section.items.filter((i) => answers[i.id]).length;
  const remaining = section.items.length - answered;
  const complete = remaining === 0;

  return (
    <div className="space-y-6">
      <SectionHeader key={section.id} icon={section.icon} eyebrow={`Section ${index + 1} of ${count}`} title={section.title} intro={section.intro} />

      <ol className="space-y-3">
        {section.items.map((item, i) => {
          const value = answers[item.id];
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className={`glass rounded-2xl p-4 transition-colors sm:p-5 ${value ? "border-white/15" : ""}`}
            >
              <div className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-muted">{i + 1}</span>
                <p id={`${item.id}-label`} className="font-semibold leading-snug">
                  {item.label}
                  {item.critical ? (
                    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-warn">
                      Critical
                    </span>
                  ) : null}
                </p>
              </div>
              <AnswerOptions itemId={item.id} label={item.label} value={value} onChange={(a) => onAnswer(item.id, a)} />
            </motion.li>
          );
        })}
      </ol>

      <div className="flex flex-col-reverse items-stretch gap-3 pb-28 sm:flex-row sm:items-center sm:justify-between lg:pb-0">
        <button type="button" className="btn-ghost" onClick={onBack}>
          Back
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <AnimatePresence>
            {!complete ? (
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted underline decoration-white/30 underline-offset-4 hover:text-white"
                onClick={() => section.items.forEach((item) => !answers[item.id] && onAnswer(item.id, "unsure"))}
              >
                Mark {remaining} remaining as Not sure
              </motion.button>
            ) : null}
          </AnimatePresence>
          <button type="button" className="btn-primary" disabled={!complete} onClick={onNext}>
            {complete ? (isLast ? "Analyze my EMR" : "Next section") : `${answered} of ${section.items.length} answered`}
          </button>
        </div>
      </div>
    </div>
  );
}
