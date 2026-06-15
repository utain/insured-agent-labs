import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { login } from '$lib/server/services/auth';
import { failFromError } from '$lib/server/forms';
import { setSessionCookie } from '$lib/session';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) throw redirect(302, url.searchParams.get('redirectTo') ?? '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');

		try {
			const { token } = login({ username, password });
			setSessionCookie(cookies, token);
		} catch (e) {
			return failFromError(e, { username });
		}

		throw redirect(302, url.searchParams.get('redirectTo') ?? '/');
	}
};
