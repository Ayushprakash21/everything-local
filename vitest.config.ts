import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'mobile/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.chrome_tmp/**'],
    fileParallelism: false,
    testTimeout: 25000,
    hookTimeout: 25000
  }
});
