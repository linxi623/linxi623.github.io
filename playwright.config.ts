import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:4327', channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: 'chrome' } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4327',
    url: 'http://127.0.0.1:4327',
    reuseExistingServer: !process.env.CI,
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
    timeout: 30_000,
  },
});
