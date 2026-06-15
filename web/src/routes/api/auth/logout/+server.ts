import type { RequestHandler } from './$types';
import { respond } from '$lib/server/http';
import { logout } from '$lib/server/services/auth';
import { clearSessionCookie } from '$lib/session';

export const POST: RequestHandler = (event) =>
	respond(() => {
		logout(event.locals.apiToken);
		clearSessionCookie(event.cookies);
		return null;
	});
