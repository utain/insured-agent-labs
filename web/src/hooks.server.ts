import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { authApi, ApiCallError } from '$lib/server/api';
import { getSessionToken } from '$lib/session';
import { PUBLIC_PATHS } from '$lib/constants';

// Strip a leading locale prefix (/en, /th) from a pathname.
function stripLocale(pathname: string): string {
	const m = pathname.match(/^\/(en|th)(\/|$)/);
	return m ? pathname.slice(m[0].length - 1) : pathname;
}

const handleAuth: Handle = async ({ event, resolve }) => {
	const token = getSessionToken(event.cookies);
	event.locals.apiToken = token;
	if (token) {
		try {
			event.locals.user = await authApi.me(token);
		} catch (e) {
			// 401/423 etc → treat as logged out.
			if (e instanceof ApiCallError && e.status !== 401) {
				// Non-auth errors are unexpected; log but continue as anonymous.
				console.error('Unexpected /me error', e);
			}
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	// Route guard.
	const path = stripLocale(event.url.pathname);
	const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
	if (!event.locals.user && !isPublic) {
		throw redirect(
			302,
			`/login?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`
		);
	}
	if (event.locals.user && path === '/login') {
		throw redirect(302, '/');
	}

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

export const handle = sequence(handleAuth, handleParaglide);
