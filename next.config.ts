import type { NextConfig } from 'next'

// Security headers (PRD §11). HSTS only in production, where the site is served over HTTPS.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
]

const nextConfig: NextConfig = {
  // The portal needs a server (API routes, sessions), so this is a regular Next.js app rather than a static export.
  trailingSlash: true,
  images: { unoptimized: true },
  // Native and file-reading packages run from node_modules instead of being bundled.
  serverExternalPackages: ['@node-rs/argon2', 'pdfkit', 'exceljs'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
