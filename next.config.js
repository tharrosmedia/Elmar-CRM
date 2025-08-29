// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Standalone build for Cloudflare Pages/Workers
  reactStrictMode: true, // Catch React issues
  outputFileTracingRoot: '/Users/elmarcorphq/Documents/Coding Projects/Elmar CRM', // Project root
  experimental: {
    reactCompiler: true, // Enable React Compiler (requires babel-plugin-react-compiler)
    turbopack: true, // Enable Turbopack for faster builds
    // Removed 'optimizeServer' as it's not a valid option in v15.5.2
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudflare.com' }, // R2-hosted media
      { protocol: 'https', hostname: '*.dialpad.com' }, // Dialpad media
    ],
    minimumCacheTTL: 60, // 60s cache
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
        destination: 'https://api.elmarhvac.com/:path*', // Proxy to Workers
      },
    ];
  },
  // Remove i18n config; use next-intl or custom solution
  // i18n: {
  //   locales: ['en', 'es', 'fr'],
  //   defaultLocale: 'en',
  //   localeDetection: true,
  // },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.css$/,
      use: ['@tailwindcss/vite'], // v4 integration with Vite
    });
    return config;
  },
};
module.exports = nextConfig;