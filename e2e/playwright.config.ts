import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { WEB_BASE_URL } from './fixtures/env';

/**
 * Blackbox test suite for InsureAgentLabs (single SvelteKit app).
 *
 * Two Playwright projects, both against the same origin (`BASE_URL`):
 *   - `api` : integration-level tests that hit the JSON API under `/api`
 *             directly (no browser), via the `api` fixture.
 *   - `ui`  : end-to-end tests that drive a real browser against the app.
 *
 * The suite assumes the app is already running (`make up` / `make dev`).
 * `global-setup.ts` waits for `/api/healthz`, resets to the seed, and fails
 * fast with a clear message otherwise.
 *
 * The in-memory store + global `POST /api/admin/reset` mean the suite runs
 * single-worker / non-parallel to keep state deterministic across specs.
 */
export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000
  },
  // Scenario tests deliberately exercise the ~3s `agent.glitch` delay.
  timeout: 30_000,
  expect: { timeout: 10_000 },
  projects: [
    {
      name: 'api',
      testMatch: /api[\\/].*\.api\.spec\.ts$/
    },
    {
      name: 'ui',
      testMatch: /ui[\\/].*\.e2e\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE_URL
      }
    }
  ]
});
