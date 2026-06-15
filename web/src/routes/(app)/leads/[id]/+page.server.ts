import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getLead } from '$lib/server/services/leads';
import { listQuotations } from '$lib/server/services/quotations';
import { ApiError } from '$lib/server/api-error';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user!;
	try {
		const lead = getLead(user, params.id);
		const quotations = listQuotations(user).filter((q) => q.lead_id === lead.id);
		return { lead, quotations };
	} catch (e) {
		if (e instanceof ApiError)
			throw error(e.status === 404 ? 404 : 500, { code: e.code, message: e.message });
		throw e;
	}
};
