# 05 — E-Application & Policy Issuance

**Status:** ✅ Implemented (Phase 4)
**Backend:** `backend/src/eapps/` (`mod.rs`, `routes.rs`, `dto.rs`, `validation.rs`)
**Frontend:** `web/src/routes/(app)/eapps/[id]`, `.../eapps/[id]/payment`,
`web/src/routes/(app)/policies/[id]`

## 1. Overview

An e-application ("e-app") is created from a `quoted` quotation and collects the
information required to issue a policy: beneficiaries (with share percentages) and
health declarations. Submission requires a successful payment ([06](06-payments.md))
and, once submitted, issues a policy number that is displayed on the Policy page.

## 2. Actors

- **Agent** — creates, edits (pre-submission), and submits e-apps for their own
  quotations.

## 3. Data Model

`EApplication` (`backend/src/db.rs`):

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `quotation_id` | UUID | source quotation (must have been `quoted`) |
| `lead_id` | UUID | copied from the quotation |
| `agent_id` | UUID | owner |
| `beneficiaries` | `Beneficiary[]` | see below |
| `health_declarations` | `HealthDeclaration[]` | see below |
| `payment_id` | UUID? | set once a payment is created against this e-app |
| `status` | `created` \| `submitted` | |
| `submitted_at` | datetime? | |
| `policy_number` | string? | format `POL-YYYYMMDD-XXXXXXXX` (8 hex chars), issued on submit |
| `created_at` / `updated_at` | datetime | |

`Beneficiary`:

| Field | Type | Notes |
|---|---|---|
| `name` | string | required |
| `relationship` | string | required |
| `national_id` | string | valid Thai national ID |
| `share_pct` | f64 | `0 < share_pct <= 100`; all beneficiaries' shares must sum to 100 |

`HealthDeclaration`:

| Field | Type | Notes |
|---|---|---|
| `question_id` | string | e.g. `eapp.health.q1`/`q2`/`q3` |
| `answer` | bool | `true` = Yes |
| `details` | string? | **required (non-empty) when `answer == true`** |

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/eapps` | session | Create from `{ quotation_id }` — quotation must be `quoted` |
| `GET` | `/api/eapps/{id}` | session | Get one e-app |
| `PUT` | `/api/eapps/{id}` | session | Update beneficiaries/health declarations — **only while `created`** |
| `POST` | `/api/eapps/{id}/submit` | session | Submit; requires a successful payment; issues policy |

### `POST /api/eapps`

- `404 not_found` if the quotation doesn't exist or isn't owned by the caller.
- `409 conflict` ("Quotation must be finalized (Quoted) ...") if
  `quotation.status != quoted`.
- Creates the e-app with empty `beneficiaries`/`health_declarations`,
  `status = created`.
- Sets the source quotation's `status = eapp`.
- Creates an `eapp` transaction with status `created`.

### `PUT /api/eapps/{id}`

- `409 conflict` if `status != created` ("E-application already submitted").
- If **both** `beneficiaries` and `health_declarations` are provided, runs full
  validation (§6) before applying either — `422 validation` on failure, no partial
  writes.
- If only `health_declarations` is provided (no `beneficiaries`), it is applied
  without the cross-field validation (beneficiaries are validated only when both
  are sent together — see note in §6).

### `POST /api/eapps/{id}/submit`

- `409 conflict` if `status != created`.
- `409 conflict` ("A successful payment is required before submission") unless
  `payment_id` points at a `Payment` with `status == success`.
- Runs full beneficiary/health validation (§6) — `422` if it fails (e.g. agent
  skipped the e-app form and went straight to payment).
- On success:
  - `status = submitted`, `submitted_at = now`
  - `policy_number = "POL-{YYYYMMDD}-{8 hex chars}"`
  - Linked quotation's `status = paid → submitted` *(quotation status set to
    `submitted`)*
  - The `eapp` transaction is updated to `status = submitted` with a summary
    showing the issued policy number.

## 5. Functional Requirements

- **FR-5.1**: An e-app shall only be creatable from a quotation in `quoted` status;
  otherwise `409 conflict`.
- **FR-5.2**: An e-app shall only be editable (`PUT`) while `status == created`.
- **FR-5.3**: Submission shall be blocked (`409 conflict`) unless a payment with
  `status == success` is associated with the e-app via `payment_id`.
- **FR-5.4**: Submission shall be blocked (`422 validation`) unless beneficiaries
  and health declarations both pass validation (§6), regardless of whether they
  were saved via `PUT` beforehand.
- **FR-5.5**: On successful submission, the system shall generate a unique policy
  number in the format `POL-YYYYMMDD-XXXXXXXX` and set `submitted_at`.
- **FR-5.6**: The Policy view (`/(app)/policies/[id]`) shall display the issued
  policy number, insured name, product, sum assured, premium, and status by
  joining the e-app → quotation → catalog product.

## 6. Business Rules & Validation

(`backend/src/eapps/validation.rs`)

**Beneficiaries** (at least 1 required):
- Sum of all `share_pct` must equal `100` (±0.01 tolerance).
- Each beneficiary: `name` and `relationship` non-empty (after trim), `national_id`
  passes the Thai checksum, `0 < share_pct <= 100`.

**Health declarations**:
- For each entry where `answer == true`, `details` must be present and non-empty
  (after trim).

> **Note**: `validate()` is only invoked from `PUT` when **both** `beneficiaries`
> and `health_declarations` are present in the request body, and unconditionally
> from `submit`. A `PUT` that sends only `health_declarations` bypasses
> beneficiary validation for that call — the final `submit` call still enforces
> both.

**Status lifecycle**: `created → submitted` (one-way).

## 7. UI Requirements

- `/(app)/eapps/[id]` — e-app form:
  - Beneficiaries section (`eapp.beneficiaries`): add/remove rows
    (`eapp.beneficiary.add`/`remove`), per-row name/relationship/national
    ID/share fields, running total (`eapp.beneficiary.total_share`) with
    `eapp.beneficiary.share_error` if ≠ 100%.
  - Health declarations (`eapp.health`): yes/no per question
    (`eapp.health.q1`–`q3`), with a conditional `eapp.health.details` textarea
    when "Yes" is selected.
  - `eapp.save` persists via `PUT`; `eapp.submit` is disabled
    (`eapp.submit.disabled`) until a successful payment exists, then routes to
    `/(app)/eapps/[id]/payment` or calls `/submit` once payment is confirmed.
  - On success, shows `eapp.submitted` and links to the policy page.
  - Errors surface via `eapp-error-alert`.
- `/(app)/policies/[id]` — read-only policy summary (`policy-page`):
  `policy.number`, `policy.status`, `policy.insured`, `policy.product`,
  `policy.sum_assured`, `policy.premium`, sourced by composing
  `GET /api/eapps/{id}` → `GET /api/quotations/{quotation_id}` →
  `GET /api/catalog/products/{base_product_code}`.

## 8. Scenario Hooks (QA Training)

| Scenario user | Effect on this feature |
|---|---|
| `agent.glitch` | `/submit` may have an artificial delay (3–5s, per `docs/TEST-USERS.md`) — trainees test loading states on submission. |
| `agent.bug` | The e-app form may render with a dead "Save" button and/or a broken image on this step (per `docs/TEST-USERS.md`) — trainees detect non-functional UI vs. a working API. |
| `agent.error` | May 500 on related dashboard load (per `docs/TEST-USERS.md`); finalize-related errors originate upstream in [04](04-quotations.md). |

## 9. Acceptance Criteria

- [ ] `POST /api/eapps` against a `draft` quotation returns `409`; against a
      `quoted` quotation returns `201` with `status: "created"`.
- [ ] `PUT` with beneficiary shares summing to 99 returns `422` mentioning
      `beneficiaries`.
- [ ] `PUT` with a health declaration `answer: true` and empty `details` returns
      `422`.
- [ ] `POST /{id}/submit` without a successful payment returns `409`.
- [ ] After a successful payment and valid beneficiaries/health declarations,
      `POST /{id}/submit` returns `200` with `status: "submitted"`, a non-null
      `policy_number`, and `submitted_at` set.
- [ ] `GET /(app)/policies/[id]` after submission shows the policy number and
      matches the quotation's product/premium.
- [ ] Calling `submit` twice returns `409` the second time.

## 10. Out of Scope

- Document upload (ID scans, signatures).
- Underwriting decision engine (accept/decline/refer based on health answers).
- Policy document generation (PDF).
- Editing beneficiaries/health after submission.
