import { test, expect, json, bearer, createIllustration } from '../../fixtures/api';
import { PRODUCTS, validLead, validInsured } from '../../fixtures/data';

test.describe('API · quotations & illustration', () => {
	test('create from a fresh insured, set coverage, recompute premium', async ({
		api,
		standardToken
	}) => {
		const q = await json(
			await api.post('/api/quotations', {
				headers: bearer(standardToken),
				data: { insured: validInsured() }
			}),
			200,
			'create'
		);
		expect(q.status).toBe('draft');
		expect(q.insured_age).toBeGreaterThan(0);

		const updated = await json(
			await api.put(`/api/quotations/${q.id}`, {
				headers: bearer(standardToken),
				data: {
					base_product_code: PRODUCTS.term,
					sum_assured: 1_000_000,
					term: 20,
					modal: 'annual',
					riders: [{ code: 'HEALTH_PLAN_2', sum_assured: 500_000 }]
				}
			}),
			200,
			'update'
		);
		expect(updated.calc.total_annual_premium).toBeGreaterThan(updated.calc.base_premium);
		expect(updated.calc.rider_premiums).toHaveLength(1);
	});

	test('create from an existing lead', async ({ api, standardToken }) => {
		const lead = await json(
			await api.post('/api/leads', { headers: bearer(standardToken), data: validLead() }),
			200
		);
		const q = await json(
			await api.post('/api/quotations', {
				headers: bearer(standardToken),
				data: { lead_id: lead.id }
			}),
			200
		);
		expect(q.lead_id).toBe(lead.id);
		expect(q.insured_name).toBe(lead.full_name);
	});

	test('applying a package seeds product, coverage and riders', async ({ api, standardToken }) => {
		const pkgs = await json(
			await api.get('/api/packages', { headers: bearer(standardToken) }),
			200
		);
		const pkg = pkgs[0];
		const q = await json(
			await api.post('/api/quotations', {
				headers: bearer(standardToken),
				data: { insured: validInsured() }
			}),
			200
		);
		const seeded = await json(
			await api.put(`/api/quotations/${q.id}`, {
				headers: bearer(standardToken),
				data: { apply_package: pkg.id }
			}),
			200
		);
		expect(seeded.base_product_code).toBe(pkg.base_product_code);
		expect(seeded.sum_assured).toBe(pkg.default_sum_assured);
		expect(seeded.riders.length).toBe(pkg.riders.length);
	});

	test('coverage outside product bounds → 422', async ({ api, standardToken }) => {
		const q = await json(
			await api.post('/api/quotations', {
				headers: bearer(standardToken),
				data: { insured: validInsured() }
			}),
			200
		);
		const res = await api.put(`/api/quotations/${q.id}`, {
			headers: bearer(standardToken),
			data: { base_product_code: PRODUCTS.term, sum_assured: 50, term: 20 }
		});
		expect(res.status()).toBe(422);
	});

	test('illustrate produces a Sales Illustration and marks the quotation illustrated', async ({
		api,
		standardToken
	}) => {
		const { quotationId, illustrationId } = await createIllustration(api, standardToken, {
			product: PRODUCTS.term,
			sum_assured: 1_000_000,
			term: 20,
			riders: [{ code: 'CI_PLAN_1', sum_assured: 200_000 }]
		});

		const si = await json(
			await api.get(`/api/illustrations/${illustrationId}`, { headers: bearer(standardToken) }),
			200
		);
		expect(si.number).toMatch(/^SI-\d{8}-/);
		expect(si.benefits.length).toBe(2);

		const q = await json(
			await api.get(`/api/quotations/${quotationId}`, { headers: bearer(standardToken) }),
			200
		);
		expect(q.status).toBe('illustrated');
		expect(q.illustration_id).toBe(illustrationId);
	});

	test('cannot illustrate before a plan is chosen (409)', async ({ api, standardToken }) => {
		const q = await json(
			await api.post('/api/quotations', {
				headers: bearer(standardToken),
				data: { insured: validInsured() }
			}),
			200
		);
		const res = await api.post(`/api/quotations/${q.id}/illustrate`, {
			headers: bearer(standardToken)
		});
		expect(res.status()).toBe(409);
	});
});
