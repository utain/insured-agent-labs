import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { catalogApi, quotationsApi, ApiCallError } from '$lib/server/api';
import type { RiderSelection, UpdateQuotationRequest } from '$lib/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const token = locals.apiToken!;
	try {
		const [quotation, products, riders] = await Promise.all([
			quotationsApi.get(token, params.id),
			catalogApi.products(token),
			catalogApi.riders(token)
		]);
		return { quotation, products, riders };
	} catch (e) {
		if (e instanceof ApiCallError && (e.status === 404 || e.status === 401)) {
			throw error(404, { code: 'not_found', message: 'Quotation not found' });
		}
		throw e;
	}
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const token = locals.apiToken!;
		const form = await request.formData();

		const sumAssuredRaw = String(form.get('sum_assured') ?? '');
		const termRaw = String(form.get('term') ?? '');
		const modal = String(form.get('modal') ?? '') as UpdateQuotationRequest['modal'];
		const riderCodes = form.getAll('rider_code') as string[];

		// Collect rider selections with sum assured from matching rider_sum_{code} fields.
		const riders: RiderSelection[] = riderCodes.map((code) => ({
			code,
			sum_assured: Number(form.get(`rider_sum_${code}`) ?? '0')
		}));

		const body: UpdateQuotationRequest = {
			sum_assured: Number(sumAssuredRaw),
			term: Number(termRaw),
			modal,
			riders
		};

		try {
			const quotation = await quotationsApi.update(token, params.id, body);
			return { ok: true, quotation };
		} catch (e) {
			if (e instanceof ApiCallError && e.fields) {
				const fieldErrors: Record<string, string> = {};
				for (const f of e.fields) {
					fieldErrors[f.field] = f.message;
				}
				return fail(422, { fieldErrors });
			}
			if (e instanceof ApiCallError) {
				return fail(e.status, { error: e.message });
			}
			throw e;
		}
	},

	finalize: async ({ params, locals }) => {
		const token = locals.apiToken!;
		try {
			const quotation = await quotationsApi.finalize(token, params.id);
			return { ok: true, quotation };
		} catch (e) {
			if (e instanceof ApiCallError) {
				return fail(e.status, { error: e.message });
			}
			throw e;
		}
	}
};
