import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Niente intestazione «X-Powered-By: Next.js»: non serve e rivela la tecnologia usata.
  poweredByHeader: false,
  env: {
    // Fornitore di hosting per l'informativa sulla privacy (src/lib/privacy.ts),
    // fissato durante la build: VERCEL e NETLIFY non sempre esistono quando il
    // server risponde.
    BUSSOLA_HOSTING: process.env.VERCEL ? "vercel" : process.env.NETLIFY ? "netlify" : "",
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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
