import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { listTransactions } from '$lib/server/services/transactions';
import { type TransactionKind } from '$lib/schemas';

export const GET: RequestHandler = (event) =>
	respond(() => {
		const user = apiUser(event);
		const p = event.url.searchParams;
		return listTransactions(user.id, {
			kind: (p.get('kind') as TransactionKind) ?? undefined,
			status: p.get('status') ?? undefined,
			search: p.get('search') ?? undefined,
			page: p.get('page') ? Number(p.get('page')) : undefined,
			pageSize: p.get('page_size') ? Number(p.get('page_size')) : undefined
		});
	});
