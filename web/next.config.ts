import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
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
