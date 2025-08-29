// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {}, // Corrected to tailwindcss (matches installed package)
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {}), // Optimized minification
  },
};