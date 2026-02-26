import { defineConfig } from 'vitest/config';
import {
  VITEST_GLOBAL_SETUP_FILE,
  vitestBaseTestConfig,
} from '../../test/vitest/base';

export default defineConfig({
  test: {
    ...vitestBaseTestConfig,
    environment: 'jsdom',
    globals: true,
    setupFiles: [VITEST_GLOBAL_SETUP_FILE, './test/setup.tsx'],
    include: [
      'app/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'lib/**/__tests__/**/*.{test,spec}.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.ts'],
      exclude: ['**/__tests__/**', 'test/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 75,
        branches: 70,
        'app/(hub)/*.tsx': {
          lines: 85,
          statements: 85,
          functions: 90,
          branches: 80,
        },
        'app/(fast)/*.tsx': {
          lines: 85,
          statements: 85,
          functions: 90,
          branches: 70,
        },
        'app/(subs)/*.tsx': {
          lines: 85,
          statements: 85,
          functions: 90,
          branches: 60,
        },
        'app/(surf)/*.tsx': {
          lines: 85,
          statements: 85,
          functions: 75,
          branches: 75,
        },
        'lib/entitlements.ts': {
          lines: 90,
          statements: 90,
          functions: 100,
          branches: 85,
        },
        'lib/server-endpoint.ts': {
          lines: 80,
          statements: 80,
          functions: 100,
          branches: 85,
        },
      },
    },
  },
});
