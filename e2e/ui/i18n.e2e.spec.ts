import { test, expect } from '../fixtures/api';
import { uiLogin } from '../fixtures/ui';
import { USERS } from '../fixtures/data';
import { DEMO_PASSWORD } from '../fixtures/env';

// Spec: docs/requirements/09-i18n-localization.md (UI surface)
test.describe('UI · i18n', () => {
  test('login page renders under both /en and /th without raw message keys', async ({ page }) => {
    for (const locale of ['en', 'th'] as const) {
      await page.goto(`/${locale}/login`);
      await expect(page.getByTestId('login-submit-button')).toBeVisible();
      // No unresolved Paraglide key (e.g. "login.submit") should be visible.
      await expect(page.locator('body')).not.toContainText(/\b(login|nav|common)\.[a-z_.]+\b/);
    }
  });

  test('locked error localizes on the Thai login page', async ({ page }) => {
    await page.goto('/th/login');
    await page.getByTestId('login-username-input').fill(USERS.locked);
    await page.getByTestId('login-password-input').fill(DEMO_PASSWORD);
    await page.getByTestId('login-submit-button').click();

    const alert = page.getByTestId('login-error-alert');
    await expect(alert).toBeVisible();
    await expect(alert).not.toBeEmpty();
    await expect(page).toHaveURL(/\/th\/login/);
  });

  test('language switcher is available in the header after login', async ({ page }) => {
    await uiLogin(page, USERS.standard);
    await expect(page.getByTestId('lang-select')).toBeVisible();
  });
});
