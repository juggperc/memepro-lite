import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'docs.manifold.markets' },
      { protocol: 'https', hostname: 'kalshi.com' },
      { protocol: 'https', hostname: 'cdn.kalshi.com' },
    ],
  },
};

export default nextConfig;
