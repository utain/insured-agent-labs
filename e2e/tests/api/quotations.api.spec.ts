import { test, expect } from '../../fixtures/api';
import { PRODUCTS, RIDERS, validLead, validInsured } from '../../fixtures/data';

test.describe('API · quotations & illustration', () => {
	test('create from a fresh insured, set coverage, recompute premium', { tag: ['@smoke'] }, async ({
		agent
	}) => {
		const q = await agent.quotations.create({ insured: validInsured() });
		expect(q.status).toBe('draft');
		expect(q.insured_age).toBeGreaterThan(0);

		const updated = await agent.quotations.setCoverage(q.id, {
			product: PRODUCTS.term,
			sumAssured: 1_000_000,
			term: 20,
			riders: [{ code: RIDERS.health2, sumAssured: 500_000 }]
		});
		expect(updated.calc).not.toBeNull();
		expect(updated.calc!.total_annual_premium).toBeGreaterThan(updated.calc!.base_premium);
		expect(updated.calc!.rider_premiums).toHaveLength(1);
	});

	test('create from an existing lead', async ({ agent }) => {
		const lead = await agent.leads.create(validLead());
		const q = await agent.quotations.create({ lead_id: lead.id });
		expect(q.lead_id).toBe(lead.id);
		expect(q.insured_name).toBe(lead.full_name);
	});

	test('applying a package seeds product, coverage and riders', async ({ agent }) => {
		const [pkg] = await agent.packages.list();
		const q = await agent.quotations.create({ insured: validInsured() });
		const seeded = await agent.quotations.applyPackage(q.id, pkg.id);
		expect(seeded.base_product_code).toBe(pkg.base_product_code);
		expect(seeded.sum_assured).toBe(pkg.default_sum_assured);
		expect(seeded.riders.length).toBe(pkg.riders.length);
	});

	test('coverage outside product bounds → 422', async ({ agent }) => {
		const q = await agent.quotations.create({ insured: validInsured() });
		await agent.quotations.setCoverage(
			q.id,
			{ product: PRODUCTS.term, sumAssured: 50, term: 20 },
			{ expect: 422 }
		);
	});

	test('illustrate produces a Sales Illustration and marks the quotation illustrated', { tag: ['@smoke'] }, async ({
		agent
	}) => {
		const { quotationId, illustrationId } = await agent.flows.createIllustration({
			product: PRODUCTS.term,
			sumAssured: 1_000_000,
			term: 20,
			riders: [{ code: RIDERS.ci1, sumAssured: 200_000 }]
		});

		const si = await agent.illustrations.get(illustrationId);
		expect(si.number).toMatch(/^SI-\d{8}-/);
		expect(si.benefits.length).toBe(2);

		const q = await agent.quotations.get(quotationId);
		expect(q.status).toBe('illustrated');
		expect(q.illustration_id).toBe(illustrationId);
	});

	test('cannot illustrate before a plan is chosen (409)', async ({ agent }) => {
		const q = await agent.quotations.create({ insured: validInsured() });
		await agent.quotations.illustrate(q.id, { expect: 409 });
	});
});
