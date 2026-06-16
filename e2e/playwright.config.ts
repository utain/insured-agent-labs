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
 * Scale-out is therefore by CI *sharding* (each shard runs its own app stack),
 * not by workers — see .github/workflows/ci.yml.
 */

// When a shard runs in CI we emit a `blob` report per shard; a downstream job
// merges them into one HTML report. Locally we keep the human-friendly HTML.
const sharded = !!process.env.PW_SHARD;

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: sharded
    ? [['blob'], ['list']]
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
