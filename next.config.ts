import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during builds
  },
  // transpilePackages: ["got-scraping", "@ulixee/undici"],
  // webpack: (config) => {
  //   config.module.rules.push({
  //     test: /\.json$/,
  //     type: "json",
  //   });
  //   return config;
  // },
  output: "standalone",
};

export default nextConfig;
