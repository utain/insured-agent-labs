// Parse the package form payload (shared by new + edit pages).

import { createPackageSchema } from '$lib/schemas';
import { ApiError } from './api-error';

export function parsePackageForm(form: FormData) {
	let riders: unknown;
	try {
		riders = JSON.parse(String(form.get('riders') ?? '[]'));
	} catch {
		riders = [];
	}
	const raw = {
		name: String(form.get('name') ?? '').trim(),
		description: String(form.get('description') ?? '').trim(),
		base_product_code: String(form.get('base_product_code') ?? ''),
		default_sum_assured: Number(form.get('default_sum_assured') ?? 0),
		term: Number(form.get('term') ?? 0),
		modal: String(form.get('modal') ?? 'annual'),
		riders
	};
	const parsed = createPackageSchema.safeParse(raw);
	if (!parsed.success) {
		throw ApiError.validation(
			parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
		);
	}
	return parsed.data;
}
