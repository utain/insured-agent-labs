import type { PageServerLoad } from './$types';
import { transactionsApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals, url }) => {
	const token = locals.apiToken!;
	const kindParam = url.searchParams.getAll('kind');
	const statusParam = url.searchParams.getAll('status');
	const search = url.searchParams.get('search') ?? undefined;
	const page = Number(url.searchParams.get('page') ?? '1');
	const tx = await transactionsApi.list(token, {
		kind: kindParam.length ? (kindParam as never[]) : undefined,
		status: statusParam.length ? statusParam : undefined,
		search,
		page
	});
	return { tx, filters: { kind: kindParam, status: statusParam, search: search ?? '', page } };
};
