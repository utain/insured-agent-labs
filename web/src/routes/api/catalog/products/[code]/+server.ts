import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { getProduct } from '$lib/server/services/catalog';

export const GET: RequestHandler = (event) =>
	respond(() => {
		apiUser(event);
		return getProduct(event.params.code);
	});
