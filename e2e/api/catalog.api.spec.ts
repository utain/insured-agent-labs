import { test, expect, json, bearer } from '../fixtures/api';
import { PRODUCTS } from '../fixtures/data';

test.describe('API · catalog', () => {
	test('lists 4 life products', async ({ api, standardToken }) => {
		const products = await json(
			await api.get('/api/catalog/products', { headers: bearer(standardToken) }),
			200
		);
		expect(products).toHaveLength(4);
		expect(products.map((p: any) => p.code)).toContain(PRODUCTS.term);
	});

	test('gets a single product', async ({ api, standardToken }) => {
		const p = await json(
			await api.get(`/api/catalog/products/${PRODUCTS.term}`, { headers: bearer(standardToken) }),
			200
		);
		expect(p.code).toBe(PRODUCTS.term);
		expect(p.term_options.length).toBeGreaterThan(0);
	});

	test('unknown product is 404', async ({ api, standardToken }) => {
		expect(
			(await api.get('/api/catalog/products/NOPE', { headers: bearer(standardToken) })).status()
		).toBe(404);
	});

	test('lists all 27 riders and filters by type', async ({ api, standardToken }) => {
		const all = await json(
			await api.get('/api/catalog/riders', { headers: bearer(standardToken) }),
			200
		);
		expect(all).toHaveLength(27);

		const health = await json(
			await api.get('/api/catalog/riders?type=health', { headers: bearer(standardToken) }),
			200
		);
		expect(health.length).toBe(5);
		expect(health.every((r: any) => r.rider_type === 'health')).toBe(true);
	});

	test('catalog requires auth', async ({ api }) => {
		expect((await api.get('/api/catalog/products')).status()).toBe(401);
	});
});
