import { test, expect } from '../../fixtures/pages';
import { USERS } from '../../fixtures/data';

test.describe('UI · auth', () => {
	test('standard agent can log in and reach the dashboard', async ({ page, loginPage, header }) => {
		await loginPage.login(USERS.standard);
		await expect(page).toHaveURL(/\/$/);
		await expect(header.userName).toBeVisible();
		await expect(header.scenarioBadge).toHaveText(/standard/i);
	});

	test('locked agent sees an error and stays on /login', async ({ page, loginPage }) => {
		await loginPage.goto();
		await loginPage.submit(USERS.locked);
		await expect(loginPage.errorAlert).toBeVisible();
		await expect(page).toHaveURL(/\/login/);
	});

	test('unauthenticated access redirects to /login', async ({ page }) => {
		await page.goto('/leads');
		await expect(page).toHaveURL(/\/login/);
	});

	test('logout returns to /login', async ({ page, loginPage, header }) => {
		await loginPage.login(USERS.standard);
		await header.logout();
		await expect(page).toHaveURL(/\/login/);
	});
});
