import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { siteUrl } from "@/lib/report.server";
import "./globals.css";

const montserrat = localFont({
  src: [
    { path: "../fonts/montserrat-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/montserrat-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/montserrat-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "../fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/inter-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/inter-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const description =
  "Answer a few questions about your current EMR and get an instant, AI-powered gap analysis across 80+ capabilities, scored and mapped to where Careficient fills each gap.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Careficient EMR Intelligence Assessment",
    template: "%s · Careficient EMR Intelligence Assessment",
  },
  description,
  applicationName: "Careficient EMR Intelligence Assessment",
  keywords: ["home health EMR", "hospice EMR", "EMR evaluation", "EMR checklist", "HOPE", "EVV", "Careficient"],
  openGraph: {
    type: "website",
    siteName: "Careficient",
    title: "Is your EMR holding your agency back?",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Is your EMR holding your agency back?", description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06202E",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const ga = process.env.GA4_ID;
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cyan focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        {children}
        {ga && /^G-[A-Z0-9]+$/.test(ga) ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
