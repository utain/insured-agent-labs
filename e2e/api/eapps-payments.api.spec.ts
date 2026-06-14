import {
  test,
  expect,
  login,
  bearer,
  backendContext,
  createFinalizedQuotation
} from '../fixtures/api';
import {
  USERS,
  PRODUCTS,
  validLead,
  validBeneficiaries,
  cleanHealthDeclarations
} from '../fixtures/data';

// Spec: docs/requirements/05-eapps-policy.md + 06-payments.md
test.describe('API · e-apps & payments', () => {
  let token: string;

  test.beforeAll(async () => {
    const ctx = await backendContext();
    token = await login(ctx, USERS.standard);
    await ctx.dispose();
  });

  test('cannot create an e-app from a draft (un-finalized) quotation', async ({ api }) => {
    const leadRes = await api.post('/api/leads', { headers: bearer(token), data: validLead() });
    const leadId = (await leadRes.json()).id;
    const qRes = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: PRODUCTS.term }
    });
    const quotationId = (await qRes.json()).id; // still draft

    const res = await api.post('/api/eapps', {
      headers: bearer(token),
      data: { quotation_id: quotationId }
    });
    expect(res.status()).toBe(409);
  });

  test('full chain: e-app → validation → payment gating → submit issues a policy', async ({
    api
  }) => {
    const { quotationId } = await createFinalizedQuotation(api, token, {
      lead: validLead(),
      product: PRODUCTS.term,
      sum_assured: 1_000_000,
      term: 20
    });

    // Create the e-app
    const eRes = await api.post('/api/eapps', {
      headers: bearer(token),
      data: { quotation_id: quotationId }
    });
    expect(eRes.status()).toBe(201);
    const eappId = (await eRes.json()).id;

    // Beneficiary validation: shares must sum to 100
    const bad = await api.put(`/api/eapps/${eappId}`, {
      headers: bearer(token),
      data: {
        beneficiaries: [
          { name: 'Only', relationship: 'Self', national_id: validBeneficiaries()[0].national_id, share_pct: 99 }
        ],
        health_declarations: cleanHealthDeclarations()
      }
    });
    expect(bad.status()).toBe(422);

    // Valid beneficiaries + health
    const good = await api.put(`/api/eapps/${eappId}`, {
      headers: bearer(token),
      data: { beneficiaries: validBeneficiaries(), health_declarations: cleanHealthDeclarations() }
    });
    expect(good.status()).toBe(200);

    // Submit without a successful payment → 409
    const early = await api.post(`/api/eapps/${eappId}/submit`, { headers: bearer(token) });
    expect(early.status()).toBe(409);

    // A declined payment does not unblock submission
    const declined = await api.post('/api/payments', {
      headers: bearer(token),
      data: { eapp_id: eappId, method: 'card', outcome: 'declined' }
    });
    expect(declined.status()).toBe(201);
    const stillBlocked = await api.post(`/api/eapps/${eappId}/submit`, { headers: bearer(token) });
    expect(stillBlocked.status()).toBe(409);

    // A successful payment sets the quotation to "paid" and unblocks submission
    const paid = await api.post('/api/payments', {
      headers: bearer(token),
      data: { eapp_id: eappId, method: 'promptpay', outcome: 'success' }
    });
    expect(paid.status()).toBe(201);
    const payment = await paid.json();
    expect(payment.status).toBe('success');

    const quote = await api.get(`/api/quotations/${quotationId}`, { headers: bearer(token) });
    expect((await quote.json()).status).toBe('paid');

    // Amount is the server-computed modal premium (not client-supplied)
    expect(payment.amount).toBeGreaterThan(0);

    // Submit → policy issued
    const submit = await api.post(`/api/eapps/${eappId}/submit`, { headers: bearer(token) });
    expect(submit.status()).toBe(200);
    const submitted = await submit.json();
    expect(submitted.status).toBe('submitted');
    expect(submitted.policy_number).toMatch(/^POL-\d{8}-[0-9a-f]{8}$/);
    expect(submitted.submitted_at).toBeTruthy();

    // Submitting again conflicts
    const again = await api.post(`/api/eapps/${eappId}/submit`, { headers: bearer(token) });
    expect(again.status()).toBe(409);
  });

  test('payment for another agent’s e-app is not visible (404)', async ({ api }) => {
    // Build an e-app + payment as agent.standard
    const { quotationId } = await createFinalizedQuotation(api, token, {
      lead: validLead(),
      product: PRODUCTS.term,
      sum_assured: 500_000,
      term: 10
    });
    const eRes = await api.post('/api/eapps', {
      headers: bearer(token),
      data: { quotation_id: quotationId }
    });
    const eappId = (await eRes.json()).id;
    const payRes = await api.post('/api/payments', {
      headers: bearer(token),
      data: { eapp_id: eappId, method: 'card', outcome: 'success' }
    });
    const paymentId = (await payRes.json()).id;

    // A different agent cannot read it
    const otherToken = await login(api, USERS.glitch);
    const res = await api.get(`/api/payments/${paymentId}`, { headers: bearer(otherToken) });
    expect(res.status()).toBe(404);
  });
});
