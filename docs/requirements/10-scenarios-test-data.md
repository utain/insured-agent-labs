# 10 — Scenario Flags & Test Data

**Status:** ⚠️ Partially implemented (Phase 6) — see §5 for gaps vs. documentation
**Backend:** `backend/src/seed.rs` (user fixtures), `ScenarioFlag` in
`backend/src/db.rs`, consumers in `backend/src/auth/routes.rs` and
`backend/src/quotations/routes.rs`
**Docs:** [`../TEST-USERS.md`](../TEST-USERS.md), [`../TESTIDS.md`](../TESTIDS.md)

## 1. Overview

Every seeded user carries a `scenario_flag` that deterministically alters API
behavior, so QA trainees can write assertions against known, reproducible "bad
path" responses (locked accounts, slow endpoints, inflated premiums, server
errors) without needing to fabricate state. All five scenario users share the same
password (`insure_demo`) and the same underlying catalog/seed data — only the
`scenario_flag` differs.

## 2. Seeded Users

(`backend/src/seed.rs`)

| Username | `scenario_flag` | Display name (EN / TH) | Password |
|---|---|---|---|
| `agent.standard` | `standard` | Standard Agent / ตัวแทนมาตรฐาน | `insure_demo` |
| `agent.locked` | `locked` | Locked Agent / ตัวแทนที่ถูกล็อก | `insure_demo` |
| `agent.glitch` | `glitch` | Glitch Agent / ตัวแทนกลิตช์ | `insure_demo` |
| `agent.bug` | `bug` | Buggy Agent / ตัวแทนบั๊ก | `insure_demo` |
| `agent.error` | `error` | Error Agent / ตัวแทนเออเรอร์ | `insure_demo` |

`agent.standard` additionally receives sample seeded transactions (Phase 6 seed)
and is the only non-admin-secret user permitted to call
[admin endpoints](08-admin-qa-tooling.md).

## 3. Implemented Scenario Behaviors

Verified against current source — `grep -rn "ScenarioFlag::" backend/src`:

| Flag | Where enforced | Behavior |
|---|---|---|
| `locked` | `auth/routes.rs` — `POST /api/auth/login` | Returns `423 locked` instead of issuing a session, even with the correct password. |
| `bug` | `quotations/routes.rs` — `PUT /api/quotations/{id}` and `POST /api/quotations/{id}/calculate` | `calc::calculate(..., bug_inflate: true)` multiplies `base_premium` by `1.05` (5% inflation). See [04](04-quotations.md) §6. |
| `glitch` | `quotations/routes.rs` — `POST /api/quotations/{id}/calculate` | Sleeps **exactly 3000ms** (`tokio::time::sleep`) before acquiring the DB lock and computing the response. |
| `error` | `quotations/routes.rs` — `POST /api/quotations/{id}/finalize` | Returns `500 server_error` ("Internal error during finalize") and leaves the quotation in `draft` (no state change). |
| `standard` | (default) | No special-cased behavior anywhere — the happy path. |

## 4. Functional Requirements

- **FR-10.1**: `POST /api/auth/login` shall return `423 locked` for any user with
  `scenario_flag == locked`, regardless of password correctness, and shall not
  create a session.
- **FR-10.2**: `POST /api/quotations/{id}/calculate` and `PUT
  /api/quotations/{id}` shall inflate `base_premium` by exactly 5% for callers with
  `scenario_flag == bug`, relative to the same inputs for `standard`.
- **FR-10.3**: `POST /api/quotations/{id}/calculate` shall add a fixed ~3-second
  delay before responding for callers with `scenario_flag == glitch`.
- **FR-10.4**: `POST /api/quotations/{id}/finalize` shall return `500
  server_error` without mutating the quotation for callers with `scenario_flag ==
  error`.
- **FR-10.5**: `POST /api/admin/reset` shall restore all five scenario users with
  their original `scenario_flag` and password unchanged ([08](08-admin-qa-tooling.md)).

## 5. Gaps: Documented vs. Implemented

`docs/TEST-USERS.md` describes a broader set of scenario behaviors than currently
exist in code. As of this writing:

| Documented behavior (`docs/TEST-USERS.md`) | Status |
|---|---|
| `agent.glitch`: "Artificial 3–5s delays on **dashboard load**, premium calc, **e-app submit**" | Only `/calculate` (3000ms) is implemented. Dashboard load and `/eapps/{id}/submit` have **no delay**. |
| `agent.bug`: "Quotation premium inflated ~5%; **dead "Save" button** on one step; **broken image**" | Only the premium inflation is implemented (backend). No frontend code references `scenario_flag` to disable a button or break an image (`grep -r scenario_flag web/src` returns nothing outside `src/lib/types.ts` and the login hint). |
| `agent.error`: "Finalize quotation → `500 server_error`; **dashboard load may 500**" | Only `/finalize` is implemented. `GET /api/transactions` / dashboard load has no `error`-flag branch. |

These are tracked as future work — see [ROADMAP](../ROADMAP.md) "Close
scenario-documentation gap".

## 6. Business Rules & Validation

- Scenario flags are **per-user**, fixed at seed time — there is no endpoint to
  change a user's `scenario_flag` at runtime (other than via
  `POST /api/admin/reset`, which restores the original assignments).
- Scenario behaviors are **additive to normal validation/business rules** — e.g.
  `agent.bug`'s inflated premium still respects sum-assured/term bounds; it is the
  *output number* that differs, not the validation logic.
- The glitch delay (3000ms) is deliberately kept under typical Playwright default
  timeouts (10s) so tests pass without raising global timeouts, but are long
  enough that **assertions without explicit waits will flake** — this is the
  intended training value.

## 7. UI Requirements

- `/login` displays a hint listing all five usernames
  (`agent.standard / agent.locked / agent.glitch / agent.bug / agent.error`) via
  `login-hint`, so trainees can self-discover the scenario matrix without reading
  docs.
- No other scenario-specific UI exists at present (see §5).

## 8. Acceptance Criteria

- [ ] Logging in as each of the 5 seeded users succeeds (except `agent.locked`,
      which returns `423`).
- [ ] For identical quotation inputs, `agent.bug`'s `/calculate` response
      `base_premium` is `agent.standard`'s `base_premium * 1.05` (±0.01).
- [ ] `agent.glitch`'s `/calculate` call takes ≥ 3000ms and < 10000ms.
- [ ] `agent.error`'s `/finalize` call returns `500` and a subsequent `GET
      /api/quotations/{id}` shows `status: "draft"` (unchanged).
- [ ] `POST /api/admin/reset` followed by re-login as `agent.glitch` reproduces
      the same 3000ms delay (i.e. the flag survives reset).

## 9. Out of Scope (current implementation)

- Configurable/runtime scenario flags (e.g. an admin endpoint to flip a user's
  flag without a full reset).
- Per-request scenario override (e.g. a header that forces glitch/bug/error
  behavior for any user).
- Randomized/non-deterministic failure injection (all current behaviors are 100%
  deterministic by design).
