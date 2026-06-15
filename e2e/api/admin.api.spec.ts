import { test, expect, json, bearer } from '../fixtures/api';
import { validLead } from '../fixtures/data';

test.describe('API · admin', () => {
	test('reset restores the deterministic seed', async ({ api, standardToken }) => {
		// Mutate: add a lead.
		await api.post('/api/leads', { headers: bearer(standardToken), data: validLead() });

		const reset = await api.post('/api/admin/reset');
		expect((await json(reset, 200)).ok).toBe(true);

		const state = await json(await api.get('/api/admin/debug-state'), 200);
		expect(state.users).toBe(5);
		expect(state.products).toBe(4);
		expect(state.riders).toBe(27);
		expect(state.packages).toBe(3);
		expect(state.quotations).toBe(0);
		expect(state.illustrations).toBe(0);
	});
});
