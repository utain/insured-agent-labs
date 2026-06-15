import type { RequestHandler } from './$types';
import { apiUser, parseBody, respond } from '$lib/server/http';
import { createQuotationSchema } from '$lib/schemas';
import { createQuotation, listQuotations } from '$lib/server/services/quotations';

export const GET: RequestHandler = (event) => respond(() => listQuotations(apiUser(event)));

export const POST: RequestHandler = (event) =>
	respond(async () => {
		const user = apiUser(event);
		const body = await parseBody(event, createQuotationSchema);
		return createQuotation(user, body);
	});
