import { test, expect, login, bearer, backendContext } from '../fixtures/api';
import { USERS, validLead } from '../fixtures/data';

// Spec: docs/requirements/03-leads.md
test.describe('API · leads', () => {
  let token: string;
  test.beforeAll(async () => {
    const ctx = await backendContext();
    token = await login(ctx, USERS.standard);
    await ctx.dispose();
  });

  test('creates a lead with status "new"', async ({ api }) => {
    const res = await api.post('/api/leads', { headers: bearer(token), data: validLead() });
    expect(res.status()).toBe(201);
    const lead = await res.json();
    expect(lead).toMatchObject({ status: 'new' });
    expect(lead.id).toBeTruthy();
  });

  test('reports all field errors together (422)', async ({ api }) => {
    const res = await api.post('/api/leads', {
      headers: bearer(token),
      data: validLead({
        national_id: '1234567890123', // bad checksum
        dob: '2020-01-01', // underage
        phone: 'oops' // bad phone
      })
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe('validation');
    const fields = body.error.fields.map((f: { field: string }) => f.field);
    expect(fields).toEqual(expect.arrayContaining(['national_id', 'dob', 'phone']));
    expect(body.error.fields.length).toBeGreaterThanOrEqual(3);
  });

  test('lists only the caller’s leads and supports get', async ({ api }) => {
    const created = await api.post('/api/leads', {
      headers: bearer(token),
      data: validLead({ full_name: 'List Me' })
    });
    const id = (await created.json()).id;

    const list = await api.get('/api/leads', { headers: bearer(token) });
    expect(list.status()).toBe(200);
    const ids = (await list.json()).map((l: { id: string }) => l.id);
    expect(ids).toContain(id);

    const get = await api.get(`/api/leads/${id}`, { headers: bearer(token) });
    expect(get.status()).toBe(200);
    expect((await get.json()).full_name).toBe('List Me');
  });

  test('unknown lead id → 404', async ({ api }) => {
    const res = await api.get('/api/leads/00000000-0000-0000-0000-000000000000', {
      headers: bearer(token)
    });
    expect(res.status()).toBe(404);
  });

  test('updates and deletes a lead while status is "new"', async ({ api }) => {
    const created = await api.post('/api/leads', {
      headers: bearer(token),
      data: validLead({ full_name: 'Editable' })
    });
    const id = (await created.json()).id;

    const upd = await api.put(`/api/leads/${id}`, {
      headers: bearer(token),
      data: { occupation: 'Updated Occupation' }
    });
    expect(upd.status()).toBe(200);
    expect((await upd.json()).occupation).toBe('Updated Occupation');

    const del = await api.delete(`/api/leads/${id}`, { headers: bearer(token) });
    expect(del.status()).toBe(204);

    const gone = await api.get(`/api/leads/${id}`, { headers: bearer(token) });
    expect(gone.status()).toBe(404);
  });

  test('creating a quotation locks the lead from edit/delete (409)', async ({ api }) => {
    const created = await api.post('/api/leads', {
      headers: bearer(token),
      data: validLead({ full_name: 'Locked By Quote' })
    });
    const leadId = (await created.json()).id;

    const quote = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: 'LIFE_TERM' }
    });
    expect(quote.status()).toBe(201);

    const upd = await api.put(`/api/leads/${leadId}`, {
      headers: bearer(token),
      data: { occupation: 'too late' }
    });
    expect(upd.status()).toBe(409);

    const del = await api.delete(`/api/leads/${leadId}`, { headers: bearer(token) });
    expect(del.status()).toBe(409);
  });
});
