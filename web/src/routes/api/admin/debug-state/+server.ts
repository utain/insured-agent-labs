import type { RequestHandler } from './$types';
import { respond } from '$lib/server/http';
import { db } from '$lib/server/store';

export const GET: RequestHandler = () =>
	respond(() => {
		const d = db();
		return {
			users: d.users.size,
			sessions: d.sessions.size,
			leads: d.leads.size,
			packages: d.packages.size,
			quotations: d.quotations.size,
			illustrations: d.illustrations.size,
			transactions: d.transactions.length,
			products: d.products.length,
			riders: d.riders.length
		};
	});
