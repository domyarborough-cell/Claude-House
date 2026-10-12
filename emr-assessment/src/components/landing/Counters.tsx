"use client";
import { useCountUp, useInViewOnce } from "@/lib/hooks";

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>("-40px 0px");
  const shown = useCountUp(value, inView, 1600);
  return (
    <div ref={ref} className="text-center sm:text-left">
      <div className="font-display text-3xl font-extrabold tabular-nums text-white sm:text-4xl">
        <span className="sr-only">
          {value.toLocaleString("en-US")}
          {suffix} {label}
        </span>
        <span aria-hidden>
          {shown.toLocaleString("en-US")}
          <span className="text-cyan">{suffix}</span>
        </span>
      </div>
      <div aria-hidden className="mt-1 text-sm text-muted">
        {label}
      </div>
    </div>
  );
}

export function Counters({ stats }: { stats: { value: number; suffix: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-10">
      {stats.map((s) => (
        <Counter key={s.label} {...s} />
      ))}
    </div>
  );
}
