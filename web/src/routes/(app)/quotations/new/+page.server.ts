import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { createQuotationSchema } from '$lib/schemas';
import { listLeads } from '$lib/server/services/leads';
import { createQuotation } from '$lib/server/services/quotations';
import { failFromError } from '$lib/server/forms';
import { ApiError } from '$lib/server/api-error';

export const load: PageServerLoad = async ({ locals, url }) => {
	return {
		leads: listLeads(locals.user!),
		preselectLeadId: url.searchParams.get('leadId') ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const mode = String(form.get('mode') ?? 'existing');

		const raw =
			mode === 'existing'
				? { lead_id: String(form.get('lead_id') ?? '') || undefined }
				: {
						insured: {
							full_name: String(form.get('full_name') ?? '').trim(),
							dob: String(form.get('dob') ?? '').trim(),
							gender: String(form.get('gender') ?? '').trim(),
							occupation: String(form.get('occupation') ?? '').trim() || null
						}
					};

		const parsed = createQuotationSchema.safeParse(raw);
		if (!parsed.success) {
			return failFromError(
				ApiError.validation(
					parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
				),
				{ mode, ...Object.fromEntries(form) }
			);
		}

		let quotation;
		try {
			quotation = createQuotation(locals.user!, parsed.data);
		} catch (e) {
			return failFromError(e, { mode });
		}
		throw redirect(302, `/quotations/${quotation.id}`);
	}
};
