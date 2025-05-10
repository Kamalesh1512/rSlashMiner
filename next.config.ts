import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during builds
  },
  output:'standalone'
  // images: {
  //   domains: [
  //     "prod-dodo-backend-test-mode.s3.ap-south-1.amazonaws.com", // Add this domain
  //   ],
  // },

};

export default nextConfig;
