import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { listProducts } from '$lib/server/services/catalog';

export const GET: RequestHandler = (event) =>
	respond(() => {
		apiUser(event);
		return listProducts();
	});
