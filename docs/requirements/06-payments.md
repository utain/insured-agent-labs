# 06 — Payments

**Status:** ✅ Implemented (Phase 4)
**Backend:** `backend/src/payments/` (`mod.rs`, `routes.rs`, `dto.rs`)
**Frontend:** `web/src/routes/(app)/eapps/[id]/payment`

## 1. Overview

A mock payment gateway used to satisfy the "successful payment required before
e-app submission" rule ([05](05-eapps-policy.md) FR-5.3). The amount is derived
server-side from the quotation's calculated modal premium — the client cannot
specify an amount. The `outcome` field lets QA trainees deterministically choose
`success` / `declined` / `pending` to exercise each downstream branch.

## 2. Actors

- **Agent** — initiates a payment for their own e-app.

## 3. Data Model

`Payment` (`backend/src/db.rs`):

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `eapp_id` | UUID | the e-app this payment is for |
| `amount` | f64 (THB) | = `quotation.calc.modal_premium`, or `0.0` if `calc` is unset |
| `method` | `card` \| `bank_transfer` \| `promptpay` | chosen by the agent |
| `status` | `success` \| `declined` \| `pending` | from request `outcome`, default `success` |
| `transaction_ref` | string (UUID) | server-generated mock reference |
| `created_at` | datetime | |

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments` | session | Create a mock payment for an e-app |
| `GET` | `/api/payments/{id}` | session | Get a payment (ownership via its e-app's `agent_id`) |

### `POST /api/payments`

Request (`CreatePaymentRequest`):
```json
{ "eapp_id": "<uuid>", "method": "card", "outcome": "success" }
```
- `eapp_id` must reference an e-app owned by the caller (`404` otherwise).
- `outcome` is optional; defaults to `success`.
- `amount` is computed from the e-app's linked quotation's
  `calc.modal_premium` (not supplied by the client).
- Side effects:
  - Sets `eapp.payment_id = payment.id`.
  - If `status == success`: sets the linked quotation's `status = paid`.
  - Updates the e-app's dashboard transaction status to one of `paid`,
    `payment_declined`, `payment_pending` based on `outcome`.

### `GET /api/payments/{id}`

- Ownership is checked indirectly: the payment's `eapp_id` must resolve to an
  e-app owned by the caller; otherwise `404 not_found`.

## 5. Functional Requirements

- **FR-6.1**: The system shall compute the payment `amount` server-side from the
  associated quotation's `modal_premium`; the client cannot override it.
- **FR-6.2**: Creating a payment shall link it to the e-app via `payment_id`
  (last-write-wins if called more than once).
- **FR-6.3**: A payment with `status == success` shall set the linked quotation's
  status to `paid`, satisfying the precondition for e-app submission
  ([05](05-eapps-policy.md) FR-5.3).
- **FR-6.4**: A payment with `status == declined` or `status == pending` shall
  **not** change the quotation status, and shall **not** satisfy the e-app
  submission precondition.
- **FR-6.5**: Each payment shall receive a unique, opaque `transaction_ref` for
  display/reconciliation purposes.

## 6. Business Rules & Validation

- No real payment gateway integration — this is fully mocked and deterministic.
- Multiple payments can be created for the same e-app (e.g. retry after
  `declined`); each call overwrites `eapp.payment_id` with the newest payment, so
  only the **most recent** payment's status gates submission.
- `method` has no effect on `amount` or `status` — it is purely descriptive for
  the UI.

## 7. UI Requirements

- `/(app)/eapps/[id]/payment` — payment page:
  - Method selector (`payment.method.{card,bank_transfer,promptpay}`).
  - Displays `payment.amount` (the modal premium, in ฿).
  - A "simulate" action (`payment.simulate`) that lets the trainee pick the
    outcome — surfaced as `payment.success` / `payment.declined` /
    `payment.pending` — and posts `{ eapp_id, method, outcome }`.
  - Result badge: `payment.status.success` / `.declined` / `.pending`
    (`payment-status-alert`, `role="status"`/`role="alert"` as appropriate).
  - On `success`, `payment.continue` routes back to the e-app to submit.
  - On `declined`/`pending`, the e-app's submit action remains disabled
    ([05](05-eapps-policy.md)).

## 8. Scenario Hooks (QA Training)

- The `outcome` parameter **is itself the primary QA hook** for this feature —
  independent of the agent's `scenario_flag`, any agent can exercise all three
  payment branches by choosing the outcome on this page.
- No additional `scenario_flag`-driven behavior (delay/bug/error) is documented
  for payments specifically.

## 9. Acceptance Criteria

- [ ] `POST /api/payments` with `outcome: "success"` returns `201`, sets
      `eapp.payment_id`, and sets the linked quotation's `status` to `paid`.
- [ ] `POST /api/payments` with `outcome: "declined"` returns `201` but leaves the
      quotation status unchanged, and a subsequent `eapp/{id}/submit` returns
      `409`.
- [ ] `POST /api/payments` with `outcome: "pending"` behaves like `declined` for
      submission purposes.
- [ ] `amount` in the response equals the quotation's `calc.modal_premium` at the
      time of payment creation.
- [ ] `GET /api/payments/{id}` for a payment on another agent's e-app returns
      `404`.
- [ ] Creating a second payment with `outcome: "success"` after a `declined`
      payment unblocks e-app submission.

## 10. Out of Scope

- Real payment gateway / PCI considerations.
- Refunds, partial payments, or installment tracking beyond the single `modal`
  amount.
- Payment history / receipts UI.
- Idempotency keys for duplicate submission prevention.
