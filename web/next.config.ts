import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Workaround: Next.js 15 generated .next/types can trigger "Cannot find name 'Object'" in some TS setups
  typescript: { ignoreBuildErrors: true },
  // Use web/ as tracing root to avoid multi-lockfile warning
  outputFileTracingRoot: __dirname,
  async redirects() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      { source: '/chat', destination: apiUrl, permanent: false },
    ];
  },
};

export default nextConfig;
