import { expect, test } from '@playwright/test';

/**
 * Dashboard smoke tests — relies on the seeded transactions.
 * Run after /api/admin/reset to ensure deterministic state.
 */
test.describe('Dashboard', () => {
	test.beforeAll(async ({ request }) => {
		// Log in and reset the backend to seed state.
		const login = await request.post('/api/auth/login', {
			data: { username: 'agent.standard', password: 'insure_demo' }
		});
		const { token } = (await login.json()) as { token: string };
		await request.post('/api/admin/reset', { headers: { Authorization: `Bearer ${token}` } });
	});

	test('shows seeded transactions and supports filters', async ({ page }) => {
		// Login via UI so the session cookie is set.
		await page.goto('/en/login');
		await page.getByTestId('login-username-input').fill('agent.standard');
		await page.getByTestId('login-password-input').fill('insure_demo');
		await page.getByTestId('login-submit-button').click();

		await expect(page.getByTestId('dashboard-table')).toBeVisible();
		const rows = page.getByTestId('dashboard-row');
		await expect(rows).toHaveCount(6);

		// Filter by kind=quotation
		await page.getByTestId('dashboard-filter-search').fill('Quotation');
		await page.getByTestId('dashboard-filter-apply').click();
		await expect(page.getByTestId('dashboard-row')).toHaveCount(2);
	});

	test('clear button resets the filter', async ({ page }) => {
		await page.goto('/en/login');
		await page.getByTestId('login-username-input').fill('agent.standard');
		await page.getByTestId('login-password-input').fill('insure_demo');
		await page.getByTestId('login-submit-button').click();

		await page.getByTestId('dashboard-filter-search').fill('Quotation');
		await page.getByTestId('dashboard-filter-apply').click();
		await expect(page.getByTestId('dashboard-row')).toHaveCount(2);

		await page.getByTestId('dashboard-filter-clear').click();
		await expect(page.getByTestId('dashboard-row')).toHaveCount(6);
	});
});
