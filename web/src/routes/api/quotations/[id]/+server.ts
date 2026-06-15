import type { RequestHandler } from './$types';
import { apiUser, parseBody, respond } from '$lib/server/http';
import { updateQuotationSchema } from '$lib/schemas';
import { getQuotation, updateQuotation } from '$lib/server/services/quotations';

export const GET: RequestHandler = (event) =>
	respond(() => getQuotation(apiUser(event), event.params.id));

export const PUT: RequestHandler = (event) =>
	respond(async () => {
		const user = apiUser(event);
		const body = await parseBody(event, updateQuotationSchema);
		return updateQuotation(user, event.params.id, body);
	});
