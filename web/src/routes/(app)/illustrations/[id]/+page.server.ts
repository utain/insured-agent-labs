import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getIllustration } from '$lib/server/services/illustrations';
import { ApiError } from '$lib/server/api-error';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		return { illustration: getIllustration(locals.user!, params.id) };
	} catch (e) {
		if (e instanceof ApiError)
			throw error(e.status === 404 ? 404 : 500, { code: e.code, message: e.message });
		throw e;
	}
};
