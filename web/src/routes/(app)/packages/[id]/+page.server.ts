import type { Actions, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { listProducts, listRiders } from '$lib/server/services/catalog';
import { deletePackage, getPackage, updatePackage } from '$lib/server/services/packages';
import { parsePackageForm } from '$lib/server/package-form';
import { failFromError } from '$lib/server/forms';
import { ApiError } from '$lib/server/api-error';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		return {
			pkg: getPackage(locals.user!, params.id),
			products: listProducts(),
			riders: listRiders()
		};
	} catch (e) {
		if (e instanceof ApiError)
			throw error(e.status === 404 ? 404 : 500, { code: e.code, message: e.message });
		throw e;
	}
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const form = await request.formData();
		try {
			updatePackage(locals.user!, params.id, parsePackageForm(form));
		} catch (e) {
			return failFromError(e);
		}
		throw redirect(302, '/packages');
	},
	delete: async ({ params, locals }) => {
		try {
			deletePackage(locals.user!, params.id);
		} catch (e) {
			return failFromError(e);
		}
		throw redirect(302, '/packages');
	}
};
