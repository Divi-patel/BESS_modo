import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/basis", destination: "/colocation", permanent: true },
    ];
  },
};

export default nextConfig;
