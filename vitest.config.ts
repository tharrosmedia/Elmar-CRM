// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // Use 'jsdom' if testing browser-like code
    globals: true, // Allows using describe/it/expect without imports
  },
});