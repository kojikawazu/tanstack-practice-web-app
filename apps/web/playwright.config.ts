import { defineConfig } from '@playwright/test';

/**
 * E2E。事前に docker compose up + db:migrate + db:seed 済みで、api を起動しておくこと。
 * web は webServer で自動起動する。
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
