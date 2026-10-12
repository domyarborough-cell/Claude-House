import { createElement } from "react";
import type { IconId } from "@/lib/content";
import { ICON_SHAPES } from "@/lib/icons";

/**
 * Original section icon set: 24px grid, 1.75 stroke, round caps/joins.
 * Paths draw in on hover of any `.group` ancestor (see globals.css `.icon-draw`).
 */
export function SectionIcon({
  icon,
  className = "h-6 w-6",
  animateIn = false,
  title,
}: {
  icon: IconId;
  className?: string;
  animateIn?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon-draw ${animateIn ? "animate-in" : ""} ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {ICON_SHAPES[icon].map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}

/** Answer glyphs: check, half, x, question. */
export function AnswerGlyph({ answer, className = "h-6 w-6" }: { answer: "yes" | "partial" | "no" | "unsure"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" strokeWidth={1.6} opacity={0.55} />
      {answer === "yes" && <polyline points="7.5,12.3 10.6,15.3 16.5,9.2" />}
      {answer === "partial" && <path d="M12 2.5a9.5 9.5 0 010 19z" fill="currentColor" stroke="none" opacity={0.85} />}
      {answer === "no" && <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />}
      {answer === "unsure" && (
        <>
          <path d="M9.5 9.5a2.6 2.6 0 115 1c-.7 1-2.4 1.4-2.4 3" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
