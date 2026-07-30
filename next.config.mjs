import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Header keselamatan (gred A) — corak e-Surau.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },   // foto tapak (dah resize di klien)
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
