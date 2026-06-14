# 01 — Authentication & Sessions

**Status:** ✅ Implemented (Phase 1)
**Backend:** `backend/src/auth/` (`mod.rs`, `routes.rs`)
**Frontend:** `web/src/routes/login`, `web/src/routes/logout`, `web/src/lib/server` (proxy)

## 1. Overview

Username/password authentication for insurance agents. Successful login issues an
opaque session token, stored server-side in an in-memory session map and handed to
the browser as an `HttpOnly` cookie. The SvelteKit server forwards this token as a
`Bearer` token to the Rust API — the browser never talks to the API directly for
authenticated calls.

## 2. Actors

- **Agent** — the only role exercised by the UI (`Role::Agent`). `Role::Admin` exists
  in the data model but is not currently used to gate any route (see
  [08 — Admin & QA Tooling](08-admin-qa-tooling.md) for the actual admin guard).

## 3. Data Model

`User` (`backend/src/db.rs`):

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `username` | string | unique, login identifier |
| `password` | string | **plaintext** — training fixture only, never use this pattern in production |
| `display_name_en` / `display_name_th` | string | shown in header |
| `role` | `agent` \| `admin` | |
| `scenario_flag` | `standard` \| `locked` \| `glitch` \| `bug` \| `error` | drives deterministic QA scenarios, see [10](10-scenarios-test-data.md) |
| `locale` | `en` \| `th` | default UI locale for the user |

`UserDto` (returned to clients) omits `password`.

Session store: `HashMap<token: String, user_id: Uuid>`, held in `AppState`, cleared
entirely by `POST /api/admin/reset`.

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | none | Authenticate; sets `session` cookie + returns token |
| `POST` | `/api/auth/logout` | session | Invalidate the current session, clear cookie |
| `GET` | `/api/auth/me` | session | Return the current user (`UserDto`) |

### `POST /api/auth/login`

Request:
```json
{ "username": "agent.standard", "password": "insure_demo" }
```

Response `200`:
```json
{ "token": "<uuid>", "user": { "id": "...", "username": "agent.standard", ... } }
```
Also sets `Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`.

Errors:
- `401 unauthorized` — unknown username or wrong password
- `423 locked` — credentials correct, but `scenario_flag == locked`

### `POST /api/auth/logout`

- Removes every session entry mapping to the caller's `user_id` (not just the
  current token).
- Returns `204 No Content` and clears the cookie (`Max-Age=0`).
- `401 unauthorized` if not authenticated.

### `GET /api/auth/me`

- Returns the caller's `UserDto`. `401 unauthorized` if not authenticated.

## 5. Functional Requirements

- **FR-1.1**: The system shall authenticate users by exact username + plaintext
  password match against the seeded user table.
- **FR-1.2**: On success, the system shall issue a new opaque UUID session token,
  store it in the session map, and set it as an `HttpOnly`, `SameSite=Lax` cookie
  with a 24-hour `Max-Age`.
- **FR-1.3**: If `scenario_flag == locked`, login shall fail with `423 locked` even
  when the password is correct.
- **FR-1.4**: Any request to a protected `/api/**` route without a valid session
  token (cookie or Bearer) shall return `401 unauthorized`.
- **FR-1.5**: Logout shall invalidate **all** sessions belonging to the caller and
  clear the session cookie.
- **FR-1.6**: The frontend shall never expose the API token to client-side
  JavaScript; all `/api/**` calls are proxied through SvelteKit server routes which
  attach the token from the HttpOnly cookie.

## 6. Business Rules & Validation

- Username/password fields are required; empty submission is rejected client-side
  before the request is sent (`login.error.required.username` /
  `login.error.required.password`).
- No password complexity, lockout-after-N-attempts, or rate limiting is implemented
  — this is a deterministic training fixture, not a security-hardened login.
- Session expiry is time-based only (`Max-Age=86400`); there is no idle-timeout or
  refresh mechanism.

## 7. UI Requirements

- `/login` — renders the login form (`login-username-input`,
  `login-password-input`, `login-submit-button`); on failure shows
  `login-error-alert` (`role="alert" aria-live="assertive"`) with either the
  "invalid credentials" or "account locked" message.
- `/logout` — a route (not a page) that calls `POST /api/auth/logout` and redirects
  to `/login`.
- Any page load that receives `401` from the proxy redirects to `/login` with a
  `login.session_expired` notice.
- Header (`app-header` / `app-nav`) shows `header-user-name` and
  `header-logout-button` once authenticated.

## 8. Scenario Hooks (QA Training)

| Test user | Behavior |
|---|---|
| `agent.standard` | Happy path login |
| `agent.locked` | `423 locked` on login — UI shows `login-error-alert` |

See [10 — Scenario Flags & Test Data](10-scenarios-test-data.md) for the full list.

## 9. Acceptance Criteria

- [ ] Logging in with `agent.standard` / `insure_demo` redirects to the dashboard.
- [ ] Logging in with `agent.locked` / `insure_demo` shows the locked error and
      does not set a session.
- [ ] Logging in with a wrong password shows the invalid-credentials error.
- [ ] Submitting the form with empty fields shows inline required-field errors and
      makes no network request.
- [ ] After `POST /api/auth/logout`, `GET /api/auth/me` returns `401`.
- [ ] Visiting any `/(app)/**` route while unauthenticated redirects to `/login`.

## 10. Out of Scope

- Password reset / change-password flows.
- Multi-factor authentication.
- Role-based authorization beyond the single admin guard described in
  [08](08-admin-qa-tooling.md).
- Refresh tokens / session renewal.
