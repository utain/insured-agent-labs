import type { PageServerLoad } from './$types';
import { listTransactions } from '$lib/server/services/transactions';
import { listQuotations } from '$lib/server/services/quotations';
import { listLeads } from '$lib/server/services/leads';
import { listPackages } from '$lib/server/services/packages';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const quotations = listQuotations(user);
	const leads = listLeads(user);
	const packages = listPackages(user);
	const feed = listTransactions(user.id, { pageSize: 8 });

	return {
		recent: feed.items,
		stats: {
			leads: leads.length,
			packages: packages.length,
			quotations: quotations.length,
			illustrated: quotations.filter((q) => q.status === 'illustrated').length
		}
	};
};
