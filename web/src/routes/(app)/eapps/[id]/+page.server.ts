import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { eappsApi, quotationsApi, ApiCallError } from '$lib/server/api';
import type { Beneficiary, HealthDeclaration } from '$lib/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const token = locals.apiToken!;
	try {
		const eapp = await eappsApi.get(token, params.id);
		const quotation = await quotationsApi.get(token, eapp.quotation_id);
		return { eapp, quotation };
	} catch (e) {
		if (e instanceof ApiCallError && (e.status === 404 || e.status === 401)) {
			throw error(404, { code: 'not_found', message: 'E-application not found' });
		}
		throw e;
	}
};

export const actions: Actions = {
	save: async ({ params, request, locals }) => {
		const token = locals.apiToken!;
		const form = await request.formData();

		// Parse beneficiaries (repeating groups).
		const benCount = Number(form.get('ben_count') ?? '0');
		const beneficiaries: Beneficiary[] = [];
		for (let i = 0; i < benCount; i++) {
			const name = String(form.get(`ben_name_${i}`) ?? '').trim();
			const relationship = String(form.get(`ben_rel_${i}`) ?? '').trim();
			const national_id = String(form.get(`ben_nid_${i}`) ?? '').trim();
			const share = Number(form.get(`ben_share_${i}`) ?? '0');
			if (name || relationship || national_id || share) {
				beneficiaries.push({ name, relationship, national_id, share_pct: share });
			}
		}

		// Parse health declarations.
		const health: HealthDeclaration[] = [];
		for (const qid of ['q1', 'q2', 'q3']) {
			const answer = form.get(`health_${qid}`) === 'yes';
			const details = String(form.get(`health_details_${qid}`) ?? '').trim();
			health.push({ question_id: qid, answer, details: details || null });
		}

		try {
			const eapp = await eappsApi.update(token, params.id, {
				beneficiaries,
				health_declarations: health
			});
			return { ok: true, eapp };
		} catch (e) {
			if (e instanceof ApiCallError && e.fields) {
				const fieldErrors: Record<string, string> = {};
				for (const f of e.fields) {
					fieldErrors[f.field] = f.message;
				}
				return fail(422, { fieldErrors });
			}
			if (e instanceof ApiCallError) {
				return fail(e.status, { error: e.message });
			}
			throw e;
		}
	}
};
