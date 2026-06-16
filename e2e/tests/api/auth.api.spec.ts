import { test, expect } from '../../fixtures/api';
import { USERS } from '../../fixtures/data';

test.describe('API · auth', () => {
	test('login returns a token and the user', { tag: ['@smoke'] }, async ({ anon }) => {
		const body = await anon.auth.login(USERS.standard);
		expect(body.token).toBeTruthy();
		expect(body.user).toMatchObject({ username: USERS.standard, scenario_flag: 'standard' });
	});

	test('wrong password is rejected with 401', async ({ anon }) => {
		await anon.auth.login(USERS.standard, 'nope', { expect: 401 });
	});

	test('locked agent is rejected with 423', async ({ anon }) => {
		await anon.auth.login(USERS.locked, undefined, { expect: 423 });
	});

	test('GET /api/auth/me requires auth', async ({ anon }) => {
		await anon.auth.me({ expect: 401 });
	});

	test('GET /api/auth/me returns the current user with a token', async ({ agent }) => {
		const me = await agent.auth.me();
		expect(me.username).toBe(USERS.standard);
	});
});
