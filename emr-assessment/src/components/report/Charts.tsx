"use client";
import { useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryResult } from "@/lib/scoring";
import { ratingColor } from "@/styles/tokens";

// Validated pair (dark surface): "you / before" vs "Careficient / after".
export const SERIES_YOU = "#5B8DEF";
export const SERIES_CAREFICIENT = "#22D3EE";
const AXIS = "#9DB8CA";
const GRID = "rgba(157,184,202,0.16)";

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-white/15 bg-deep/95 px-3 py-2 text-xs shadow-soft backdrop-blur">
      <div className="mb-1 font-semibold text-white">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-white/80">
          {r.color ? <span className="h-2 w-2 rounded-full" style={{ background: r.color }} /> : null}
          <span>{r.label}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-white">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Only mount charts once they scroll into view so the draw-in animation is seen. */
function useDrawIn() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  return { ref, show: inView || Boolean(reduce), animate: !reduce };
}

export function CategoryRadar({ categories }: { categories: CategoryResult[] }) {
  const { ref, show, animate } = useDrawIn();
  const data = categories.map((c) => ({ name: c.short, full: c.name, you: c.rating, careficient: 5 }));
  return (
    <div ref={ref} className="h-[340px] w-full sm:h-[380px]">
      {show ? (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%" margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
            <PolarGrid stroke={GRID} />
            <PolarAngleAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
            <Radar
              name="Your EMR"
              dataKey="you"
              stroke={SERIES_YOU}
              strokeWidth={2}
              fill={SERIES_YOU}
              fillOpacity={0.32}
              dot={{ r: 4, fill: SERIES_YOU, stroke: "#06202E", strokeWidth: 2 }}
              isAnimationActive={animate}
              animationBegin={300}
              animationDuration={1200}
            />
            <Radar
              name="Careficient standard"
              dataKey="careficient"
              stroke={SERIES_CAREFICIENT}
              strokeWidth={2}
              fill={SERIES_CAREFICIENT}
              fillOpacity={0.04}
              strokeDasharray="5 4"
              isAnimationActive={animate}
              animationDuration={900}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: AXIS }} iconType="circle" itemSorter={null} />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={(payload[0].payload as { full: string }).full}
                    rows={[
                      { label: "Your EMR", value: `${(payload[0].payload as { you: number }).you} / 5`, color: SERIES_YOU },
                      { label: "Careficient standard", value: "5 / 5", color: SERIES_CAREFICIENT },
                    ]}
                  />
                ) : null
              }
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export function CategoryBars({ categories }: { categories: CategoryResult[] }) {
  const { ref, show, animate } = useDrawIn();
  const data = [...categories].sort((a, b) => a.rating - b.rating || a.coverage - b.coverage).map((c) => ({ ...c, label: `${c.rating}/5` }));
  return (
    <div ref={ref} className="h-[380px] w-full">
      {show ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#E2EEF5", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const c = payload[0].payload as CategoryResult;
                return (
                  <TooltipBox
                    title={c.name}
                    rows={[
                      { label: "Rating", value: `${c.rating} / 5`, color: ratingColor(c.rating) },
                      { label: "Coverage", value: `${c.coverage}%` },
                      { label: "Not sure", value: String(c.unsure) },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="rating" radius={[0, 4, 4, 0]} isAnimationActive={animate} animationDuration={900}>
              {data.map((c) => (
                <Cell key={c.id} fill={ratingColor(c.rating)} />
              ))}
              <LabelList dataKey="label" position="right" fill="#E2EEF5" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export function BeforeAfterChart({ series }: { series: { metric: string; before: number; after: number }[] }) {
  const { ref, show, animate } = useDrawIn();
  const [focus, setFocus] = useState<string | null>(null);
  return (
    <div ref={ref} className="h-[300px] w-full">
      {show ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 10, right: 8, bottom: 4, left: -18 }} barGap={2} onMouseLeave={() => setFocus(null)}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="metric" tick={{ fill: AXIS, fontSize: 10 }} interval={0} axisLine={false} tickLine={false} height={42} />
            <YAxis tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={(payload[0].payload as { metric: string }).metric}
                    rows={[
                      { label: "Before Careficient", value: String((payload[0].payload as { before: number }).before), color: SERIES_YOU },
                      { label: "After Careficient", value: String((payload[0].payload as { after: number }).after), color: SERIES_CAREFICIENT },
                    ]}
                  />
                ) : null
              }
            />
            <Legend wrapperStyle={{ fontSize: 12, color: AXIS }} iconType="circle" itemSorter={null} onMouseEnter={(e) => setFocus(String(e.dataKey))} />
            <Bar dataKey="before" name="Before Careficient" fill={SERIES_YOU} radius={[4, 4, 0, 0]} fillOpacity={focus === "after" ? 0.4 : 1} isAnimationActive={animate} />
            <Bar dataKey="after" name="After Careficient" fill={SERIES_CAREFICIENT} radius={[4, 4, 0, 0]} fillOpacity={focus === "before" ? 0.4 : 1} isAnimationActive={animate} animationBegin={250} />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
