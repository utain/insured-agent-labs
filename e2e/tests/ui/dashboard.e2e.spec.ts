import { test, expect } from '../../fixtures/pages';
import { USERS, PRODUCTS } from '../../fixtures/data';

test.describe('UI · dashboard & leads', () => {
	test('empty dashboard shows the empty state', async ({ resetState, loginPage, dashboardPage }) => {
		await resetState();
		await loginPage.login(USERS.standard);
		await dashboardPage.goto();
		// agent.standard has seeded leads but no transactions after reset.
		await expect(dashboardPage.empty).toBeVisible();
	});

	test('activity appears on the dashboard after creating an illustration', async ({
		resetState,
		loginPage,
		dashboardPage
	}) => {
		// Seed activity over the API, then view it in the browser.
		const agent = await resetState();
		await agent.flows.createIllustration({ product: PRODUCTS.term, sumAssured: 1_000_000, term: 20 });

		await loginPage.login(USERS.standard);
		await dashboardPage.goto();
		await expect(dashboardPage.rows.first()).toBeVisible();
		await expect(dashboardPage.rows).not.toHaveCount(0);
	});

	test('new lead flow creates a lead and lands on its detail page', async ({
		resetState,
		page,
		loginPage,
		leadFormPage
	}) => {
		await resetState();
		await loginPage.login(USERS.standard);
		await page.goto('/leads/new');
		await leadFormPage.fill({
			full_name: 'UI Lead',
			dob: '1991-02-03',
			gender: 'female',
			occupation: 'Doctor'
		});
		await leadFormPage.submit();
		await expect(page).toHaveURL(/\/leads\/[^/]+$/);
		await expect(page.getByTestId('lead-detail-page-title')).toHaveText('UI Lead');
	});
});
