import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
