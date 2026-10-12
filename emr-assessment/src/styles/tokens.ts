/**
 * Design tokens. CSS custom properties in globals.css mirror these values;
 * this module is for places CSS can't reach (SVG charts, canvas, PDF, OG images).
 */
export const colors = {
  navy: "#0B2A3C",
  deepNavy: "#06202E",
  ink: "#041824",
  lightBlue: "#6CB4E4",
  cyan: "#22D3EE",
  white: "#FFFFFF",
  muted: "#9DB8CA",
  line: "rgba(108, 180, 228, 0.18)",
  good: "#34D399",
  warn: "#FBBF24",
  bad: "#F87171",
  unknown: "#94A3B8",
} as const;

export const gradients = {
  brand: "linear-gradient(135deg, #22D3EE 0%, #6CB4E4 55%, #3B82C4 100%)",
  page: "radial-gradient(1200px 600px at 80% -10%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(900px 500px at -10% 20%, rgba(108,180,228,0.12), transparent 60%), #06202E",
  glass: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
} as const;

export const glows = {
  cyan: "0 0 0 1px rgba(34,211,238,0.35), 0 0 32px rgba(34,211,238,0.25)",
  soft: "0 10px 40px rgba(2, 12, 20, 0.45)",
} as const;

export const radii = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;

export const typeScale = {
  display: "clamp(2.5rem, 6vw, 4.75rem)",
  h1: "clamp(2rem, 4vw, 3rem)",
  h2: "clamp(1.5rem, 3vw, 2.25rem)",
  h3: "1.25rem",
  body: "1rem",
  small: "0.875rem",
} as const;

/** Color for a 1-5 category rating. */
export function ratingColor(rating: number): string {
  if (rating >= 4) return colors.good;
  if (rating === 3) return colors.warn;
  return colors.bad;
}

/** Red → amber → green for a 0-100 health percentage. */
export function healthColor(pct: number | null): string {
  if (pct === null) return colors.unknown;
  if (pct >= 75) return colors.good;
  if (pct >= 50) return colors.warn;
  return colors.bad;
}

export function bandColor(band: "green" | "amber" | "red"): string {
  return band === "green" ? colors.good : band === "amber" ? colors.warn : colors.bad;
}

export const answerColor = {
  yes: colors.good,
  partial: colors.warn,
  no: colors.bad,
  unsure: colors.unknown,
} as const;
