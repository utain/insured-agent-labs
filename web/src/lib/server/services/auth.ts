// Authentication: session tokens kept in the in-memory store, resolved from a
// cookie (browser) or Bearer header (API/QA). Preserves the agent.locked scenario.

import type { LoginRequest, User } from '$lib/schemas';
import { ApiError } from '../api-error';
import { db, newToken } from '../store';

export function login({ username, password }: LoginRequest): { token: string; user: User } {
	const userId = db().usersByUsername.get(username);
	const user = userId ? db().users.get(userId) : undefined;
	if (!user || db().passwords.get(user.id) !== password) {
		throw new ApiError(401, 'invalid_credentials', 'Invalid username or password');
	}
	// Scenario: locked agents are rejected before a token is issued.
	if (user.scenario_flag === 'locked') {
		throw ApiError.locked('This account is locked. Contact your administrator.');
	}
	const token = newToken();
	db().sessions.set(token, user.id);
	return { token, user };
}

export function logout(token: string | null): void {
	if (token) db().sessions.delete(token);
}

export function userForToken(token: string | null): User | null {
	if (!token) return null;
	const userId = db().sessions.get(token);
	if (!userId) return null;
	return db().users.get(userId) ?? null;
}

/** Resolve the authenticated user or throw 401. Accepts cookie token or Bearer header. */
export function requireUser(token: string | null): User {
	const user = userForToken(token);
	if (!user) throw ApiError.unauthorized();
	return user;
}

/** Extract a Bearer token from an Authorization header, if present. */
export function bearerToken(headers: Headers): string | null {
	const auth = headers.get('authorization');
	if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
	return null;
}
