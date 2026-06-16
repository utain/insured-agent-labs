import { test, expect, expectError } from '../../fixtures/api';
import { USERS, validLead } from '../../fixtures/data';

test.describe('API · leads', () => {
	test('create → fetch → list', { tag: ['@smoke'] }, async ({ agent }) => {
		const created = await agent.leads.create(validLead());
		expect(created.id).toBeTruthy();
		expect(created.status).toBe('new');

		const fetched = await agent.leads.get(created.id);
		expect(fetched.full_name).toBe(created.full_name);

		const list = await agent.leads.list();
		expect(list.some((l) => l.id === created.id)).toBe(true);
	});

	test('fresh-start lead needs only name, dob, gender', async ({ agent }) => {
		const lead = await agent.leads.create({ full_name: 'Minimal', dob: '1992-03-04', gender: 'other' });
		expect(lead.status).toBe('new');
	});

	test('missing required fields → 422 with field errors', async ({ agent }) => {
		const body = await expectError(agent.leads.create({ full_name: '' }, { expect: 422 }));
		expect(body.error.code).toBe('validation');
		expect(body.error.fields?.length).toBeGreaterThan(0);
	});

	test('invalid national_id (when supplied) → 422', async ({ agent }) => {
		await agent.leads.create(validLead({ national_id: '123' }), { expect: 422 });
	});

	test('another agent cannot see my lead (404)', async ({ agent, loginAs }) => {
		const lead = await agent.leads.create(validLead());
		const bug = await loginAs(USERS.bug);
		await bug.leads.get(lead.id, { expect: 404 });
	});
});
