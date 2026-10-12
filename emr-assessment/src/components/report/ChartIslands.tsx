"use client";
import dynamic from "next/dynamic";
import { LazyMount } from "@/components/ui/LazyMount";
import type { CategoryResult } from "@/lib/scoring";

// Recharts loads only when a chart nears the viewport.
const Radar = dynamic(() => import("./Charts").then((m) => m.CategoryRadar), { ssr: false });
const Bars = dynamic(() => import("./Charts").then((m) => m.CategoryBars), { ssr: false });
const BeforeAfter = dynamic(() => import("./Charts").then((m) => m.BeforeAfterChart), { ssr: false });

export function RadarIsland({ categories }: { categories: CategoryResult[] }) {
  return (
    <LazyMount minHeight={380}>
      <Radar categories={categories} />
    </LazyMount>
  );
}

export function BarsIsland({ categories }: { categories: CategoryResult[] }) {
  return (
    <LazyMount minHeight={380}>
      <Bars categories={categories} />
    </LazyMount>
  );
}

export function BeforeAfterIsland({ series }: { series: { metric: string; before: number; after: number }[] }) {
  return (
    <LazyMount minHeight={300}>
      <BeforeAfter series={series} />
    </LazyMount>
  );
}
