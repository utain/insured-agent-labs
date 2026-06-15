import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { logout } from '$lib/server/services/auth';
import { clearSessionCookie } from '$lib/session';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		logout(locals.apiToken);
		clearSessionCookie(cookies);
		throw redirect(302, '/login');
	}
};
