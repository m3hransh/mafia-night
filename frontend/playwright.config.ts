import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * NixOS-compatible setup:
 * - Uses system browsers from Nix (via PLAYWRIGHT_BROWSERS_PATH)
 * - No browser download (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1)
 * - Browsers installed via flake.nix: playwright-driver.browsers
 */

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use system Chromium from NixOS - explicitly set to undefined to use PLAYWRIGHT_BROWSERS_PATH
        channel: undefined,
        launchOptions: {
          // Let Playwright find the browser in PLAYWRIGHT_BROWSERS_PATH
          executablePath: undefined,
        },
      },
    },

    // Uncomment to test on Firefox (if added to flake.nix)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Uncomment to test on WebKit (if added to flake.nix)
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'cd .. && docker compose up -d postgres && sleep 3 && cd backend && go run ./cmd/api',
      url: 'http://localhost:8080/health',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 120000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
