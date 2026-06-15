import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getQuotation } from '$lib/server/services/quotations';
import { listProducts, listRiders } from '$lib/server/services/catalog';
import { listPackages } from '$lib/server/services/packages';
import { ApiError } from '$lib/server/api-error';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user!;
	try {
		const quotation = getQuotation(user, params.id);
		return {
			quotation,
			products: listProducts(),
			riders: listRiders(),
			packages: listPackages(user)
		};
	} catch (e) {
		if (e instanceof ApiError)
			throw error(e.status === 404 ? 404 : 500, { code: e.code, message: e.message });
		throw e;
	}
};
