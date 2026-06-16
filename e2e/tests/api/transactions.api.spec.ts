import { test, expect } from '../../fixtures/api';
import { PRODUCTS, validLead } from '../../fixtures/data';

test.describe('API · transactions', () => {
	test('activity feed records leads, quotations and illustrations', { tag: ['@smoke'] }, async ({
		resetState
	}) => {
		const agent = await resetState();
		await agent.leads.create(validLead());
		await agent.flows.createIllustration({ product: PRODUCTS.term, sumAssured: 1_000_000, term: 20 });

		const page = await agent.transactions.list();
		const kinds = page.items.map((t) => t.kind);
		expect(kinds).toContain('lead');
		expect(kinds).toContain('quotation');
		expect(kinds).toContain('illustration');
		expect(page.total).toBeGreaterThanOrEqual(3);
	});

	test('filters by kind', async ({ agent }) => {
		const page = await agent.transactions.list({ kind: 'illustration' });
		expect(page.items.every((t) => t.kind === 'illustration')).toBe(true);
	});

	test('requires auth', async ({ anon }) => {
		await anon.transactions.list({}, { expect: 401 });
	});
});
