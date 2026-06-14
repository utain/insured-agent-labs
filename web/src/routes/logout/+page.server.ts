import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { authApi, ApiCallError } from '$lib/server/api';
import { clearSessionCookie } from '$lib/session';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		if (locals.apiToken) {
			try {
				await authApi.logout(locals.apiToken);
			} catch (e) {
				// Even if the API errors, clear the cookie locally.
				if (!(e instanceof ApiCallError)) console.error('logout error', e);
			}
		}
		clearSessionCookie(cookies);
		throw redirect(302, '/login');
	}
};
