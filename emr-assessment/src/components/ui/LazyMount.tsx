"use client";
import { useInViewOnce } from "@/lib/hooks";

/** Renders children only once the placeholder nears the viewport, so heavy chunks load on demand. */
export function LazyMount({ children, minHeight, className = "" }: { children: React.ReactNode; minHeight: number; className?: string }) {
  const [ref, near] = useInViewOnce<HTMLDivElement>("400px 0px");
  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {near ? children : <div className="skeleton w-full rounded-2xl" style={{ height: minHeight }} />}
    </div>
  );
}
