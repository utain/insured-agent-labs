import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { createIllustration } from '$lib/server/services/illustrations';

export const POST: RequestHandler = (event) =>
	respond(() => createIllustration(apiUser(event), event.params.id));
