import { test, expect, login, bearer } from '../fixtures/api';
import { USERS } from '../fixtures/data';
import { DEMO_PASSWORD } from '../fixtures/env';

// Spec: docs/requirements/01-auth.md
test.describe('API · auth', () => {
  test('login with valid credentials returns token + user and sets cookie', async ({ api }) => {
    const res = await api.post('/api/auth/login', {
      data: { username: USERS.standard, password: DEMO_PASSWORD }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user).toMatchObject({ username: USERS.standard });
    // password must never be returned
    expect(body.user.password ?? '').toBe('');
    // session cookie is set
    const setCookie = res.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('session=');
    expect(setCookie.toLowerCase()).toContain('httponly');
  });

  test('wrong password → 401 unauthorized', async ({ api }) => {
    const res = await api.post('/api/auth/login', {
      data: { username: USERS.standard, password: 'nope' }
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).error.code).toBe('unauthorized');
  });

  test('unknown username → 401 unauthorized', async ({ api }) => {
    const res = await api.post('/api/auth/login', {
      data: { username: 'ghost.agent', password: DEMO_PASSWORD }
    });
    expect(res.status()).toBe(401);
  });

  test('locked scenario user → 423 locked', async ({ api }) => {
    const res = await api.post('/api/auth/login', {
      data: { username: USERS.locked, password: DEMO_PASSWORD }
    });
    expect(res.status()).toBe(423);
    expect((await res.json()).error.code).toBe('locked');
  });

  test('GET /api/auth/me requires a session', async ({ api }) => {
    const res = await api.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/auth/me returns the current user with a token', async ({ api }) => {
    const token = await login(api, USERS.standard);
    const res = await api.get('/api/auth/me', { headers: bearer(token) });
    expect(res.status()).toBe(200);
    expect((await res.json()).username).toBe(USERS.standard);
  });

  test('logout invalidates the session', async ({ api }) => {
    const token = await login(api, USERS.standard);
    const out = await api.post('/api/auth/logout', { headers: bearer(token) });
    expect(out.status()).toBe(204);
    const me = await api.get('/api/auth/me', { headers: bearer(token) });
    expect(me.status()).toBe(401);
  });
});
