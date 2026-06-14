import type { PageServerLoad } from './$types';
import { leadsApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.apiToken!;
	const leads = await leadsApi.list(token);
	return { leads };
};
