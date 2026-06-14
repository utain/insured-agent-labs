import type { PageServerLoad } from './$types';
import { catalogApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.apiToken!;
	const [products, riders] = await Promise.all([
		catalogApi.products(token),
		catalogApi.riders(token)
	]);
	return { products, riders };
};
