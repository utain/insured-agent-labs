import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { eappsApi, paymentsApi, quotationsApi, ApiCallError } from '$lib/server/api';

export const load: PageServerLoad = async ({ params, locals }) => {
	const token = locals.apiToken!;
	try {
		const eapp = await eappsApi.get(token, params.id);
		const quotation = await quotationsApi.get(token, eapp.quotation_id);
		return { eapp, quotation };
	} catch (e) {
		if (e instanceof ApiCallError && (e.status === 404 || e.status === 401)) {
			throw error(404, { code: 'not_found', message: 'E-application not found' });
		}
		throw e;
	}
};

export const actions: Actions = {
	pay: async ({ params, request, locals }) => {
		const token = locals.apiToken!;
		const form = await request.formData();
		const method = String(form.get('method') ?? 'card') as 'card' | 'bank_transfer' | 'promptpay';
		const outcome = String(form.get('outcome') ?? 'success') as 'success' | 'declined' | 'pending';

		try {
			const payment = await paymentsApi.create(token, {
				eapp_id: params.id,
				method,
				outcome
			});
			return { ok: true, payment };
		} catch (e) {
			if (e instanceof ApiCallError) {
				return fail(e.status, { error: e.message });
			}
			throw e;
		}
	}
};
