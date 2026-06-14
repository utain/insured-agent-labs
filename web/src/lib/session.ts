import { SESSION_COOKIE } from '$lib/constants';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

export function setSessionCookie(
	cookies: { set: (n: string, v: string, o: object) => void },
	token: string
) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // dev only; revisit for prod
		maxAge: SESSION_MAX_AGE_SECONDS
	});
}

export function clearSessionCookie(cookies: { delete: (n: string, o: object) => void }) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionToken(cookies: {
	get: (n: string) => string | undefined;
}): string | null {
	return cookies.get(SESSION_COOKIE) ?? null;
}
