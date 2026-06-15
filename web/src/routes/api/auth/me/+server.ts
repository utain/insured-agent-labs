import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';

export const GET: RequestHandler = (event) => respond(() => apiUser(event));
