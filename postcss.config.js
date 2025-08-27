// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {}, // Process Tailwind CSS
    autoprefixer: {}, // Vendor prefixes for cross-browser compatibility
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}), // Minify CSS in production
  },
};