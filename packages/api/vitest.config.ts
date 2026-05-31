import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    // Each file runs in its own worker so DB pools don't cross-contaminate
    pool: 'forks',
    // Print a clear skip message when DB is not reachable
    reporters: ['verbose'],
  },
});
