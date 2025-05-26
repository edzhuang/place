import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/place",
  experimental: {
    serverActions: {
      allowedOrigins: ["eddiezhuang.com", "place-chi.vercel.app"],
    },
  },
};

export default nextConfig;
