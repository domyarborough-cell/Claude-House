"use client";
import { SectionIcon } from "@/components/icons/SectionIcon";
import type { IconId } from "@/lib/content";

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${55 + ((i * 23) % 40)}%`,
  delay: `${(i * 0.45) % 6}s`,
  dx: `${((i % 5) - 2) * 14}px`,
  size: i % 4 === 0 ? 5 : 3,
}));

/** Large animated header illustration for a checklist section. */
export function SectionHeader({ icon, eyebrow, title, intro }: { icon: IconId; eyebrow: string; title: string; intro: string }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-navy via-deep to-[#0a3a52] p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{ left: p.left, top: p.top, animationDelay: p.delay, width: p.size, height: p.size, ["--dx" as string]: p.dx }}
          />
        ))}
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" />
      </div>
      <div className="relative flex items-center gap-5 sm:gap-7">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center sm:h-28 sm:w-28">
          <span className="absolute inset-0 rounded-full border border-cyan/40 motion-safe:animate-pulse-ring" aria-hidden />
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan/30 to-sky/10 shadow-[0_0_40px_rgba(34,211,238,0.35)]" aria-hidden />
          <SectionIcon icon={icon} animateIn className="relative h-10 w-10 text-white sm:h-14 sm:w-14" />
        </div>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">{intro}</p>
        </div>
      </div>
    </div>
  );
}
