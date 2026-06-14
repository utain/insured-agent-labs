import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { WEB_BASE_URL } from './fixtures/env';

/**
 * Blackbox test suite for InsureAgentLabs.
 *
 * Two Playwright projects:
 *   - `api` : integration-level tests that hit the Rust backend REST API
 *             directly (no browser). Each `*.api.spec.ts` file targets the
 *             backend base URL via the `api` fixture.
 *   - `ui`  : end-to-end tests that drive a real browser against the SvelteKit
 *             web app. Each `*.e2e.spec.ts` file uses `baseURL = WEB_BASE_URL`.
 *
 * The suite assumes the stack is already running (docker compose, `make up`,
 * or native `make dev-backend` + `make dev-web`). `global-setup.ts` waits for
 * both services to be healthy and fails fast with a clear message otherwise.
 *
 * The backend uses a single shared in-memory store and a GLOBAL
 * `POST /api/admin/reset`, so the suite runs single-worker / non-parallel to
 * keep state deterministic across specs.
 */
export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
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
