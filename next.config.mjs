import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    // Product photos live in Vercel Blob; Next.js resizes them per device and caches the result.
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days — uploaded files never change (new upload = new address)
  },
};
export default withNextIntl(nextConfig);
