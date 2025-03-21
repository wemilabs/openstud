import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    serverActions: {
      // Ensure server actions are always processed with Edge capabilities
      allowedOrigins: ['*'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ubrw5iu3hw.ufs.sh",
      },
    ],
  },
  // Add serverless function configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
    maxDuration: 60, // Set to maximum duration for your Vercel plan (60s for Pro, 10s for Hobby)
  },
};

export default nextConfig;
