import type { RequestHandler } from './$types';
import { parseBody, respond } from '$lib/server/http';
import { loginSchema } from '$lib/schemas';
import { login } from '$lib/server/services/auth';
import { setSessionCookie } from '$lib/session';

export const POST: RequestHandler = (event) =>
	respond(async () => {
		const body = await parseBody(event, loginSchema);
		const { token, user } = login(body);
		setSessionCookie(event.cookies, token);
		return { token, user };
	});
