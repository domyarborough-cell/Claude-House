"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCanRender3D } from "@/lib/hooks";

const HeroNetwork3D = dynamic(() => import("./HeroNetwork3D"), { ssr: false, loading: () => null });

/** Static SVG version of the network, shown first and kept on low-power devices or reduced motion. */
export function NetworkFallback() {
  const nodes: [number, number, number][] = [
    [200, 60, 3], [120, 110, 2.5], [280, 100, 3.5], [70, 190, 2.5], [180, 170, 4], [320, 180, 3],
    [250, 240, 3], [110, 270, 3.5], [340, 280, 2.5], [200, 310, 3], [150, 350, 2.5], [270, 350, 3.5], [60, 320, 2],
  ];
  const links = [[0, 1], [0, 2], [1, 4], [2, 4], [2, 5], [1, 3], [3, 4], [4, 6], [5, 6], [3, 7], [4, 7], [6, 8], [5, 8], [6, 9], [7, 9], [9, 10], [9, 11], [8, 11], [7, 12], [10, 12]];
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="hn-glow">
          <stop offset="0%" stopColor="#E6FBFF" />
          <stop offset="40%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(108,180,228,0.15)" />
      <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(108,180,228,0.1)" />
      {links.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#6CB4E4" strokeOpacity="0.35" />
      ))}
      {nodes.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 4} fill="url(#hn-glow)" opacity="0.5" />
          <circle cx={x} cy={y} r={r} fill={i % 3 === 0 ? "#ffffff" : "#22D3EE"} />
        </g>
      ))}
    </svg>
  );
}

export function HeroVisual() {
  const can3D = useCanRender3D();
  // Wait until the browser is idle so the WebGL bundle never competes with first paint.
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!can3D) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      w.requestIdleCallback(() => setIdle(true), { timeout: 1500 });
    } else {
      const t = setTimeout(() => setIdle(true), 600);
      return () => clearTimeout(t);
    }
  }, [can3D]);

  return (
    <div className="absolute inset-0">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${can3D && idle ? "opacity-0" : "opacity-100"}`}>
        <NetworkFallback />
      </div>
      {can3D && idle ? (
        <div className="absolute inset-0 animate-[fadein_1.2s_ease_forwards]">
          <HeroNetwork3D />
        </div>
      ) : null}
    </div>
  );
}
