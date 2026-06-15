import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { createLeadSchema } from '$lib/schemas';
import { createLead } from '$lib/server/services/leads';
import { failFromError } from '$lib/server/forms';
import { ApiError } from '$lib/server/api-error';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const raw = {
			full_name: String(form.get('full_name') ?? '').trim(),
			dob: String(form.get('dob') ?? '').trim(),
			gender: String(form.get('gender') ?? '').trim(),
			occupation: String(form.get('occupation') ?? '').trim() || null,
			national_id: String(form.get('national_id') ?? '').trim() || null,
			phone: String(form.get('phone') ?? '').trim() || null,
			email: String(form.get('email') ?? '').trim() || null
		};

		const parsed = createLeadSchema.safeParse(raw);
		if (!parsed.success) {
			return failFromError(
				ApiError.validation(
					parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
				),
				raw
			);
		}

		let lead;
		try {
			lead = createLead(locals.user!, parsed.data);
		} catch (e) {
			return failFromError(e, raw);
		}
		throw redirect(302, `/leads/${lead.id}`);
	}
};
