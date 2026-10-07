import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  async redirects() {
    return [
      { source: "/runbooks/101", destination: "/runbooks/301", permanent: false },
      { source: "/runbooks/201", destination: "/runbooks/301", permanent: false },
      { source: "/workflows", destination: "/runbooks/301", permanent: false },
      { source: "/workflows/:slug", destination: "/runbooks/301", permanent: false },
    ];
  },
};

export default nextConfig;
