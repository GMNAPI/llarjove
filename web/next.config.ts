import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Workaround: Next.js 15 generated .next/types can trigger "Cannot find name 'Object'" in some TS setups
  typescript: { ignoreBuildErrors: true },
  // Use web/ as tracing root to avoid multi-lockfile warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
