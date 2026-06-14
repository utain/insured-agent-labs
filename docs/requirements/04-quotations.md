# 04 — Quotations

**Status:** ✅ Implemented (Phase 3)
**Backend:** `backend/src/quotations/` (`mod.rs`, `routes.rs`, `dto.rs`, `calc.rs`)
**Frontend:** `web/src/routes/(app)/quotations/new`, `.../quotations/[id]`,
`.../quotations/[id]/eapp`

## 1. Overview

A quotation captures the insured's chosen product, sum assured, term, payment
frequency ("modal"), and optional riders, and computes a premium. Quotations are
created in `draft` status from a lead, can be edited and recalculated while in
`draft`, and are then `finalize`d into `quoted` (with a 30-day validity window)
before an e-application can be created from them.

## 2. Actors

- **Agent** — creates, edits, calculates, and finalizes their own quotations.

## 3. Data Model

`Quotation` (`backend/src/db.rs`):

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `lead_id` | UUID | source lead |
| `agent_id` | UUID | owner |
| `base_product_code` | string | FK into catalog products |
| `insured_name` | string | copied from lead at creation time |
| `insured_age` | int | computed at creation time from lead DOB |
| `sum_assured` | u64 (THB) | defaults to product `min_sum_assured` |
| `term` | int (years) | defaults to product's first `term_options` entry |
| `modal` | `annual` \| `semi` \| `quarterly` \| `monthly` | defaults to `annual` |
| `riders` | `RiderSelection[]` | `{ code, sum_assured }` |
| `calc` | `QuotationCalc?` | set by `PUT` (recompute) or previewed by `/calculate` |
| `status` | `draft` \| `quoted` \| `eapp` \| `paid` \| `submitted` \| `expired` | see §6 |
| `valid_until` | datetime? | set to `now + 30 days` on finalize |
| `created_at` / `updated_at` | datetime | |

`QuotationCalc`:

| Field | Type |
|---|---|
| `base_premium` | f64 |
| `rider_premiums` | `{ code, premium }[]` |
| `total_annual_premium` | f64 (base + sum of riders) |
| `modal_premium` | f64 (`total_annual_premium * modal_factor`) |

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/quotations?status=...` | session | List agent's quotations, optional repeatable `status` filter |
| `POST` | `/api/quotations` | session | Create a `draft` quotation from `{ lead_id, base_product_code }` |
| `GET` | `/api/quotations/{id}` | session | Get one quotation |
| `PUT` | `/api/quotations/{id}` | session | Update sum_assured/term/modal/riders; recomputes `calc` — **only in `draft`** |
| `POST` | `/api/quotations/{id}/calculate` | session | Preview-only premium calc (does not persist) |
| `POST` | `/api/quotations/{id}/finalize` | session | `draft` → `quoted`, sets `valid_until = now + 30d` |

### `POST /api/quotations`

- Looks up the lead (must be owned by caller, else `404`) and the product (else
  `404`).
- `insured_age` is computed as `today.year() - lead.dob.year()` (calendar-year
  difference, not exact age — see note in §6).
- Initializes `sum_assured = product.min_sum_assured`, `term =
  product.term_options[0]`, `modal = annual`, `riders = []`, `calc = null`.
- Sets the source lead's status to `quoted` (FR-3.5).
- Creates a `quotation` transaction with status `draft` (see
  [07](07-dashboard-transactions.md)).

### `PUT /api/quotations/{id}`

- `409 conflict` if `status != draft`.
- Applies any provided fields (`sum_assured`, `term`, `modal`, `riders`) onto the
  current quotation.
- Re-validates the **resulting** quotation against the product's bounds and each
  rider's eligibility (§6); on failure returns `422 validation` with **all**
  violations, and **does not persist** the change.
- On success, recomputes `calc` via `calc::calculate(...)` (using the caller's
  `bug` scenario flag, see [10](10-scenarios-test-data.md)) and persists.

### `POST /api/quotations/{id}/calculate`

- Read-only preview: recomputes `calc` from the quotation's **currently stored**
  fields and returns it, without writing to the quotation.
- If the caller's `scenario_flag == glitch`, sleeps **3000ms** before acquiring the
  DB lock (artificial latency for QA wait-strategy training).

### `POST /api/quotations/{id}/finalize`

- `409 conflict` if `status != draft`.
- If `scenario_flag == error`, returns `500 server_error` ("Internal error during
  finalize") **without changing state** — for QA error-handling training.
- On success: `status = quoted`, `valid_until = now + 30 days`; the linked
  dashboard transaction's status is updated to `quoted`.

## 5. Functional Requirements

- **FR-4.1**: Creating a quotation shall require an owned lead and a valid product
  code; either missing returns `404 not_found`.
- **FR-4.2**: A quotation shall only be mutable (`PUT`) while `status == draft`;
  any other status returns `409 conflict`.
- **FR-4.3**: `PUT` shall validate `sum_assured` against
  `[product.min_sum_assured, product.max_sum_assured]`, `term` against
  `product.term_options`, and each rider against
  `[rider.min_age, rider.max_age]` for the quotation's `insured_age`.
- **FR-4.4**: `POST /{id}/calculate` shall be idempotent and side-effect-free
  (preview only).
- **FR-4.5**: `POST /{id}/finalize` shall transition `draft → quoted` exactly once,
  setting `valid_until` to 30 days from finalize time.
- **FR-4.6**: The system shall recompute `calc` server-side on every `PUT` and
  `/calculate` call — the client never supplies premium numbers.

## 6. Business Rules & Premium Calculation

(`backend/src/quotations/calc.rs`)

**Status lifecycle** (forward-only):
`draft → quoted → eapp → paid → submitted`
(`expired` exists in the enum but no endpoint currently sets it — reserved for a
future "quote validity expiry" feature, see [ROADMAP](../ROADMAP.md)).

**Premium formula**:

1. `base_rate = interpolate(product.rate_per_thousand, insured_age)` — linear
   interpolation between age bands; ages below the first band use the first rate,
   ages above the last band use the last rate.
2. `term_factor`:
   - Whole life (`term >= 99`) → `0.95` (discount).
   - Otherwise → `1.0 + (term - 10) * 0.0075` (10y = 1.0, 30y ≈ 1.15).
   - `LIFE_ENDOW` additionally multiplies by `0.8` (savings-heavy curve).
3. `base_premium = (sum_assured / 1000) * base_rate * term_factor`
4. **Bug scenario**: if `scenario_flag == bug`, `base_premium *= 1.05` (5%
   inflation) — see [10](10-scenarios-test-data.md).
5. For each selected rider: `rate per thousand * (rider.sum_assured / 1000)`, or
   the rider's `flat_premium` if it has one (Waiver of Premium riders).
6. `total_annual_premium = base_premium + sum(rider_premiums)`
7. `modal_premium = total_annual_premium * modal_factor`, where
   `modal_factor`: `annual = 1.0`, `semi = 0.52`, `quarterly = 0.27`,
   `monthly = 0.09`.
8. All monetary outputs are rounded to 2 decimal places.

> **Known simplification**: `insured_age` is computed as a calendar-year
> difference (`today.year() - dob.year()`), not an exact birthday-aware age. This
> is intentional for deterministic, reproducible quotation math in training
> exercises.

## 7. UI Requirements

- `/(app)/quotations/new` — 5-step wizard (`quotation.wizard.step.1`–`5`):
  1. Select lead (`quotation.step1.select_lead`, with a "create lead" escape
     hatch if none exist).
  2. Select base product (`quotation.step2.select_product`).
  3. Select riders (`quotation.step3.select_riders`, with per-rider sum-assured
     input).
  4. Set sum assured / term / modal, with a "Recalculate" action
     (`quotation.step4.recalc`) showing `base_premium`, `total_premium`, and
     `modal_premium`; shows `quotation.step4.calculating` while the
     `/calculate` preview is in flight.
  5. Save as draft or finalize (`quotation.step5.save_draft`,
     `quotation.step5.finalize`), showing `valid_until` once finalized.
- `/(app)/quotations/[id]` — detail/edit view; editable only while `draft`; shows
  `quotation.view.total_premium` and a CTA to create an e-app
  (`quotation.view.create_eapp`) once `quoted`.
- `/(app)/quotations/[id]/eapp` — transitional route that calls
  `POST /api/eapps` and redirects to the new e-app.
- Server errors during finalize render `quotation.error.server` via
  `quotation-step5-error-alert`.

## 8. Scenario Hooks (QA Training)

| Scenario user | Effect on this feature |
|---|---|
| `agent.glitch` | `/calculate` sleeps 3s before responding — trainees write explicit waits / loading-state assertions. |
| `agent.bug` | `base_premium` is inflated ~5%; UI vs. API premium values diverge — trainees compare displayed vs. returned values to spot the defect. |
| `agent.error` | `/finalize` returns `500 server_error`; quotation stays in `draft` — trainees assert error-toast/alert and unchanged state. |

## 9. Acceptance Criteria

- [ ] `POST /api/quotations` from a `new` lead returns `201` with `status:
      "draft"` and sets the lead's status to `quoted`.
- [ ] `PUT` with a `sum_assured` outside the product's bounds returns `422` and
      does not modify the stored quotation.
- [ ] `PUT` with a valid rider selection recomputes `calc` and persists it.
- [ ] `POST /{id}/calculate` returns a `QuotationCalc` without changing
      `updated_at`.
- [ ] `POST /{id}/finalize` on a `draft` quotation sets `status: "quoted"` and
      `valid_until` ≈ now + 30 days; calling it again returns `409`.
- [ ] As `agent.glitch`, `/calculate` takes ≥3s.
- [ ] As `agent.bug`, the API `base_premium` is ~5% higher than the equivalent
      `agent.standard` calculation for identical inputs.
- [ ] As `agent.error`, `/finalize` returns `500` and the quotation remains
      `draft`.

## 10. Out of Scope

- Quote expiry enforcement (the `expired` status is defined but never set).
- Multi-life / joint quotations.
- Quote comparison (side-by-side multiple products).
- Re-quoting after a lead's data changes post-finalization.
