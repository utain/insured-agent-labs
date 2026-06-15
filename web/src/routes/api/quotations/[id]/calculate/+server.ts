import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { calculateQuotation } from '$lib/server/services/quotations';

export const POST: RequestHandler = (event) =>
	respond(() => calculateQuotation(apiUser(event), event.params.id));
