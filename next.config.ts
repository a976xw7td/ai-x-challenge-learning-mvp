import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
