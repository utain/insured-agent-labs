# 08 — Admin & QA Tooling

**Status:** ✅ Implemented (Phase 7)
**Backend:** `backend/src/admin/mod.rs`

## 1. Overview

A small set of endpoints that exist purely to support test automation: resetting
the in-memory database to its seeded state between test runs, inspecting current
data-collection sizes for assertions, listing demo users, and seeding additional
fixture data on demand. These endpoints are **not** part of the agent-facing
product UI — they are consumed directly by test suites / CI via Swagger or curl.

## 2. Actors

- **QA / test automation** — calls these endpoints directly (Swagger UI, curl,
  Playwright `request` fixture).
- **`agent.standard`** — the one demo user permitted to call these endpoints from
  within an authenticated session (see §3 guard).

## 3. Access Control

`require_admin(user, secret, expected_secret)` (`backend/src/admin/mod.rs`):

- **Allowed** if the supplied `secret` equals the configured `ADMIN_SECRET`
  (`state.config.admin_secret`, from environment), **or**
- **Allowed** if the authenticated session belongs to username `agent.standard`.
- **Otherwise**: `403 forbidden`.

> ⚠️ **Implementation gap (current code):** every handler calls
> `require_admin(&user, None, ...)` — it passes `None` for the secret, so the
> `ADMIN_SECRET` branch is **never reached**. In practice the **only** way to pass
> the guard today is an authenticated `agent.standard` session. The secret-header
> path exists in the helper but is not yet wired into the handlers (no header is
> extracted). This is reflected in the tests
> (`e2e/api/admin.api.spec.ts`) and in [`../DEPLOYMENT.md`](../DEPLOYMENT.md).
>
> Consequently, every other scenario user (`agent.locked`, `agent.glitch`,
> `agent.bug`, `agent.error`) is **forbidden** (`403`) from these endpoints — so a
> scenario-user session cannot reset/inspect global state mid-test. Wiring up the
> `x-admin-secret` header is tracked as future work in the
> [ROADMAP](../ROADMAP.md).

## 4. API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/reset` | Reset the entire in-memory DB to seed state; **clears all sessions** |
| `GET` | `/api/admin/debug-state` | Return collection counts + current user + scenario flag |
| `GET` | `/api/admin/users` | List all demo users (passwords redacted) |
| `GET` | `/api/admin/users/{username}` | Get one demo user (password redacted) |
| `POST` | `/api/admin/seed-extra` | Seed an additional `new`-status lead for the caller |

### `POST /api/admin/reset`

- Re-runs the full seed routine (`state.reseed_async()`), replacing
  users/leads/quotations/eapps/payments/transactions and catalog data with the
  fresh seed snapshot.
- **Clears the session map** — any session token (including the one used to call
  this endpoint, if not re-authenticated via `ADMIN_SECRET`) becomes invalid.
- Returns `204 No Content`.

### `GET /api/admin/debug-state`

Response (`DebugState`):
```json
{
  "users": 5, "leads": 3, "quotations": 0, "eapps": 0, "payments": 0,
  "transactions": 3, "catalog_products": 4, "catalog_riders": 27,
  "sessions": 1, "current_user": "agent.standard", "scenario": "standard"
}
```

### `GET /api/admin/users` / `GET /api/admin/users/{username}`

- Returns `User` objects with `password` set to `""` (never the real value).
- `404 not_found` for an unknown `username`.

### `POST /api/admin/seed-extra`

Request (`SeedExtraLeadRequest`):
```json
{ "full_name": "...", "national_id": "...", "phone": "...", "email": "...", "tag": null }
```
- Validates `national_id` (Thai checksum) and `phone` (10 digits, starts with `0`)
  — `422 validation` on failure.
- Creates a `Lead` owned by the caller with `status = new`, `dob = 1990-01-01`,
  `gender = male`, `occupation = "QA Seeded"`, `income = 0.0`.
- Also pushes a `lead` transaction (`status: "new"`) so the new lead is visible on
  the dashboard.
- `tag` is accepted but currently unused (reserved for future scenario tagging).

## 5. Functional Requirements

- **FR-8.1**: All admin endpoints shall require an `agent.standard` session; all
  other callers receive `403 forbidden`. (Design intent also allows an
  `ADMIN_SECRET` header, but that path is not yet wired into the handlers — see
  §3.)
- **FR-8.2**: `POST /api/admin/reset` shall restore the database to a byte-for-byte
  reproduction of the initial seed and invalidate all existing sessions.
- **FR-8.3**: `GET /api/admin/debug-state` shall reflect live collection sizes at
  call time, suitable for `expect(count).toBe(n)`-style assertions.
- **FR-8.4**: `GET /api/admin/users` and `GET /api/admin/users/{username}` shall
  never include plaintext passwords in the response.
- **FR-8.5**: `POST /api/admin/seed-extra` shall apply the same national-ID and
  phone validation as the regular lead-creation endpoint ([03](03-leads.md)).

## 6. Business Rules & Validation

- There is no separate "admin role" enforcement based on `Role::Admin` — access is
  purely the secret-or-`agent.standard` check above, regardless of the `role`
  field on the `User` record.
- `reset` is global (affects all users' data), not per-agent — test suites that run
  in parallel against a shared backend instance must serialize calls to `reset`.

## 7. UI Requirements

- None — these endpoints have no dedicated frontend UI. They are documented in
  Swagger UI (`/api-docs`) under the `Admin` tag for direct use by QA.

## 8. Scenario Hooks (QA Training)

- This **is** the scenario-control surface: `debug-state.scenario` reports which
  scenario flag the current session's user carries, letting a test assert "I am
  logged in as the `bug` scenario" before exercising scenario-specific
  expectations. See [10](10-scenarios-test-data.md) for the full scenario catalog.

## 9. Acceptance Criteria

- [ ] `POST /api/admin/reset` as an `agent.standard` session returns `204` and a
      subsequent `GET /api/admin/debug-state` shows seed-baseline counts
      (`users: 5`, `catalog_products: 4`).
- [ ] Calling any `/api/admin/*` endpoint as `agent.bug` returns `403 forbidden`.
- [ ] `GET /api/admin/users` never contains a non-empty `password` field.
- [ ] `POST /api/admin/seed-extra` with an invalid national ID returns `422` and
      creates no lead.
- [ ] `POST /api/admin/seed-extra` with valid data increments
      `debug-state.leads` by 1 and `debug-state.transactions` by 1.
- [ ] After `POST /api/admin/reset`, a previously-valid session token returns
      `401` on `GET /api/auth/me`.

## 10. Out of Scope

- Per-agent (non-global) reset/seed.
- Admin UI / dashboard for managing users or scenario flags.
- Audit logging of admin actions.
- Rate limiting on admin endpoints.
