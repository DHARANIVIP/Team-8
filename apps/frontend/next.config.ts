import type { NextConfig } from 'next';

// On Vercel: NEXT_PUBLIC_API_URL points to your Render backend (e.g. https://team8-backend.onrender.com)
// Locally:   falls back to http://localhost:3001
const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
