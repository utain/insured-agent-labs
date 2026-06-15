import { test, expect, resetState, login } from '../../fixtures/pages';
import { USERS, PRODUCTS } from '../../fixtures/data';
import { createIllustration } from '../../fixtures/api';

test.describe('UI · dashboard & leads', () => {
	test('empty dashboard shows the empty state', async ({ api, page, loginPage, dashboardPage }) => {
		await resetState(api);
		await loginPage.login(USERS.standard);
		await dashboardPage.goto();
		// agent.standard has seeded leads but no transactions after reset.
		await expect(dashboardPage.empty).toBeVisible();
	});

	test('activity appears on the dashboard after creating an illustration', async ({
		api,
		page,
		loginPage,
		dashboardPage
	}) => {
		await resetState(api);
		const token = await login(api, USERS.standard);
		await createIllustration(api, token, {
			product: PRODUCTS.term,
			sum_assured: 1_000_000,
			term: 20
		});

		await loginPage.login(USERS.standard);
		await dashboardPage.goto();
		await expect(dashboardPage.rows.first()).toBeVisible();
		await expect(dashboardPage.rows).not.toHaveCount(0);
	});

	test('new lead flow creates a lead and lands on its detail page', async ({
		api,
		page,
		loginPage,
		leadFormPage
	}) => {
		await resetState(api);
		await loginPage.login(USERS.standard);
		await page.goto('/leads/new');
		await leadFormPage.fill({ full_name: 'UI Lead', dob: '1991-02-03', gender: 'female', occupation: 'Doctor' });
		await leadFormPage.submit();
		await expect(page).toHaveURL(/\/leads\/[^/]+$/);
		await expect(page.getByTestId('lead-detail-page-title')).toHaveText('UI Lead');
	});
});
