import { test, expect } from '../fixtures/api';
import { USERS } from '../fixtures/data';
import { DEMO_PASSWORD } from '../fixtures/env';

// Spec: docs/requirements/01-auth.md (UI surface)
test.describe('UI · auth', () => {
  test('agent.standard logs in and reaches the dashboard', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByTestId('login-username-input').fill(USERS.standard);
    await page.getByTestId('login-password-input').fill(DEMO_PASSWORD);
    await page.getByTestId('login-submit-button').click();

    // Login redirects to the app root (locale-less `/`); the title is the signal.
    await expect(page.getByTestId('dashboard-page-title')).toBeVisible();
    await expect(page).not.toHaveURL(/login/);
  });

  test('agent.locked sees the locked alert and stays on login', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByTestId('login-username-input').fill(USERS.locked);
    await page.getByTestId('login-password-input').fill(DEMO_PASSWORD);
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('login-error-alert')).toContainText(/lock/i);
    await expect(page).toHaveURL(/login/);
  });

  test('invalid credentials show an error alert', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByTestId('login-username-input').fill(USERS.standard);
    await page.getByTestId('login-password-input').fill('wrong-password');
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('login-error-alert')).toBeVisible();
  });

  test('unauthenticated access to an app route redirects to login', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveURL(/login/);
  });
});
