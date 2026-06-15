import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { bearerToken, userForToken } from '$lib/server/services/auth';
import { getSessionToken } from '$lib/session';
import { PUBLIC_PATHS } from '$lib/constants';

export const handle: Handle = async ({ event, resolve }) => {
	// API requests may authenticate with a Bearer token; the browser uses the cookie.
	const token = bearerToken(event.request.headers) ?? getSessionToken(event.cookies);
	event.locals.apiToken = token;
	event.locals.user = userForToken(token);

	const path = event.url.pathname;
	const isApi = path.startsWith('/api');
	const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

	// API routes enforce their own auth and return JSON errors — never redirect them.
	if (!isApi) {
		if (!event.locals.user && !isPublic) {
			throw redirect(
				302,
				`/login?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`
			);
		}
		if (event.locals.user && path === '/login') {
			throw redirect(302, '/');
		}
	}

	return resolve(event);
};
