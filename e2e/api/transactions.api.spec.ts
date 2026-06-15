import { test, expect, json, bearer, createIllustration, resetState } from '../fixtures/api';
import { PRODUCTS, validLead } from '../fixtures/data';

test.describe('API · transactions', () => {
	test('activity feed records leads, quotations and illustrations', async ({ api }) => {
		const token = await resetState(api);

		await api.post('/api/leads', { headers: bearer(token), data: validLead() });
		await createIllustration(api, token, {
			product: PRODUCTS.term,
			sum_assured: 1_000_000,
			term: 20
		});

		const page = await json(
			await api.get('/api/transactions', { headers: bearer(token) }),
			200
		);
		const kinds = page.items.map((t: any) => t.kind);
		expect(kinds).toContain('lead');
		expect(kinds).toContain('quotation');
		expect(kinds).toContain('illustration');
		expect(page.total).toBeGreaterThanOrEqual(3);
	});

	test('filters by kind', async ({ api, standardToken }) => {
		const page = await json(
			await api.get('/api/transactions?kind=illustration', { headers: bearer(standardToken) }),
			200
		);
		expect(page.items.every((t: any) => t.kind === 'illustration')).toBe(true);
	});

	test('requires auth', async ({ api }) => {
		expect((await api.get('/api/transactions')).status()).toBe(401);
	});
});
