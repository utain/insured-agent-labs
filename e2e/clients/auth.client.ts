import { BaseResource } from './base.client';
import { LoginResponse, User } from '../schemas';
import { DEMO_PASSWORD } from '../fixtures/env';

/** `/api/auth/*` — login and the current user. */
export class AuthApi extends BaseResource {
	/** POST /api/auth/login → `{ token, user }`. */
	login(username: string, password: string = DEMO_PASSWORD, opts: { expect?: number } = {}) {
		return this.http.post('/api/auth/login', {
			data: { username, password },
			schema: LoginResponse,
			expect: opts.expect
		});
	}

	/** GET /api/auth/me → the authenticated user. */
	me(opts: { expect?: number } = {}) {
		return this.http.get('/api/auth/me', { schema: User, expect: opts.expect });
	}
}
