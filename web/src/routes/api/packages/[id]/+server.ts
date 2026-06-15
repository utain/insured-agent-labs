import type { RequestHandler } from './$types';
import { apiUser, parseBody, respond } from '$lib/server/http';
import { updatePackageSchema } from '$lib/schemas';
import { deletePackage, getPackage, updatePackage } from '$lib/server/services/packages';

export const GET: RequestHandler = (event) =>
	respond(() => getPackage(apiUser(event), event.params.id));

export const PUT: RequestHandler = (event) =>
	respond(async () => {
		const user = apiUser(event);
		const body = await parseBody(event, updatePackageSchema);
		return updatePackage(user, event.params.id, body);
	});

export const DELETE: RequestHandler = (event) =>
	respond(() => {
		deletePackage(apiUser(event), event.params.id);
		return null;
	});
