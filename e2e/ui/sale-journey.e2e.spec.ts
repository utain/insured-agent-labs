import { test, expect, resetState } from '../fixtures/pages';
import { USERS, PRODUCTS, validInsured } from '../fixtures/data';

test.describe('UI · sale journey (quotation → illustration)', () => {
	test.beforeEach(async ({ api }) => {
		await resetState(api);
	});

	test('standard agent builds a quotation and produces a Sales Illustration', async ({
		page,
		loginPage,
		wizardPage
	}) => {
		await loginPage.login(USERS.standard);

		await wizardPage.goto();
		await wizardPage.startFresh(validInsured());
		await wizardPage.selectProduct(PRODUCTS.term);

		// Selecting a plan triggers an initial calculation.
		await expect(wizardPage.premiumTotal).toBeVisible();

		await wizardPage.confirmButton.click();
		await expect(page).toHaveURL(/\/illustrations\/[^/]+$/);
		await expect(page.getByTestId('illustration-number')).toHaveText(/^SI-\d{8}-/);
		await expect(page.getByTestId('illustration-total')).toBeVisible();
	});

	test('error agent fails at illustration with a 500 and stays on the wizard', async ({
		page,
		loginPage,
		wizardPage
	}) => {
		await loginPage.login(USERS.error);

		await wizardPage.goto();
		await wizardPage.startFresh(validInsured());
		await wizardPage.selectProduct(PRODUCTS.term);
		await expect(wizardPage.premiumTotal).toBeVisible();

		await wizardPage.confirmButton.click();
		await expect(page.getByTestId('quotation-error')).toBeVisible();
		await expect(page).toHaveURL(/\/quotations\/[^/]+$/);
	});

	test('bug agent: the Confirm button is dead (no navigation)', async ({
		page,
		loginPage,
		wizardPage
	}) => {
		await loginPage.login(USERS.bug);

		await wizardPage.goto();
		await wizardPage.startFresh(validInsured());
		await wizardPage.selectProduct(PRODUCTS.term);
		await expect(wizardPage.premiumTotal).toBeVisible();

		await wizardPage.confirmButton.click();
		await page.waitForTimeout(500);
		await expect(page).toHaveURL(/\/quotations\/[^/]+$/); // never reaches /illustrations
	});
});
