import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { getIllustration } from '$lib/server/services/illustrations';

export const GET: RequestHandler = (event) =>
	respond(() => getIllustration(apiUser(event), event.params.id));
