// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // Updated to v4 plugin
    autoprefixer: {}, // Vendor prefixes
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {}), // Optimized minification
  },
};