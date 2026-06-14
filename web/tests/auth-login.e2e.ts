import { expect, test } from '@playwright/test';

/**
 * Happy-path login → dashboard → logout.
 * Demonstrates the core testid selectors used throughout the app.
 */
test.describe('Auth — happy path', () => {
	test('agent.standard can log in and reach the dashboard', async ({ page }) => {
		await page.goto('/en/login');

		// The login form
		await page.getByTestId('login-username-input').fill('agent.standard');
		await page.getByTestId('login-password-input').fill('insure_demo');
		await page.getByTestId('login-submit-button').click();

		// Lands on the dashboard
		await expect(page).toHaveURL(/\/(en|th)\/?$/);
		await expect(page.getByTestId('dashboard-page-title')).toBeVisible();
	});

	test('agent.locked sees the locked alert', async ({ page }) => {
		await page.goto('/en/login');
		await page.getByTestId('login-username-input').fill('agent.locked');
		await page.getByTestId('login-password-input').fill('insure_demo');
		await page.getByTestId('login-submit-button').click();

		await expect(page.getByRole('alert')).toContainText(/locked/i);
		await expect(page).toHaveURL(/login/);
	});

	test('invalid credentials show error', async ({ page }) => {
		await page.goto('/en/login');
		await page.getByTestId('login-username-input').fill('agent.standard');
		await page.getByTestId('login-password-input').fill('wrong-password');
		await page.getByTestId('login-submit-button').click();

		await expect(page.getByTestId('login-error-alert')).toBeVisible();
	});
});
