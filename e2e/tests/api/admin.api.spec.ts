import { test, expect } from '../../fixtures/api';
import { SEED, validLead } from '../../fixtures/data';

test.describe('API · admin', () => {
	test('reset restores the deterministic seed', async ({ agent, anon }) => {
		// Mutate: add a lead.
		await agent.leads.create(validLead());

		const reset = await anon.admin.reset();
		expect(reset.ok).toBe(true);

		const state = await anon.admin.debugState();
		expect(state.users).toBe(SEED.users);
		expect(state.products).toBe(SEED.products);
		expect(state.riders).toBe(SEED.riders);
		expect(state.packages).toBe(SEED.packages);
		expect(state.quotations).toBe(SEED.quotations);
		expect(state.illustrations).toBe(SEED.illustrations);
	});
});
