import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG card route reads font files from disk at request time; include
  // them in the serverless bundle so production renders match the preview.
  outputFileTracingIncludes: {
    "/api/card/[stackId]": ["./assets/fonts/*.ttf"],
  },
};

export default nextConfig;
