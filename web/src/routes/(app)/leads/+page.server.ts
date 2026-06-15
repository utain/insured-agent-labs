import type { PageServerLoad } from './$types';
import { listLeads } from '$lib/server/services/leads';

export const load: PageServerLoad = async ({ locals }) => {
	return { leads: listLeads(locals.user!) };
};
