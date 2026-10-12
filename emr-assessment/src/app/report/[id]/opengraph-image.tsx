import { ImageResponse } from "next/og";
import { loadReport } from "@/lib/report.server";
import { logoDataUrl, OG_SIZE, OgNodes, ogFonts, ScoreRing } from "@/lib/og";
import { bandColor } from "@/styles/tokens";

export const alt = "EMR Intelligence Assessment score";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = loadReport(id);
  const [fonts, logo] = await Promise.all([ogFonts(), logoDataUrl()]);
  const total = report?.score.total ?? 0;
  const band = report?.score.band;
  const color = band ? bandColor(band.color) : "#22D3EE";
  const agency = report?.profile.agency;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: 70, gap: 60, background: "radial-gradient(circle at 85% 0%, #0f4a66 0%, #06202E 60%)", color: "white", fontFamily: "Inter", position: "relative" }}>
        <OgNodes />
        <div style={{ position: "relative", width: 360, height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ScoreRing total={total} color={color} size={360} />
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontFamily: "Montserrat", fontWeight: 800, fontSize: 120, color, lineHeight: 1 }}>{report ? total : "?"}</div>
            <div style={{ display: "flex", fontSize: 28, color: "#9DB8CA" }}>out of 50</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <img src={logo} width={210} height={56} alt="" />
          <div style={{ display: "flex", marginTop: 36, fontSize: 26, color: "#22D3EE", fontFamily: "Montserrat", fontWeight: 700, letterSpacing: 2 }}>EMR INTELLIGENCE ASSESSMENT</div>
          {agency ? <div style={{ display: "flex", marginTop: 12, fontSize: 32, color: "#E2EEF5" }}>{agency}</div> : null}
          <div style={{ display: "flex", marginTop: 18, fontFamily: "Montserrat", fontWeight: 800, fontSize: 50, lineHeight: 1.1, color }}>{band?.label ?? "Take the assessment"}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
