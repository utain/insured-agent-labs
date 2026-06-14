import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { leadsApi, ApiCallError } from '$lib/server/api';

export const load: PageServerLoad = async ({ params, locals }) => {
	const token = locals.apiToken!;
	try {
		const lead = await leadsApi.get(token, params.id);
		return { lead };
	} catch (e) {
		if (e instanceof ApiCallError && (e.status === 404 || e.status === 401)) {
			throw error(404, { code: 'not_found', message: 'Lead not found' });
		}
		throw e;
	}
};
