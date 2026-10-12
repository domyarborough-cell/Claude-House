import { ImageResponse } from "next/og";
import { logoDataUrl, OG_SIZE, OgNodes, ogFonts } from "@/lib/og";

export const alt = "Careficient EMR Intelligence Assessment: Is your EMR holding your agency back?";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [fonts, logo] = await Promise.all([ogFonts(), logoDataUrl()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, background: "radial-gradient(circle at 85% 0%, #0f4a66 0%, #06202E 60%)", color: "white", fontFamily: "Inter", position: "relative" }}>
        <OgNodes />
        <img src={logo} width={240} height={64} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Montserrat", fontWeight: 800, fontSize: 76, lineHeight: 1.05, maxWidth: 950 }}>Is your EMR holding your agency back?</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#9DB8CA" }}>Get your free AI-powered EMR assessment in 5 minutes.</div>
        </div>
        <div style={{ display: "flex", gap: 40, fontFamily: "Montserrat", fontWeight: 700, fontSize: 28, color: "#22D3EE" }}>
          <span>1,100+ agencies</span>
          <span>2,700+ locations</span>
          <span>80+ capabilities analyzed</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
