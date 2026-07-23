import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Next 16 permits only one `next dev` per project, so we target the
 * project's dev port (3004) and reuse a running server locally; in CI, Playwright
 * starts its own.
 */
const PORT = Number(process.env.E2E_PORT ?? 3004);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
