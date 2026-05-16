import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Progressions excerpts (read at runtime by the Plan Architect)
  // into the serverless function for /api/generate-plan. Without this,
  // Vercel's serverless tracing won't include the docs/mapping-kits/
  // markdown files and fs.readFile will fail in production.
  outputFileTracingIncludes: {
    "/api/generate-plan": ["./docs/mapping-kits/**/progressions-excerpt.md"],
  },
};

export default nextConfig;
