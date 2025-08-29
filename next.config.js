// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  outputFileTracingRoot: '/Users/elmarcorphq/Documents/Coding Projects/Elmar CRM',
  experimental: {
    reactCompiler: true,
    turbopack: { resolve: true }, // Explicitly enable to reduce warning
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: '*.dialpad.com' },
    ],
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
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
        destination: 'https://api.elmarhvac.com/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.css$/,
      use: ['@tailwindcss/vite'],
    });
    return config;
  },
};
module.exports = nextConfig;