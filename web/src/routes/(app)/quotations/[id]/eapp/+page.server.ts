import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { eappsApi, quotationsApi, ApiCallError } from '$lib/server/api';

export const actions: Actions = {
	default: async ({ params, locals }) => {
		const token = locals.apiToken!;
		try {
			const eapp = await eappsApi.create(token, params.id);
			throw redirect(302, `/eapps/${eapp.id}`);
		} catch (e) {
			if (e instanceof ApiCallError && e.status === 409) {
				// Already has an eapp — find it
				const quotation = await quotationsApi.get(token, params.id);
				throw error(409, {
					code: 'conflict',
					message: `E-app already exists for quotation ${quotation.id}`
				});
			}
			throw e;
		}
	}
};
