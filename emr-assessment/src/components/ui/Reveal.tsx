/**
 * Scroll-triggered fade-up using CSS scroll-driven animations (no JavaScript).
 * Browsers without `animation-timeline` support, and reduced-motion users, see
 * the content immediately. `delay` staggers siblings slightly.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  return (
    <Tag className={`reveal ${className}`} style={delay ? ({ "--reveal-shift": `${Math.round(delay * 40)}%` } as React.CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}
