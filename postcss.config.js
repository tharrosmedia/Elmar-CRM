// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // Updated to use the separate PostCSS plugin
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {}),
  },
};