import { test, expect } from '../../fixtures/api';
import { PRODUCTS, RIDER_COUNTS } from '../../fixtures/data';

test.describe('API · catalog', () => {
	test('lists 4 life products', { tag: ['@smoke'] }, async ({ agent }) => {
		const products = await agent.catalog.products();
		expect(products).toHaveLength(4);
		expect(products.map((p) => p.code)).toContain(PRODUCTS.term);
	});

	test('gets a single product', async ({ agent }) => {
		const p = await agent.catalog.product(PRODUCTS.term);
		expect(p.code).toBe(PRODUCTS.term);
		expect(p.term_options.length).toBeGreaterThan(0);
	});

	test('unknown product is 404', async ({ agent }) => {
		await agent.catalog.product('NOPE', { expect: 404 });
	});

	test('lists all 27 riders and filters by type', async ({ agent }) => {
		const all = await agent.catalog.riders();
		expect(all).toHaveLength(RIDER_COUNTS.total);

		const health = await agent.catalog.riders({ type: 'health' });
		expect(health.length).toBe(RIDER_COUNTS.health);
		expect(health.every((r) => r.rider_type === 'health')).toBe(true);
	});

	test('catalog requires auth', async ({ anon }) => {
		await anon.catalog.products({ expect: 401 });
	});
});
