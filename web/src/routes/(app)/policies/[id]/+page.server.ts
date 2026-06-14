import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { catalogApi, eappsApi, quotationsApi, ApiCallError } from '$lib/server/api';

export const load: PageServerLoad = async ({ params, locals }) => {
	const token = locals.apiToken!;
	try {
		const eapp = await eappsApi.get(token, params.id);
		const quotation = await quotationsApi.get(token, eapp.quotation_id);
		const product = await catalogApi.product(token, quotation.base_product_code);
		return { eapp, quotation, product };
	} catch (e) {
		if (e instanceof ApiCallError && (e.status === 404 || e.status === 401)) {
			throw error(404, { code: 'not_found', message: 'Policy not found' });
		}
		throw e;
	}
};
