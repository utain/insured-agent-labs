import type { RequestHandler } from './$types';
import { apiUser, parseBody, respond } from '$lib/server/http';
import { createPackageSchema } from '$lib/schemas';
import { createPackage, listPackages } from '$lib/server/services/packages';

export const GET: RequestHandler = (event) => respond(() => listPackages(apiUser(event)));

export const POST: RequestHandler = (event) =>
	respond(async () => {
		const user = apiUser(event);
		const body = await parseBody(event, createPackageSchema);
		return createPackage(user, body);
	});
