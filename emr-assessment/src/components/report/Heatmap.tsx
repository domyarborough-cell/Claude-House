import { AnswerGlyph } from "@/components/icons/SectionIcon";
import { evaluation, sectionsById } from "@/lib/content";
import type { ItemResult } from "@/lib/scoring";
import { answerColor } from "@/styles/tokens";

const LABEL: Record<string, string> = { yes: "Yes", partial: "Partially", no: "No", unsure: "Not sure" };

/**
 * Every checklist item as a cell, grouped by section. Hover or keyboard focus
 * shows the item name in a CSS tooltip, so the grid needs no JavaScript.
 */
export function Heatmap({ items }: { items: ItemResult[] }) {
  const sectionIds = [...new Set(items.map((i) => i.sectionId))];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-white/80" aria-hidden>
        {evaluation.answerOptions.map((o) => (
          <span key={o.id} className="inline-flex items-center gap-1.5">
            <span style={{ color: answerColor[o.id] }}>
              <AnswerGlyph answer={o.id} className="h-4 w-4" />
            </span>
            {o.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-white/80" /> Critical item
        </span>
      </div>

      <div className="space-y-2.5">
        {sectionIds.map((sid) => {
          const section = sectionsById.get(sid)!;
          return (
            <div key={sid} className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[200px_1fr]">
              <div className="truncate text-xs font-semibold text-white/75">{section.title}</div>
              <ul className="flex flex-wrap gap-1.5" aria-label={section.title}>
                {items
                  .filter((i) => i.sectionId === sid)
                  .map((item) => {
                    const a = item.answer ?? "unsure";
                    const color = answerColor[a];
                    return (
                      <li key={item.id} className="group/cell relative">
                        <span
                          tabIndex={0}
                          role="img"
                          aria-label={`${item.label}: ${LABEL[a]}${item.critical ? " (critical)" : ""}`}
                          className="grid h-7 w-7 cursor-default place-items-center rounded-md outline-none transition-transform group-hover/cell:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-cyan"
                          style={{
                            background: `${color}${a === "unsure" ? "33" : "40"}`,
                            border: `${item.critical ? 2 : 1}px solid ${item.critical ? "#ffffffcc" : `${color}80`}`,
                            color,
                          }}
                        >
                          <AnswerGlyph answer={a} className="h-3.5 w-3.5" />
                        </span>
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-white/15 bg-deep px-2.5 py-1.5 text-xs text-white shadow-soft group-focus-within/cell:block group-hover/cell:block"
                        >
                          {item.label}
                          <span className="block" style={{ color }}>
                            {LABEL[a]}
                            {item.critical ? " · critical" : ""}
                          </span>
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">Hover or tab through the grid to see each capability.</p>
    </div>
  );
}
