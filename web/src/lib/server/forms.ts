// Bridge service ApiErrors into SvelteKit form-action failures.

import { fail } from '@sveltejs/kit';
import { ApiError } from './api-error';

export function failFromError(e: unknown, values?: Record<string, unknown>) {
	if (e instanceof ApiError) {
		const fieldErrors: Record<string, string> = {};
		for (const f of e.fields ?? []) fieldErrors[f.field] = f.message;
		return fail(e.status >= 400 ? e.status : 400, {
			error: e.message,
			code: e.code,
			fieldErrors,
			values: values ?? {}
		});
	}
	throw e;
}
