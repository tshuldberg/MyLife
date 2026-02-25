import path from 'node:path';
import { defineConfig } from '@playwright/test';

const PORT = 3115;
const E2E_DB_PATH = path.join(__dirname, '.tmp', 'e2e', 'mylife-hub-e2e.sqlite');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  globalSetup: require.resolve('./e2e/global-setup'),
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/health`,
    timeout: 180_000,
    // Always start a fresh server so E2E env vars + clean DB reset are deterministic.
    reuseExistingServer: false,
    cwd: __dirname,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      MYLIFE_DB_PATH: E2E_DB_PATH,
      MYLIFE_ENTITLEMENT_SECRET: 'mylife-e2e-entitlement-secret',
      MYLIFE_ENTITLEMENT_ISSUER_KEY: 'mylife-e2e-issuer-key',
      MYLIFE_ENTITLEMENT_SYNC_KEY: 'mylife-e2e-sync-key',
      MYLIFE_BILLING_WEBHOOK_KEY: 'mylife-e2e-webhook-key',
      MYLIFE_HOSTED_API_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
