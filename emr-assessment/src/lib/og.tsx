import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [m800, m700, i400] = await Promise.all([
    readFile(join(dir, "montserrat-latin-800-normal.woff")),
    readFile(join(dir, "montserrat-latin-700-normal.woff")),
    readFile(join(dir, "inter-latin-400-normal.woff")),
  ]);
  return [
    { name: "Montserrat", data: m800, weight: 800 as const, style: "normal" as const },
    { name: "Montserrat", data: m700, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: i400, weight: 400 as const, style: "normal" as const },
  ];
}

export async function logoDataUrl() {
  const buf = await readFile(join(process.cwd(), "public/brand/careficient-logo-white.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** Background node pattern for OG cards. */
export function OgNodes() {
  const pts = [[80, 90], [220, 40], [380, 120], [980, 70], [1120, 160], [1060, 520], [900, 580], [150, 540], [60, 380], [1150, 360]];
  return (
    <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
      {pts.slice(1).map(([x, y], i) => (
        <line key={i} x1={pts[i][0]} y1={pts[i][1]} x2={x} y2={y} stroke="#6CB4E4" strokeOpacity="0.18" strokeWidth="1.5" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4} fill={i % 2 ? "#22D3EE" : "#6CB4E4"} fillOpacity="0.6" />
      ))}
    </svg>
  );
}

/** Score ring as an SVG for OG/PDF use. */
export function ScoreRing({ total, color, size = 300 }: { total: number; color: string; size?: number }) {
  const r = 120;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, total / 50));
  return (
    <svg width={size} height={size} viewBox="0 0 300 300">
      <circle cx="150" cy="150" r={r} fill="none" stroke="rgba(108,180,228,0.18)" strokeWidth="22" />
      <circle cx="150" cy="150" r={r} fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 150 150)" />
    </svg>
  );
}
