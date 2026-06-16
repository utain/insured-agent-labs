import { test, expect } from '../../fixtures/api';
import { PRODUCTS, RIDERS } from '../../fixtures/data';

test.describe('API · packages', () => {
	test('lists seeded template packages', { tag: ['@smoke'] }, async ({ agent }) => {
		const pkgs = await agent.packages.list();
		expect(pkgs.length).toBeGreaterThanOrEqual(3);
		expect(pkgs.some((p) => p.agent_id === null)).toBe(true);
	});

	test('create → update → delete an agent package', async ({ agent }) => {
		const created = await agent.packages.create({
			name: 'My Bundle',
			description: 'test',
			base_product_code: PRODUCTS.term,
			default_sum_assured: 1_000_000,
			term: 20,
			modal: 'annual',
			riders: [{ code: RIDERS.health2, sum_assured: 500_000 }]
		});
		expect(created.agent_id).toBeTruthy();
		expect(created.riders).toHaveLength(1);

		const updated = await agent.packages.update(created.id, { ...created, name: 'Renamed' });
		expect(updated.name).toBe('Renamed');

		await agent.packages.remove(created.id);
	});

	test('template packages cannot be edited (403)', async ({ agent }) => {
		const pkgs = await agent.packages.list();
		const template = pkgs.find((p) => p.agent_id === null);
		expect(template).toBeDefined();
		await agent.packages.update(template!.id, { name: 'hack' }, { expect: 403 });
	});

	test('unknown base product → 422', async ({ agent }) => {
		await agent.packages.create(
			{ name: 'Bad', base_product_code: 'NOPE', default_sum_assured: 1000, term: 10 },
			{ expect: 422 }
		);
	});
});
