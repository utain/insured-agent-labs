import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { leadsApi, ApiCallError } from '$lib/server/api';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const token = locals.apiToken!;
		const form = await request.formData();

		const full_name = String(form.get('full_name') ?? '').trim();
		const national_id = String(form.get('national_id') ?? '').trim();
		const dob = String(form.get('dob') ?? '').trim();
		const gender = String(form.get('gender') ?? '').trim() as 'male' | 'female' | 'other';
		const phone = String(form.get('phone') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const occupation = String(form.get('occupation') ?? '').trim();
		const incomeRaw = String(form.get('income') ?? '').trim();

		const values = {
			full_name,
			national_id,
			dob,
			gender,
			phone,
			email,
			occupation,
			income: incomeRaw
		};

		// Client-trusted field checks for empty required values.
		const fieldErrors: Record<string, string> = {};
		if (!full_name) fieldErrors.full_name = 'leads.error.required.full_name';
		if (!national_id) fieldErrors.national_id = 'leads.error.invalid.national_id';
		if (!dob) fieldErrors.dob = 'leads.error.invalid.dob';
		if (!gender) fieldErrors.gender = 'leads.error.required.full_name';
		if (!phone) fieldErrors.phone = 'leads.error.invalid.phone';
		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, { fieldErrors, values });
		}

		let lead;
		try {
			lead = await leadsApi.create(token, {
				full_name,
				national_id,
				dob,
				gender,
				phone,
				email: email || undefined,
				occupation: occupation || undefined,
				income: incomeRaw ? Number(incomeRaw) : undefined
			});
		} catch (e) {
			if (e instanceof ApiCallError && e.status === 422 && e.fields) {
				const serverFieldErrors: Record<string, string> = {};
				for (const f of e.fields) {
					// Map server field -> message key.
					const key =
						f.field === 'national_id'
							? 'leads.error.invalid.national_id'
							: f.field === 'dob'
								? 'leads.error.invalid.dob'
								: f.field === 'phone'
									? 'leads.error.invalid.phone'
									: f.field === 'email'
										? 'leads.error.invalid.email'
										: 'leads.error.required.full_name';
					serverFieldErrors[f.field] = key;
				}
				return fail(422, { fieldErrors: serverFieldErrors, values });
			}
			throw e;
		}
		throw redirect(302, `/leads/${lead.id}`);
	}
};
