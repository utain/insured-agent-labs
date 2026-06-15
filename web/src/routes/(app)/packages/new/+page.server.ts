import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { listProducts, listRiders } from '$lib/server/services/catalog';
import { createPackage } from '$lib/server/services/packages';
import { parsePackageForm } from '$lib/server/package-form';
import { failFromError } from '$lib/server/forms';

export const load: PageServerLoad = async () => {
	return { products: listProducts(), riders: listRiders() };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		let pkg;
		try {
			pkg = createPackage(locals.user!, parsePackageForm(form));
		} catch (e) {
			return failFromError(e);
		}
		throw redirect(302, `/packages/${pkg.id}`);
	}
};
