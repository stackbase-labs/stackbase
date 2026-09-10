import process from 'node:process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/auth', '@workspace/email', '@workspace/db', '@workspace/rate-limiter', '@workspace/utils', '@t3-oss/env-nextjs'],
  output: 'standalone',
  async rewrites() {
    const productionTarget = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
    const developmentTarget = process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL || 'http://localhost:4000';

    const rawApiTarget = process.env.NODE_ENV === 'production' ? productionTarget : developmentTarget;

    if (!rawApiTarget) {
      throw new Error('Missing API rewrite target. Set API_INTERNAL_URL in production.');
    }

    const apiTarget = normalizeApiBaseUrl(rawApiTarget);

    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

const normalizeApiBaseUrl = (value) => {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('API rewrite target is empty. Set API_INTERNAL_URL in production.');
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    throw new Error(`Invalid API rewrite target URL: ${trimmed}`);
  }
};

export default nextConfig;
