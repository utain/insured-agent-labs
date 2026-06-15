// Helpers for /api/**/+server.ts routes: JSON responses, uniform error handling,
// zod body parsing, and authenticated-user resolution.

import { json, type RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';
import { ApiError } from './api-error';
import { requireUser } from './services/auth';
import type { User } from '$lib/schemas';

export { json };

/** Resolve the authenticated user for an API request, or throw 401. */
export function apiUser(event: RequestEvent): User {
	return requireUser(event.locals.apiToken);
}

/** Parse and validate a JSON body with a zod schema, throwing 422 on failure. */
export async function parseBody<T>(event: RequestEvent, schema: z.ZodType<T>): Promise<T> {
	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw new ApiError(400, 'bad_request', 'Request body must be valid JSON');
	}
	const result = schema.safeParse(body);
	if (!result.success) {
		throw ApiError.validation(
			result.error.issues.map((i) => ({
				field: i.path.join('.') || '(body)',
				message: i.message
			}))
		);
	}
	return result.data;
}

/** Run an async handler, converting thrown ApiErrors into the JSON error envelope. */
export async function respond(fn: () => unknown | Promise<unknown>): Promise<Response> {
	try {
		const data = await fn();
		if (data instanceof Response) return data;
		if (data === undefined || data === null) return new Response(null, { status: 204 });
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json(e.envelope(), { status: e.status });
		}
		console.error('Unhandled API error', e);
		return json(ApiError.server().envelope(), { status: 500 });
	}
}
