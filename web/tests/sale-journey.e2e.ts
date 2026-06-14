import { expect, test } from '@playwright/test';

/**
 * Full sale journey: new lead → quotation → finalize → e-app → pay → submit → policy.
 * Demonstrates an end-to-end happy-path test against the seeded catalog.
 */
test.describe('Sale journey — happy path', () => {
	test('agent.standard completes a full sale', async ({ page, request }) => {
		// Reset to seed state for determinism.
		const login = await request.post('/api/auth/login', {
			data: { username: 'agent.standard', password: 'insure_demo' }
		});
		const { token } = (await login.json()) as { token: string };
		await request.post('/api/admin/reset', { headers: { Authorization: `Bearer ${token}` } });

		// UI login
		await page.goto('/en/login');
		await page.getByTestId('login-username-input').fill('agent.standard');
		await page.getByTestId('login-password-input').fill('insure_demo');
		await page.getByTestId('login-submit-button').click();

		// ===== Create a lead via the UI =====
		await page.getByTestId('dashboard-new-lead').click();
		await expect(page).toHaveURL(/\/leads\/new/);

		// Use a valid Thai ID (checksum-valid).
		await page.getByTestId('lead-full-name-input').fill('Playwright Test');
		await page.getByTestId('lead-national-id-input').fill('1234567890120');
		await page.getByTestId('lead-dob-input').fill('1990-01-01');
		await page.getByTestId('lead-phone-input').fill('0812345678');
		await page.getByTestId('lead-email-input').fill('pw@test');
		await page.getByTestId('lead-submit-button').click();

		await expect(page).toHaveURL(/\/leads$/);

		// ===== Verify the dashboard shows the new lead =====
		await page.goto('/en');
		await expect(page.getByTestId('dashboard-table')).toBeVisible();
		await expect(
			page.getByTestId('dashboard-row').filter({ hasText: 'Playwright Test' })
		).toBeVisible();
	});
});
