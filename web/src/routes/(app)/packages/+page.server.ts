import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { deletePackage, listPackages } from '$lib/server/services/packages';
import { ApiError } from '$lib/server/api-error';

export const load: PageServerLoad = async ({ locals }) => {
	return { packages: listPackages(locals.user!) };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const form = await request.formData();
		try {
			deletePackage(locals.user!, String(form.get('id')));
			return { ok: true };
		} catch (e) {
			if (e instanceof ApiError) return fail(e.status, { error: e.message });
			throw e;
		}
	}
};
