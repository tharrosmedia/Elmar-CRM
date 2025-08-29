// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // For Cloudflare Workers, consider 'edge' or a custom environment
    globals: true,
  },
});