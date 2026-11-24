import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    // Served as-is: Vercel's image optimisation has a small free monthly allowance, and once it
    // runs out images stop loading (402). Uploads are shrunk in the admin instead (shrinkImage).
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days — uploaded files never change (new upload = new address)
  },
  // Basic hardening: HTTPS only, no framing by other sites (protects the admin from clickjacking),
  // no MIME sniffing.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
export default withNextIntl(nextConfig);
