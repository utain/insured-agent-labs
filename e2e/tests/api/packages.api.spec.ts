import { test, expect, json, bearer } from '../../fixtures/api';
import { PRODUCTS } from '../../fixtures/data';

test.describe('API · packages', () => {
	test('lists seeded template packages', async ({ api, standardToken }) => {
		const pkgs = await json(
			await api.get('/api/packages', { headers: bearer(standardToken) }),
			200
		);
		expect(pkgs.length).toBeGreaterThanOrEqual(3);
		expect(pkgs.some((p: any) => p.agent_id === null)).toBe(true);
	});

	test('create → update → delete an agent package', async ({ api, standardToken }) => {
		const created = await json(
			await api.post('/api/packages', {
				headers: bearer(standardToken),
				data: {
					name: 'My Bundle',
					description: 'test',
					base_product_code: PRODUCTS.term,
					default_sum_assured: 1_000_000,
					term: 20,
					modal: 'annual',
					riders: [{ code: 'HEALTH_PLAN_2', sum_assured: 500_000 }]
				}
			}),
			200,
			'create package'
		);
		expect(created.agent_id).toBeTruthy();
		expect(created.riders).toHaveLength(1);

		const updated = await json(
			await api.put(`/api/packages/${created.id}`, {
				headers: bearer(standardToken),
				data: { ...created, name: 'Renamed' }
			}),
			200
		);
		expect(updated.name).toBe('Renamed');

		expect(
			(await api.delete(`/api/packages/${created.id}`, { headers: bearer(standardToken) })).status()
		).toBe(204);
	});

	test('template packages cannot be edited (403)', async ({ api, standardToken }) => {
		const pkgs = await json(
			await api.get('/api/packages', { headers: bearer(standardToken) }),
			200
		);
		const template = pkgs.find((p: any) => p.agent_id === null);
		const res = await api.put(`/api/packages/${template.id}`, {
			headers: bearer(standardToken),
			data: { name: 'hack' }
		});
		expect(res.status()).toBe(403);
	});

	test('unknown base product → 422', async ({ api, standardToken }) => {
		const res = await api.post('/api/packages', {
			headers: bearer(standardToken),
			data: { name: 'Bad', base_product_code: 'NOPE', default_sum_assured: 1000, term: 10 }
		});
		expect(res.status()).toBe(422);
	});
});
