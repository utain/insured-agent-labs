import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { getRider } from '$lib/server/services/catalog';

export const GET: RequestHandler = (event) =>
	respond(() => {
		apiUser(event);
		return getRider(event.params.code);
	});
