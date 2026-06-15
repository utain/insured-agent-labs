import type { RequestHandler } from './$types';
import { apiUser, parseBody, respond } from '$lib/server/http';
import { createLeadSchema } from '$lib/schemas';
import { createLead, listLeads } from '$lib/server/services/leads';

export const GET: RequestHandler = (event) => respond(() => listLeads(apiUser(event)));

export const POST: RequestHandler = (event) =>
	respond(async () => {
		const user = apiUser(event);
		const body = await parseBody(event, createLeadSchema);
		return createLead(user, body);
	});
