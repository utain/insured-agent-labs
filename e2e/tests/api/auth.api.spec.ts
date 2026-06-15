import { test, expect, json, bearer } from '../../fixtures/api';
import { USERS } from '../../fixtures/data';
import { DEMO_PASSWORD } from '../../fixtures/env';

test.describe('API · auth', () => {
	test('login returns a token and the user', async ({ api }) => {
		const body = await json(
			await api.post('/api/auth/login', {
				data: { username: USERS.standard, password: DEMO_PASSWORD }
			}),
			200
		);
		expect(body.token).toBeTruthy();
		expect(body.user).toMatchObject({ username: USERS.standard, scenario_flag: 'standard' });
	});

	test('wrong password is rejected with 401', async ({ api }) => {
		const res = await api.post('/api/auth/login', {
			data: { username: USERS.standard, password: 'nope' }
		});
		expect(res.status()).toBe(401);
	});

	test('locked agent is rejected with 423', async ({ api }) => {
		const res = await api.post('/api/auth/login', {
			data: { username: USERS.locked, password: DEMO_PASSWORD }
		});
		expect(res.status()).toBe(423);
	});

	test('GET /api/auth/me requires auth', async ({ api }) => {
		expect((await api.get('/api/auth/me')).status()).toBe(401);
	});

	test('GET /api/auth/me returns the current user with a token', async ({ api, standardToken }) => {
		const me = await json(await api.get('/api/auth/me', { headers: bearer(standardToken) }), 200);
		expect(me.username).toBe(USERS.standard);
	});
});
