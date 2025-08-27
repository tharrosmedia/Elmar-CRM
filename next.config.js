// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Standalone build for Cloudflare Pages/Workers
  reactStrictMode: true, // Catch React issues in dev
  outputFileTracingRoot: '/Users/elmarcorphq/Documents/Coding Projects/Elmar CRM', // Project root for dependency tracing
  experimental: {
    reactCompiler: true, // Enable React Compiler for auto-memoization (Next.js 15)
    turbopack: true, // Faster builds with Turbopack (Next.js 15)
    optimizeServer: true, // Optimize server components for Edge
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudflare.com', // For R2-hosted media (e.g., tenant logos, Dialpad media)
      },
      {
        protocol: 'https',
        hostname: '*.dialpad.com', // For Dialpad media URLs
      },
    ],
    minimumCacheTTL: 60, // Cache images for 60s (aligns with API caching)
    formats: ['image/avif', 'image/webp'], // Modern formats for performance
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; img-src 'self' data: https://*.cloudflare.com https://*.dialpad.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' https://*.dialpad.com; connect-src 'self' https://api.elmarhvac.com https://*.dialpad.com; frame-ancestors 'none';",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.elmarhvac.com/:path*', // Proxy API requests to Workers
      },
    ];
  },
  i18n: {
    locales: ['en', 'es', 'fr'], // Example locales for next-intl
    defaultLocale: 'en',
    localeDetection: true, // Auto-detect based on Accept-Language
  },
  eslint: {
    ignoreDuringBuilds: false, // Enforce ESLint in CI/CD
  },
  typescript: {
    ignoreBuildErrors: false, // Enforce type safety in CI/CD
  },
};

module.exports = nextConfig;