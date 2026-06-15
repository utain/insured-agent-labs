import type { PageServerLoad } from './$types';
import { listProducts, listRiders } from '$lib/server/services/catalog';

export const load: PageServerLoad = async () => {
	return { products: listProducts(), riders: listRiders() };
};
