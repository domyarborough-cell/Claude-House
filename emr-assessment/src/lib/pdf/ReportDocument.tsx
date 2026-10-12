import { Circle, Document, Font, G, Image, Line, Link, Page, Path, Polygon, Polyline, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { join } from "node:path";
import { categoriesById, evaluation, itemsById, programLabel, sectionsById, type IconId } from "@/lib/content";
import { ICON_SHAPES } from "@/lib/icons";
import type { Narrative } from "@/lib/narrative";
import type { Gap, Profile, ScoreResult } from "@/lib/scoring";
import { answerColor, bandColor, colors, ratingColor } from "@/styles/tokens";

const fontDir = join(process.cwd(), "assets/fonts");
Font.register({
  family: "Montserrat",
  fonts: [
    { src: join(fontDir, "montserrat-latin-700-normal.woff"), fontWeight: 700 },
    { src: join(fontDir, "montserrat-latin-800-normal.woff"), fontWeight: 800 },
  ],
});
Font.register({
  family: "Inter",
  fonts: [
    { src: join(fontDir, "inter-latin-400-normal.woff"), fontWeight: 400 },
    { src: join(fontDir, "inter-latin-600-normal.woff"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const brandDir = join(process.cwd(), "public/brand");
const NAVY = colors.navy;
const DEEP = colors.deepNavy;
const CYAN = colors.cyan;
const SKY = colors.lightBlue;
const INK = "#0B2A3C";
const SOFT = "#5B7486";
const PAPER = "#F5F9FC";
const YOU = "#5B8DEF";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, color: INK, backgroundColor: "#FFFFFF", paddingTop: 54, paddingBottom: 54, paddingHorizontal: 44 },
  dark: { backgroundColor: DEEP, color: "#FFFFFF" },
  h1: { fontFamily: "Montserrat", fontWeight: 800, fontSize: 30, lineHeight: 1.1 },
  h2: { fontFamily: "Montserrat", fontWeight: 800, fontSize: 20, marginBottom: 6 },
  h3: { fontFamily: "Montserrat", fontWeight: 700, fontSize: 12 },
  eyebrow: { fontFamily: "Montserrat", fontWeight: 700, fontSize: 8, letterSpacing: 1.6, color: "#0E9FB8", textTransform: "uppercase", marginBottom: 4 },
  body: { fontSize: 10, lineHeight: 1.5, color: "#23404F" },
  muted: { color: SOFT, fontSize: 8.5 },
  header: { position: "absolute", top: 20, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footer: { position: "absolute", bottom: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: SOFT },
  card: { borderRadius: 10, padding: 12, backgroundColor: PAPER, borderWidth: 1, borderColor: "#DCE8F1" },
});

function Icon({ icon, size = 14, color = INK }: { icon: IconId; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {ICON_SHAPES[icon].map(([tag, a], i) => {
        const common = { stroke: color, strokeWidth: 1.75, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
        if (tag === "path") return <Path key={i} d={a.d} {...common} />;
        if (tag === "circle") return <Circle key={i} cx={a.cx} cy={a.cy} r={a.r} {...common} />;
        if (tag === "rect") return <Rect key={i} x={a.x} y={a.y} width={a.width} height={a.height} rx={a.rx} {...common} />;
        return <Polyline key={i} points={a.points} {...common} />;
      })}
    </Svg>
  );
}

function Chrome({ agency }: { agency: string }) {
  return (
    <>
      <View style={s.header} fixed>
        <Image src={join(brandDir, "careficient-logo-navy.png")} style={{ width: 92, height: 24.5 }} />
        <Text style={s.muted}>EMR Intelligence Report{agency ? ` · ${agency}` : ""}</Text>
      </View>
      <View style={s.footer} fixed>
        <Text>careficient.com · Purpose Built for Care. Powered by Partnership.</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

function ScoreRing({ total, color, size = 200, track = SKY }: { total: number; color: string; size?: number; track?: string }) {
  const r = 80;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, total / 50));
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={r} stroke={track} strokeOpacity={0.3} strokeWidth={16} fill="none" />
      <Circle cx={100} cy={100} r={r} stroke={color} strokeWidth={16} fill="none" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 100 100)" />
    </Svg>
  );
}

function RadarSvg({ score, size = 250 }: { score: ScoreResult; size?: number }) {
  const n = score.categories.length;
  const cx = 150;
  const cy = 150;
  const R = 105;
  const pt = (i: number, v: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * R * (v / 5), cy + Math.sin(a) * R * (v / 5)];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      {[1, 2, 3, 4, 5].map((ring) => (
        <Polygon key={ring} points={poly(Array(n).fill(ring))} stroke="#D2E1EC" strokeWidth={0.8} fill="none" />
      ))}
      {score.categories.map((_, i) => {
        const [x, y] = pt(i, 5);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#D2E1EC" strokeWidth={0.8} />;
      })}
      <Polygon points={poly(Array(n).fill(5))} stroke={CYAN} strokeWidth={2} strokeDasharray="5 4" fill={CYAN} fillOpacity={0.05} />
      <Polygon points={poly(score.categories.map((c) => c.rating))} stroke={YOU} strokeWidth={2} fill={YOU} fillOpacity={0.3} />
      {score.categories.map((c, i) => {
        const [x, y] = pt(i, c.rating);
        return <Circle key={c.id} cx={x} cy={y} r={3.2} fill={YOU} />;
      })}
      {score.categories.map((c, i) => {
        const [x, y] = pt(i, 6.15);
        return (
          <Text key={`l-${c.id}`} x={x} y={y + 3} style={{ fontSize: 8, fill: SOFT }} textAnchor="middle">
            {c.short}
          </Text>
        );
      })}
    </Svg>
  );
}

function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i.color }} />
          <Text style={s.muted}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

function CategoryBars({ score }: { score: ScoreResult }) {
  const sorted = [...score.categories].sort((a, b) => a.rating - b.rating || a.coverage - b.coverage);
  return (
    <View style={{ gap: 6 }}>
      {sorted.map((c) => (
        <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ width: 150, fontSize: 8.5 }}>{c.name}</Text>
          <View style={{ flex: 1, height: 8, backgroundColor: "#E4EEF5", borderRadius: 4 }}>
            <View style={{ width: `${c.rating * 20}%`, height: 8, backgroundColor: ratingColor(c.rating), borderRadius: 4 }} />
          </View>
          <Text style={{ width: 26, fontSize: 8.5, fontWeight: 600, textAlign: "right" }}>{c.rating}/5</Text>
        </View>
      ))}
    </View>
  );
}

function Heatmap({ score }: { score: ScoreResult }) {
  const sectionIds = [...new Set(score.items.map((i) => i.sectionId))];
  const short: Record<string, string> = { yes: "Y", partial: "P", no: "N", unsure: "?" };
  return (
    <View style={{ gap: 7 }}>
      {sectionIds.map((sid) => (
        <View key={sid} style={{ flexDirection: "row", alignItems: "center" }} wrap={false}>
          <Text style={{ width: 150, fontSize: 8.5 }}>{sectionsById.get(sid)!.title}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, flex: 1 }}>
            {score.items
              .filter((i) => i.sectionId === sid)
              .map((i) => {
                const a = i.answer ?? "unsure";
                return (
                  <View key={i.id} style={{ width: 17, height: 17, borderRadius: 3, backgroundColor: answerColor[a], opacity: a === "unsure" ? 0.55 : 0.9, alignItems: "center", justifyContent: "center", borderWidth: i.critical ? 1.5 : 0, borderColor: INK }}>
                    <Text style={{ fontSize: 7, color: "#06202E", fontWeight: 600 }}>{short[a]}</Text>
                  </View>
                );
              })}
          </View>
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
        {evaluation.answerOptions.map((o) => (
          <View key={o.id} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: answerColor[o.id] }} />
            <Text style={s.muted}>
              {short[o.id]} = {o.label}
            </Text>
          </View>
        ))}
        <Text style={s.muted}>Outlined = critical item</Text>
      </View>
    </View>
  );
}

function GapRow({ gap, impact }: { gap: Gap; impact: string }) {
  const item = itemsById.get(gap.id)!;
  const section = sectionsById.get(gap.sectionId)!;
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }} wrap={false}>
      <View style={{ flex: 1, borderRadius: 8, padding: 10, backgroundColor: "#FDECEC", borderWidth: 1, borderColor: "#F5C2C2" }}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <Icon icon={section.icon} size={12} color="#C24141" />
          <Text style={{ fontSize: 7, fontFamily: "Montserrat", fontWeight: 700, color: "#C24141", letterSpacing: 1 }}>
            {gap.answer === "no" ? "MISSING" : "PARTIAL"}
            {gap.critical ? " · HIGH RISK" : ""}
          </Text>
        </View>
        <Text style={{ fontSize: 9.5, fontWeight: 600, marginBottom: 3 }}>{item.label}</Text>
        <Text style={{ fontSize: 8.5, lineHeight: 1.45, color: "#4A3434" }}>{impact}</Text>
      </View>
      <View style={{ width: 16, justifyContent: "center", alignItems: "center" }}>
        <Svg width={16} height={12} viewBox="0 0 16 12">
          <Path d="M1 6h12M9 2l4 4-4 4" stroke="#0E9FB8" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Svg>
      </View>
      <View style={{ flex: 1, borderRadius: 8, padding: 10, backgroundColor: "#E6F9FD", borderWidth: 1, borderColor: "#A9E8F4" }}>
        <Text style={{ fontSize: 7, fontFamily: "Montserrat", fontWeight: 700, color: "#0E9FB8", letterSpacing: 1, marginBottom: 4 }}>HOW CAREFICIENT FILLS THIS GAP</Text>
        <Text style={{ fontSize: 8.5, lineHeight: 1.45 }}>{item.careficient.text}</Text>
      </View>
    </View>
  );
}

function Hexagon({ value }: { value: number }) {
  return (
    <View style={{ width: 46, height: 52, alignItems: "center", justifyContent: "center" }}>
      <Svg width={46} height={52} viewBox="0 0 68 76" style={{ position: "absolute", top: 0, left: 0 }}>
        <Path d="M34 2l30 17v38L34 74 4 57V19z" fill="#DCEEFA" stroke="#FFFFFF" strokeWidth={1.5} />
      </Svg>
      <Text style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 11, color: NAVY }}>{value}%</Text>
    </View>
  );
}

function BeforeAfter() {
  const series = evaluation.caseStudy.chart.series;
  const W = 500;
  const H = 105;
  const max = 40;
  const group = W / series.length;
  const bw = 16;
  return (
    <Svg width={W} height={H + 26} viewBox={`0 0 ${W} ${H + 26}`}>
      {[0, 10, 20, 30, 40].map((t) => (
        <Line key={t} x1={0} x2={W} y1={H - (t / max) * H} y2={H - (t / max) * H} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={0.6} />
      ))}
      {series.map((d, i) => {
        const x = i * group + group / 2;
        const hb = (d.before / max) * H;
        const ha = (d.after / max) * H;
        return (
          <G key={d.metric}>
            <Rect x={x - bw - 1} y={H - hb} width={bw} height={hb} fill={YOU} rx={2} />
            <Rect x={x + 1} y={H - ha} width={bw} height={ha} fill={CYAN} rx={2} />
            <Text x={x} y={H + 14} style={{ fontSize: 6.5, fill: "#BBD3E2" }} textAnchor="middle">
              {d.metric}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

export function ReportDocument({
  profile,
  score,
  narrative,
  reportUrl,
  demoUrl,
  qrDataUrl,
  generatedOn,
}: {
  profile: Profile;
  score: ScoreResult;
  narrative: Narrative;
  reportUrl: string;
  demoUrl: string;
  qrDataUrl: string;
  generatedOn: string;
}) {
  const agency = profile.agency?.trim() || "";
  const bc = bandColor(score.band.color);
  const cs = evaluation.caseStudy;
  const allGaps = [...score.highRiskGaps, ...score.gapsByCategory.flatMap((g) => g.gaps)];

  return (
    <Document title={`EMR Intelligence Report${agency ? ` – ${agency}` : ""}`} author="Careficient" subject="EMR gap analysis" creator="Careficient EMR Intelligence Assessment">
      {/* COVER */}
      <Page size="LETTER" style={[s.page, s.dark, { paddingTop: 60 }]}>
        <Svg width={612} height={792} style={{ position: "absolute", top: 0, left: 0 }}>
          {[[60, 120], [180, 60], [520, 90], [560, 260], [470, 700], [90, 650], [40, 420], [580, 520]].map(([x, y], i, arr) => (
            <G key={i}>
              {i > 0 ? <Line x1={arr[i - 1][0]} y1={arr[i - 1][1]} x2={x} y2={y} stroke={SKY} strokeOpacity={0.18} strokeWidth={1} /> : null}
              <Circle cx={x} cy={y} r={i % 2 ? 4 : 3} fill={i % 2 ? CYAN : SKY} fillOpacity={0.6} />
            </G>
          ))}
        </Svg>
        <Image src={join(brandDir, "careficient-logo-white.png")} style={{ width: 150, height: 40 }} />
        <View style={{ marginTop: 90 }}>
          <Text style={[s.eyebrow, { color: CYAN }]}>EMR Intelligence Assessment</Text>
          <Text style={[s.h1, { fontSize: 38, color: "#FFFFFF" }]}>Your EMR Gap Analysis</Text>
          {agency ? <Text style={{ fontSize: 16, marginTop: 10, color: "#D7E7F1" }}>{agency}</Text> : null}
        </View>
        <View style={{ marginTop: 50, alignItems: "center" }}>
          <View style={{ width: 230, height: 230, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", top: 0, left: 0 }}>
              <ScoreRing total={score.total} color={bc} size={230} />
            </View>
            <Text style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 64, color: bc }}>{score.total}</Text>
            <Text style={{ fontSize: 11, color: "#9DB8CA" }}>out of 50</Text>
          </View>
          <Text style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 18, color: bc, marginTop: 18, textAlign: "center" }}>{score.band.label}</Text>
        </View>
        <View style={{ position: "absolute", bottom: 50, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 9, color: "#9DB8CA" }}>
            {programLabel(profile.program).replace(/^./, (c) => c.toUpperCase())} · {profile.locations} location{profile.locations === "1" ? "" : "s"} · {profile.states.join(", ")}
          </Text>
          <Text style={{ fontSize: 9, color: "#9DB8CA" }}>{generatedOn}</Text>
        </View>
      </Page>

      {/* SUMMARY + RADAR */}
      <Page size="LETTER" style={s.page}>
        <Chrome agency={agency} />
        <Text style={s.eyebrow}>Executive summary</Text>
        <Text style={s.h2}>What we found</Text>
        <Text style={[s.body, { fontSize: 11, lineHeight: 1.6 }]}>{narrative.executiveSummary}</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          {[
            { label: "EMR score", value: `${score.total}/50`, color: bc },
            { label: "High-risk gaps", value: String(score.highRiskGaps.length), color: "#C24141" },
            { label: "Total gaps", value: String(allGaps.length), color: "#B7791F" },
            { label: "To verify", value: String(score.unsureItems.length), color: SOFT },
          ].map((k) => (
            <View key={k.label} style={[s.card, { flex: 1, alignItems: "center" }]}>
              <Text style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 18, color: k.color }}>{k.value}</Text>
              <Text style={s.muted}>{k.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 18, marginTop: 22, alignItems: "flex-start" }}>
          <View style={{ width: 250 }}>
            <Text style={s.h3}>Your EMR vs. the Careficient standard</Text>
            <RadarSvg score={score} />
            <Legend items={[{ color: YOU, label: "Your EMR" }, { color: CYAN, label: "Careficient standard" }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.h3, { marginBottom: 10 }]}>Category ratings (1-5)</Text>
            <CategoryBars score={score} />
          </View>
        </View>
      </Page>

      {/* HEATMAP + FIT */}
      <Page size="LETTER" style={s.page}>
        <Chrome agency={agency} />
        <Text style={s.eyebrow}>Capability heatmap</Text>
        <Text style={s.h2}>All {score.itemCount} capabilities</Text>
        <Heatmap score={score} />
        <Text style={[s.eyebrow, { marginTop: 26 }]}>Your Careficient fit</Text>
        <Text style={s.h2}>Where switching would help most</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {narrative.fit.map((f, i) => {
            const cat = categoriesById.get(f.categoryId)!;
            const icon = ({ cloud: "shield", billing: "dollar", eligibility: "inbox", orders: "careplan", interop: "nodes", documentation: "clipboard", alerts: "badge", scheduling: "calendar", analytics: "chart", support: "headset" } as const)[f.categoryId];
            return (
              <View key={f.categoryId} style={[s.card, { flex: 1, backgroundColor: "#EAF9FC", borderColor: "#A9E8F4" }]} wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Icon icon={icon} size={18} color="#0E9FB8" />
                  <Text style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 16, color: "#C5E7EF" }}>0{i + 1}</Text>
                </View>
                <Text style={[s.eyebrow, { marginTop: 6 }]}>{cat.name}</Text>
                <Text style={[s.h3, { fontSize: 10.5, marginBottom: 4 }]}>{f.headline}</Text>
                <Text style={{ fontSize: 8.5, lineHeight: 1.45 }}>{f.body}</Text>
              </View>
            );
          })}
        </View>
      </Page>

      {/* GAPS */}
      {allGaps.length ? (
        <Page size="LETTER" style={s.page}>
          <Chrome agency={agency} />
          <Text style={s.eyebrow}>Gap analysis</Text>
          <Text style={s.h2}>Gaps and how Careficient fills them</Text>
          {score.highRiskGaps.length ? (
            <>
              <Text style={[s.h3, { color: "#C24141", marginTop: 6, marginBottom: 8 }]}>High-risk gaps: fix these first</Text>
              {score.highRiskGaps.map((g) => (
                <GapRow key={g.id} gap={g} impact={narrative.gapImpacts[g.id] ?? itemsById.get(g.id)!.impact} />
              ))}
            </>
          ) : null}
          {score.gapsByCategory.map(({ category, gaps }) => (
            <View key={category.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, marginBottom: 8 }} minPresenceAhead={80}>
                <Text style={s.h3}>{category.name}</Text>
                <Text style={{ fontSize: 8.5, color: ratingColor(category.rating), fontWeight: 600 }}>{category.rating}/5</Text>
              </View>
              {gaps.map((g) => (
                <GapRow key={g.id} gap={g} impact={narrative.gapImpacts[g.id] ?? itemsById.get(g.id)!.impact} />
              ))}
            </View>
          ))}
          {score.unsureItems.length ? (
            <View style={[s.card, { marginTop: 12 }]} wrap={false}>
              <Text style={s.h3}>Verify with your vendor ({score.unsureItems.length})</Text>
              <Text style={[s.muted, { marginBottom: 6 }]}>{evaluation.templates.unsureNote}</Text>
              <Text style={{ fontSize: 8.5, lineHeight: 1.5 }}>{score.unsureItems.map((i) => i.label).join(" · ")}</Text>
            </View>
          ) : null}
        </Page>
      ) : null}

      {/* CASE STUDY */}
      <Page size="LETTER" style={[s.page, s.dark]}>
        <View style={s.header} fixed>
          <Image src={join(brandDir, "careficient-logo-white.png")} style={{ width: 92, height: 24.5 }} />
          <Image src={join(brandDir, "faith-logo.png")} style={{ width: 34, height: 34, backgroundColor: "#FFFFFF", borderRadius: 4 }} />
        </View>
        <Text style={[s.eyebrow, { color: CYAN }]}>Case study · {cs.agency}</Text>
        <Text style={[s.h2, { color: "#FFFFFF" }]}>Data-backed operational improvements with Careficient</Text>
        <Text style={{ fontSize: 9, color: "#C9DCE8", marginBottom: 10 }}>{cs.intro}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {cs.stats.map((st) => (
            <View key={st.label} style={{ width: "48.8%", flexDirection: "row", gap: 8, alignItems: "center", padding: 6, borderRadius: 8, borderWidth: 1, borderColor: "#2A5068", backgroundColor: "#0E3347" }}>
              <Hexagon value={st.value} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: 9.5 }}>{st.label}</Text>
                <Text style={{ fontSize: 7.8, color: "#C9DCE8", lineHeight: 1.4 }}>{st.detail}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 10 }} wrap={false}>
          <Legend items={[{ color: YOU, label: "Before Careficient" }, { color: CYAN, label: "After Careficient" }]} />
          <BeforeAfter />
        </View>
        <View style={{ flexDirection: "row", gap: 14, marginTop: 8, alignItems: "center", padding: 10, borderRadius: 10, backgroundColor: "#0E3347" }} wrap={false}>
          <Image src={join(brandDir, "david-j-jones.png")} style={{ width: 60, height: 70, borderRadius: 8, objectFit: "cover" }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8.8, lineHeight: 1.45, color: "#FFFFFF" }}>“{cs.quote}”</Text>
            <Text style={{ fontSize: 8.5, marginTop: 6, color: CYAN, fontWeight: 600 }}>
              {cs.person.name} · {cs.person.title}
            </Text>
          </View>
        </View>
      </Page>

      {/* CTA */}
      <Page size="LETTER" style={[s.page, s.dark, { justifyContent: "center" }]}>
        <Image src={join(brandDir, "careficient-logo-white.png")} style={{ width: 160, height: 43, marginBottom: 40 }} />
        <Text style={[s.eyebrow, { color: CYAN }]}>Next step</Text>
        <Text style={[s.h1, { color: "#FFFFFF" }]}>See how Careficient closes your gaps.</Text>
        <Text style={{ fontSize: 11, color: "#C9DCE8", marginTop: 12, lineHeight: 1.6, maxWidth: 420 }}>
          {evaluation.company.positioning} Book a personalized demo and we&apos;ll start with the gaps in this report.
        </Text>
        <View style={{ flexDirection: "row", gap: 24, marginTop: 30, alignItems: "center" }}>
          <Image src={qrDataUrl} style={{ width: 120, height: 120, backgroundColor: "#FFFFFF", padding: 6, borderRadius: 8 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Link src={demoUrl} style={{ backgroundColor: CYAN, color: DEEP, padding: 10, borderRadius: 20, fontFamily: "Montserrat", fontWeight: 800, fontSize: 11, textAlign: "center", textDecoration: "none", width: 230 }}>
              Book a personalized demo
            </Link>
            <Text style={{ fontSize: 8.5, color: "#9DB8CA" }}>Scan the code or visit the link to book.</Text>
            <Link src={reportUrl} style={{ fontSize: 8.5, color: SKY }}>
              View this report online
            </Link>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 24, marginTop: 50 }}>
          {evaluation.company.stats.slice(0, 2).map((st) => (
            <View key={st.label}>
              <Text style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 24, color: "#FFFFFF" }}>
                {st.value.toLocaleString("en-US")}
                {st.suffix}
              </Text>
              <Text style={{ fontSize: 9, color: "#9DB8CA" }}>{st.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 8, color: "#9DB8CA", marginTop: 30 }}>{evaluation.company.credentials.map((c) => c.label).join(" · ")}</Text>
      </Page>
    </Document>
  );
}
