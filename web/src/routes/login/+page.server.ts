import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { authApi, ApiCallError } from '$lib/server/api';
import { setSessionCookie } from '$lib/session';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Already logged in → redirect away (also handled in hooks, but double-guard).
	if (locals.user) {
		throw redirect(302, url.searchParams.get('redirectTo') ?? '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');

		// Field-level validation (QA: empty-field alerts).
		const fieldErrors: Record<string, string> = {};
		if (!username) fieldErrors.username = 'login.error.required.username';
		if (!password) fieldErrors.password = 'login.error.required.password';
		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, { fieldErrors, values: { username } });
		}

		try {
			const { token } = await authApi.login({ username, password });
			setSessionCookie(cookies, token);
		} catch (e) {
			if (e instanceof ApiCallError) {
				if (e.status === 423) {
					return fail(423, { error: 'login.error.locked', values: { username } });
				}
				return fail(401, { error: 'login.error.invalid', values: { username } });
			}
			throw e;
		}

		throw redirect(302, url.searchParams.get('redirectTo') ?? '/');
	}
};
