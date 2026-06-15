import { test, expect, json } from '../fixtures/api';

test.describe('API · health', () => {
  test('GET /api/healthz returns ok', async ({ api }) => {
    const res = await api.get('/api/healthz');
    expect(await json(res, 200)).toMatchObject({ status: 'ok' });
  });
});
