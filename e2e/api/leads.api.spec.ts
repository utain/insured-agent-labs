import { test, expect, json, bearer } from '../fixtures/api';
import { validLead } from '../fixtures/data';

test.describe('API · leads', () => {
	test('create → fetch → list', async ({ api, standardToken }) => {
		const created = await json(
			await api.post('/api/leads', { headers: bearer(standardToken), data: validLead() }),
			200,
			'create lead'
		);
		expect(created.id).toBeTruthy();
		expect(created.status).toBe('new');

		const fetched = await json(
			await api.get(`/api/leads/${created.id}`, { headers: bearer(standardToken) }),
			200
		);
		expect(fetched.full_name).toBe(created.full_name);

		const list = await json(await api.get('/api/leads', { headers: bearer(standardToken) }), 200);
		expect(list.some((l: any) => l.id === created.id)).toBe(true);
	});

	test('fresh-start lead needs only name, dob, gender', async ({ api, standardToken }) => {
		const res = await api.post('/api/leads', {
			headers: bearer(standardToken),
			data: { full_name: 'Minimal', dob: '1992-03-04', gender: 'other' }
		});
		expect(res.status()).toBe(200);
	});

	test('missing required fields → 422 with field errors', async ({ api, standardToken }) => {
		const body = await json(
			await api.post('/api/leads', { headers: bearer(standardToken), data: { full_name: '' } }),
			422
		);
		expect(body.error.code).toBe('validation');
		expect(body.error.fields.length).toBeGreaterThan(0);
	});

	test('invalid national_id (when supplied) → 422', async ({ api, standardToken }) => {
		const res = await api.post('/api/leads', {
			headers: bearer(standardToken),
			data: validLead({ national_id: '123' })
		});
		expect(res.status()).toBe(422);
	});

	test('another agent cannot see my lead (404)', async ({ api, standardToken }) => {
		const lead = await json(
			await api.post('/api/leads', { headers: bearer(standardToken), data: validLead() }),
			200
		);
		const bugToken = (
			await json(
				await api.post('/api/auth/login', {
					data: { username: 'agent.bug', password: 'insure_demo' }
				}),
				200
			)
		).token;
		expect(
			(await api.get(`/api/leads/${lead.id}`, { headers: bearer(bugToken) })).status()
		).toBe(404);
	});
});
