import type { RequestHandler } from './$types';
import { apiUser, parseBody, respond } from '$lib/server/http';
import { updateLeadSchema } from '$lib/schemas';
import { deleteLead, getLead, updateLead } from '$lib/server/services/leads';

export const GET: RequestHandler = (event) =>
	respond(() => getLead(apiUser(event), event.params.id));

export const PUT: RequestHandler = (event) =>
	respond(async () => {
		const user = apiUser(event);
		const body = await parseBody(event, updateLeadSchema);
		return updateLead(user, event.params.id, body);
	});

export const DELETE: RequestHandler = (event) =>
	respond(() => {
		deleteLead(apiUser(event), event.params.id);
		return null;
	});
