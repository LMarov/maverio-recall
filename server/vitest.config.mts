import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/testSetup.ts'],
    // Integration tests share one Postgres connection pool and truncate
    // tables between tests — running them concurrently would race.
    fileParallelism: false
  }
});
