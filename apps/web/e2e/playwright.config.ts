import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the web dev server automatically if not already running
  webServer: process.env.CI
    ? {
        command: 'pnpm --filter web build && pnpm --filter web start',
        url: 'http://localhost:4001',
        reuseExistingServer: false,
        timeout: 120 * 1000,
      }
    : undefined,
})
