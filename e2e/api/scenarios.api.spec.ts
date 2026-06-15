import { test, expect, json, login, bearer } from '../fixtures/api';
import { USERS, PRODUCTS, validInsured } from '../fixtures/data';
import { DEMO_PASSWORD } from '../fixtures/env';
import type { APIRequestContext } from '@playwright/test';

// The deterministic per-agent behaviours. See docs/TEST-USERS.md.

/** Create a draft quotation with fixed params (same insured age across agents). */
async function draftQuote(api: APIRequestContext, token: string): Promise<string> {
	const q = await json(
		await api.post('/api/quotations', {
			headers: bearer(token),
			data: { insured: validInsured({ dob: '1985-06-15' }) }
		}),
		200
	);
	await json(
		await api.put(`/api/quotations/${q.id}`, {
			headers: bearer(token),
			data: { base_product_code: PRODUCTS.term, sum_assured: 1_000_000, term: 20, modal: 'annual' }
		}),
		200
	);
	return q.id;
}

test.describe('API · scenarios', () => {
	test('locked: login is rejected with 423', async ({ api }) => {
		const res = await api.post('/api/auth/login', {
			data: { username: USERS.locked, password: DEMO_PASSWORD }
		});
		expect(res.status()).toBe(423);
	});

	test('bug: base premium is inflated ~5% vs. standard for identical inputs', async ({
		api,
		standardToken
	}) => {
		const bugToken = await login(api, USERS.bug);
		const stdId = await draftQuote(api, standardToken);
		const bugId = await draftQuote(api, bugToken);

		const stdCalc = await json(
			await api.post(`/api/quotations/${stdId}/calculate`, { headers: bearer(standardToken) }),
			200
		);
		const bugCalc = await json(
			await api.post(`/api/quotations/${bugId}/calculate`, { headers: bearer(bugToken) }),
			200
		);
		expect(stdCalc.base_premium).toBeGreaterThan(0);
		expect(bugCalc.base_premium / stdCalc.base_premium).toBeCloseTo(1.05, 2);
	});

	test('glitch: calculate is delayed ~3s', async ({ api }) => {
		const token = await login(api, USERS.glitch);
		const id = await draftQuote(api, token);

		const start = Date.now();
		const res = await api.post(`/api/quotations/${id}/calculate`, { headers: bearer(token) });
		const elapsed = Date.now() - start;

		expect(res.status()).toBe(200);
		expect(elapsed).toBeGreaterThanOrEqual(2_900);
		expect(elapsed).toBeLessThan(10_000);
	});

	test('error: illustrate returns 500 and leaves the quotation in draft', async ({ api }) => {
		const token = await login(api, USERS.error);
		const id = await draftQuote(api, token);

		const res = await api.post(`/api/quotations/${id}/illustrate`, { headers: bearer(token) });
		expect((await json(res, 500)).error.code).toBe('server_error');

		const get = await api.get(`/api/quotations/${id}`, { headers: bearer(token) });
		expect((await json(get, 200)).status).toBe('draft');
	});
});
