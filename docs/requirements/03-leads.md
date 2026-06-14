# 03 — Lead Management

**Status:** ✅ Implemented (Phase 2)
**Backend:** `backend/src/leads/` (`mod.rs`, `routes.rs`, `dto.rs`, `validation.rs`)
**Frontend:** `web/src/routes/(app)/leads`, `.../leads/new`, `.../leads/[id]`

## 1. Overview

Leads represent prospective insureds an agent is tracking. A lead is the entry point
into the sales flow: creating a quotation from a lead transitions it from `new` to
`quoted`. Leads carry the personal/demographic data (Thai national ID, DOB, contact
info, income) needed for premium calculation and underwriting later in the flow.

## 2. Actors

- **Agent** — full CRUD over their own leads (subject to status restrictions below).

## 3. Data Model

`Lead` (`backend/src/db.rs`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | server-generated | |
| `agent_id` | UUID | server-set | owner — always the authenticated agent |
| `full_name` | string | yes | non-empty after trim |
| `national_id` | string | yes | 13 digits, valid Thai checksum |
| `dob` | date | yes | implies age 18–80 |
| `gender` | `male` \| `female` \| `other` | yes | |
| `phone` | string | yes | 10 digits, starts with `0` |
| `email` | string? | no | must contain `@` if present |
| `occupation` | string? | no | |
| `income` | f64? | no | must be ≥ 0 if present |
| `status` | `new` \| `contacted` \| `quoted` | server-managed | see §6 |
| `created_at` / `updated_at` | datetime | server-managed | |

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/leads` | session | List the agent's leads |
| `POST` | `/api/leads` | session | Create a lead (status starts at `new`) |
| `GET` | `/api/leads/{id}` | session | Get one lead (agent-owned only) |
| `PUT` | `/api/leads/{id}` | session | Update a lead — **only while `status == new`** |
| `DELETE` | `/api/leads/{id}` | session | Delete a lead — **only while `status == new`** |

`POST`/`PUT` bodies are `CreateLeadRequest` / `UpdateLeadRequest`
(`backend/src/leads/dto.rs`); `PUT` fields are all optional (partial update), and
`email`/`occupation`/`income` use `Option<Option<T>>` so a client can explicitly
clear them by sending `null`.

## 5. Functional Requirements

- **FR-3.1**: The system shall create a lead with `status = new`,
  `agent_id = <caller>`, and server-assigned `id`/timestamps.
- **FR-3.2**: `GET /api/leads` and `GET /api/leads/{id}` shall only return leads
  owned by the caller; a lead owned by another agent returns `404 not_found`.
- **FR-3.3**: `PUT /api/leads/{id}` shall reject the request with
  `409 conflict` if `status != new`.
- **FR-3.4**: `DELETE /api/leads/{id}` shall reject the request with
  `409 conflict` if `status != new`.
- **FR-3.5**: Creating a quotation from a lead (see [04](04-quotations.md)) shall
  transition the lead's status from `new` to `quoted`, which thereafter locks the
  lead from edit/delete.
- **FR-3.6**: All field validation errors shall be returned together as
  `422 validation` with one `FieldError` per invalid field (not fail-fast on the
  first error).

## 6. Business Rules & Validation

(`backend/src/leads/validation.rs`)

| Field | Rule |
|---|---|
| `full_name` | required, non-empty after trim |
| `national_id` | exactly 13 digits with a valid Thai national-ID checksum digit |
| `dob` | computed age must be between **18 and 80 inclusive** |
| `phone` | exactly 10 digits, first digit `0` |
| `email` | if present and non-empty, must contain `@` |
| `income` | if present, must be `>= 0` |

For `PUT` (partial update), only the fields present in the request body are
validated; omitted fields keep their stored values and are not re-validated.

**Status lifecycle**: `new → quoted` (one-way, triggered by quotation creation).
`contacted` exists in the enum but is not currently set by any endpoint — reserved
for future CRM-style workflows.

## 7. UI Requirements

- `/(app)/leads` — list of the agent's leads (`leads.title`), with a "New Lead"
  CTA (`leads.new`) and an empty state (`leads.empty`).
- `/(app)/leads/new` — creation form with fields for full name, national ID, DOB,
  gender, phone, email, occupation, income (`leads.<field>.label` /
  `.placeholder`); inline errors map 1:1 to backend `FieldError.field` via
  `leads.error.*` message keys.
- `/(app)/leads/[id]` — detail view (`leads.detail.title`); edit form is only
  enabled while `status == new`; provides `leads.detail.start_quotation` CTA which
  routes into the quotation wizard ([04](04-quotations.md)) with this lead
  pre-selected.

## 8. Scenario Hooks (QA Training)

- `POST /api/admin/seed-extra` (see [08](08-admin-qa-tooling.md)) seeds an
  additional `new`-status lead for the current agent, useful for test setup that
  needs a fresh lead without going through the UI form.
- No scenario-flag-specific behavior (delays/bugs/errors) is implemented for leads
  themselves.

## 9. Acceptance Criteria

- [ ] Creating a lead with a valid Thai national ID and age 18–80 returns `201`
      with `status: "new"`.
- [ ] Creating a lead with an invalid national-ID checksum, underage/overage DOB,
      and a malformed phone in one request returns `422` with **3** field errors.
- [ ] `GET /api/leads/{id}` for another agent's lead returns `404`.
- [ ] After creating a quotation from a lead, `PUT`/`DELETE` on that lead return
      `409 conflict`.
- [ ] The leads list and detail pages render correctly in both `/en` and `/th`.

## 10. Out of Scope

- Lead assignment/reassignment between agents.
- `contacted` status workflow / activity log / notes.
- Bulk import or CSV export of leads.
- Soft-delete / audit trail for deleted leads.
