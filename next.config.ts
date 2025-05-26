import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/place",
  assetPrefix: "/place",
  experimental: {
    serverActions: {
      allowedOrigins: ["eddiezhuang.com"],
    },
  },
};

export default nextConfig;
