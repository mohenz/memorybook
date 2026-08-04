import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/e2e',
  outputDir: '../test-results/playwright',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5180',
    channel: 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-1920',
      use: { viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'mobile-375',
      use: { viewport: { width: 375, height: 812 } },
    },
  ],
});
