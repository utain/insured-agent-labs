import type { Actions, PageServerLoad } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { leadsApi, catalogApi, quotationsApi, ApiCallError } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals, url }) => {
	const token = locals.apiToken!;
	const leadId = url.searchParams.get('leadId');

	// Load leads + products for the wizard's step 1 & 2.
	const [leads, products, riders] = await Promise.all([
		leadsApi.list(token),
		catalogApi.products(token),
		catalogApi.riders(token)
	]);

	// If leadId provided, auto-create a draft quotation for that lead.
	if (leadId) {
		const lead = leads.find((l) => l.id === leadId);
		if (!lead) {
			throw error(404, { code: 'not_found', message: 'Lead not found' });
		}
		// Create a draft quotation; default base product LIFE_TERM.
		try {
			const quotation = await quotationsApi.create(token, {
				lead_id: leadId,
				base_product_code: 'LIFE_TERM'
			});
			throw redirect(302, `/quotations/${quotation.id}`);
		} catch (e) {
			if (e instanceof ApiCallError) {
				throw error(e.status === 404 ? 404 : 500, {
					code: e.code,
					message: e.message
				});
			}
			throw e;
		}
	}

	return { leads, products, riders };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const token = locals.apiToken!;
		const form = await request.formData();
		const leadId = String(form.get('leadId') ?? '');
		const productCode = String(form.get('productCode') ?? 'LIFE_TERM');

		if (!leadId) {
			return fail(400, { error: 'leadId is required' });
		}

		try {
			const quotation = await quotationsApi.create(token, {
				lead_id: leadId,
				base_product_code: productCode
			});
			throw redirect(302, `/quotations/${quotation.id}`);
		} catch (e) {
			if (e instanceof ApiCallError) {
				return fail(e.status, { error: e.message });
			}
			throw e;
		}
	}
};
