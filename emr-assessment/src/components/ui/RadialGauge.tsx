"use client";
import { useCountUp } from "@/lib/hooks";
import { healthColor } from "@/styles/tokens";

const SWEEP = 270; // degrees of arc
const START = 135; // degrees, measured clockwise from +x
const CX = 100;
const CY = 100;
const R = 80;
const CIRC = (SWEEP / 360) * 2 * Math.PI * R;

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(from: number, to: number) {
  const a = polar(R, from);
  const b = polar(R, to);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

const TRACK = arcPath(START, START + SWEEP);
const TICKS = Array.from({ length: 28 }, (_, i) => {
  const deg = START + (SWEEP / 27) * i;
  return { a: polar(93, deg), b: polar(i % 3 === 0 ? 86 : 89, deg), major: i % 3 === 0 };
});
const NEEDLE_IN = polar(50, 0);
const NEEDLE_OUT = polar(68, 0);

/**
 * Animated radial gauge with needle sweep and count-up, driven by CSS
 * (keyframes on first paint, transitions on change; both off under reduced motion).
 * `value` is on a 0..`max` scale; color shifts red → amber → green by percentage.
 */
export function RadialGauge({
  value,
  max = 100,
  size = 220,
  label,
  sublabel,
  suffix = "",
  colorOverride,
  showNeedle = true,
  pulseKey,
  ariaLabel,
}: {
  value: number | null;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  suffix?: string;
  colorOverride?: string;
  showNeedle?: boolean;
  /** Changing this key triggers a brief glow pulse (e.g. when a section score lands). */
  pulseKey?: string | number;
  ariaLabel?: string;
}) {
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  const color = colorOverride ?? healthColor(value === null ? null : pct * 100);
  const shown = useCountUp(value ?? 0, value !== null, 1200);
  const needleDeg = START + SWEEP * pct;

  return (
    <div
      className="relative inline-flex flex-col items-center"
      style={{ width: size }}
      role="img"
      aria-label={ariaLabel ?? `${label ?? "Score"}: ${value ?? "not yet available"}${suffix} out of ${max}${suffix}`}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible" aria-hidden>
        <defs>
          <filter id="gauge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {TICKS.map((t, i) => (
          <line key={i} x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} stroke="rgba(157,184,202,0.35)" strokeWidth={t.major ? 1.4 : 0.8} />
        ))}
        <path d={TRACK} fill="none" stroke="rgba(108,180,228,0.15)" strokeWidth={12} strokeLinecap="round" />
        <path
          d={TRACK}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          filter="url(#gauge-glow)"
          strokeDasharray={CIRC}
          className="gauge-fill"
          style={{ strokeDashoffset: CIRC * (1 - pct), ["--gauge-circ" as string]: CIRC }}
        />
        {showNeedle && (
          <g className="gauge-needle" style={{ transform: `rotate(${needleDeg}deg)` }}>
            <line x1={NEEDLE_IN.x} y1={NEEDLE_IN.y} x2={NEEDLE_OUT.x} y2={NEEDLE_OUT.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
            <circle cx={NEEDLE_OUT.x} cy={NEEDLE_OUT.y} r={3} fill="#ffffff" />
          </g>
        )}
        {pulseKey ? <circle key={String(pulseKey)} cx={CX} cy={CY} r={80} fill="none" stroke={color} strokeWidth={2} className="gauge-pulse" /> : null}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.36 }} aria-hidden>
        <span className="font-display font-extrabold tabular-nums leading-none" style={{ fontSize: size * 0.2, color }}>
          {value === null ? "—" : shown}
          {value !== null && suffix ? <span className="align-top text-[0.45em]">{suffix}</span> : null}
        </span>
        {label ? <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</span> : null}
        {sublabel ? <span className="mt-0.5 text-xs text-muted">{sublabel}</span> : null}
      </div>
    </div>
  );
}
