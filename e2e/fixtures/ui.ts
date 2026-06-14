import { expect, type Page, type Locator } from '@playwright/test';
import { DEMO_PASSWORD } from './env';

/**
 * Fill a Svelte **controlled** input robustly.
 *
 * Several inputs bind `value={state}` (e.g. the login username, the dashboard
 * search box). On hydration Svelte re-applies that binding and resets the DOM
 * value — so a `fill()` that lands before hydration is silently wiped. We fill,
 * let a pending hydration pass, and re-assert; once hydration has run the
 * binding is stable and the re-fill sticks. Converges in 1–2 iterations.
 */
export async function fillHydrated(locator: Locator, value: string): Promise<void> {
  await expect(async () => {
    await locator.fill(value);
    // The value must SURVIVE a settle window — a pre-hydration fill is wiped
    // when Svelte mounts and re-applies the `value={state}` binding. Re-fill
    // until it sticks (hydration is a one-time event, so this converges).
    await expect(locator).toHaveValue(value);
    await locator.page().waitForTimeout(300);
    await expect(locator).toHaveValue(value);
  }).toPass({ timeout: 15_000, intervals: [200, 400, 600, 800] });
}

/** Log in through the UI and wait for the dashboard. */
export async function uiLogin(
  page: Page,
  username: string,
  password: string = DEMO_PASSWORD
): Promise<void> {
  await page.goto('/en/login');
  await fillHydrated(page.getByTestId('login-username-input'), username);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await expect(page.getByTestId('dashboard-page-title')).toBeVisible();
}
