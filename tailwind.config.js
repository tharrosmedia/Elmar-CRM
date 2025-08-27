// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Next.js App Router files
    './src/**/*.{ts,tsx}', // Additional source files (components, utilities, etc.)
  ],
  theme: {
    extend: {
      // Customizations for per-tenant branding
      colors: {
        primary: 'hsl(var(--primary) / <alpha-value>)', // Dynamic HSL for tenant-specific colors
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
      },
      // Optimize for mobile-first responsive design
      screens: {
        xs: '475px', // Add extra-small breakpoint for mobile
      },
      // Accessibility: High-contrast focus states
      ringColor: {
        DEFAULT: 'hsl(var(--primary) / 0.5)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // For form styling in self-service portal
    require('@tailwindcss/typography'), // For rich text (e.g., job descriptions)
  ],
  // Enable dark mode for accessibility and tenant branding
  darkMode: 'class', // Use 'class' to toggle dark mode via HTML class
};