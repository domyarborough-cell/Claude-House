/**
 * Subtle node-network pattern behind every page (echoes the PDF artwork).
 * Pure SVG + CSS so it costs nothing on load; the drift stops under reduced motion.
 */
const NODES: [number, number][] = [
  [60, 80], [210, 40], [340, 130], [480, 60], [620, 150], [760, 70], [900, 160], [1040, 60], [1160, 140],
  [120, 260], [280, 300], [430, 240], [560, 330], [700, 260], [850, 340], [990, 250], [1130, 320],
  [40, 450], [200, 500], [360, 420], [520, 520], [660, 440], [800, 530], [950, 450], [1100, 510],
  [100, 680], [260, 640], [420, 720], [580, 650], [740, 730], [880, 660], [1020, 720], [1170, 660],
];

function edges(): [number, number][] {
  const out: [number, number][] = [];
  NODES.forEach(([x1, y1], i) => {
    NODES.forEach(([x2, y2], j) => {
      if (j <= i) return;
      const d = Math.hypot(x1 - x2, y1 - y2);
      if (d < 210) out.push([i, j]);
    });
  });
  return out;
}

const EDGES = edges();

export function NetworkBackdrop({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict] ${className}`} style={{ background: "var(--page-bg)" }}>
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full opacity-[0.22] will-change-transform motion-safe:animate-[float_24s_ease-in-out_infinite]"
      >
        <defs>
          <radialGradient id="nb-fade" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#6CB4E4" stopOpacity="1" />
            <stop offset="100%" stopColor="#6CB4E4" stopOpacity="0" />
          </radialGradient>
          <mask id="nb-mask">
            <rect width="1200" height="800" fill="url(#nb-fade)" />
          </mask>
        </defs>
        <g mask="url(#nb-mask)" stroke="#6CB4E4" strokeWidth="0.8">
          {EDGES.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} strokeOpacity="0.5" />
          ))}
          {NODES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3.2 : 2} fill={i % 7 === 0 ? "#22D3EE" : "#6CB4E4"} stroke="none" />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,#06202E_85%)]" />
    </div>
  );
}
