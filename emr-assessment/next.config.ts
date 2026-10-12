import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The assessment is almost entirely client-side; plain dynamic rendering keeps
  // the server routes simple. Opt into Cache Components later if needed.
  cacheComponents: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Font files read with fs by the PDF and Open Graph routes.
  outputFileTracingIncludes: {
    "/api/pdf/[id]": ["./assets/fonts/**", "./public/brand/**"],
    "/report/[id]/opengraph-image": ["./assets/fonts/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
