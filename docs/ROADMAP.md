# Roadmap — InsureAgentLabs

InsureAgentLabs is a deterministic QA-automation training app: a realistic (but
fully reproducible) Thailand life-insurance agent portal that QA engineers use to
practice functional, API, and accessibility-based test automation. This roadmap
tracks the build that shipped Phases 0–8, and proposes future phases that extend
its training value without compromising determinism or the realism of the domain.

Per-feature requirements specs live in [`requirements/`](requirements/README.md)
and are the source of truth for *current* behavior; this document is forward- and
status-looking.

---

## Current status: Phases 0–8 (✅ shipped)

| Phase | Description | Spec |
|---|---|---|
| 0 | Scaffolding & contracts | — |
| 1 | Auth slice | [01 — Authentication & Sessions](requirements/01-auth.md) |
| 2 | Catalog & Leads | [02 — Catalog](requirements/02-catalog.md), [03 — Leads](requirements/03-leads.md) |
| 3 | Quotation | [04 — Quotations](requirements/04-quotations.md) |
| 4 | E-App & Payment | [05 — E-Application & Policy](requirements/05-eapps-policy.md), [06 — Payments](requirements/06-payments.md) |
| 5 | Dashboard | [07 — Dashboard & Transaction History](requirements/07-dashboard-transactions.md) |
| 6 | i18n + scenario polish | [09 — i18n](requirements/09-i18n-localization.md), [10 — Scenarios](requirements/10-scenarios-test-data.md) |
| 7 | Admin & QA tooling | [08 — Admin & QA Tooling](requirements/08-admin-qa-tooling.md) |
| 8 | Fixtures & trainee docs | [`TEST-USERS.md`](TEST-USERS.md), [`TESTIDS.md`](TESTIDS.md) |

### Architecture (current)

| Layer | Technology |
|---|---|
| Backend | Rust 2024 · axum 0.8 · utoipa + Swagger UI (`/api-docs`) |
| Frontend | SvelteKit 5 (runes) · Tailwind CSS v4 · Paraglide (en/th) |
| Persistence | In-memory, seeded; `POST /api/admin/reset` restores seed |
| Testing | Playwright (e2e) · Vitest (unit/browser) · Swagger (API) |

---

## Phase 8.5 — Fix bugs surfaced by the blackbox suite (do first)

Building the deployment workflow and the [blackbox e2e/API suite](../e2e/README.md)
surfaced three concrete defects (full write-ups in [`FINDINGS.md`](FINDINGS.md)).
Each is encoded in the suite as a "current behavior" guard + a `test.fixme` for the
intended behavior, so fixing it flips the suite.

1. **New-lead form unusable (High).** `pattern="[0-9]{13}"` in
   `leads/new/+page.svelte` is parsed by Svelte as `{13}` interpolation, rendering
   `pattern="[0-9]13"` — HTML5 validation then rejects every valid national ID and
   blocks submission. One-line fix (`pattern={'[0-9]{13}'}`).
2. **`kind`/`status` query filters 400 (Medium).** `GET /api/transactions` and
   `GET /api/quotations` use axum's default `Query` (serde_urlencoded), which can't
   deserialize `Vec`. Switch to `axum_extra::extract::Query`.
3. **adapter-node `ORIGIN` (Medium, fixed in configs).** Already set in
   `docker-compose.yml` / `deploy/k8s` so form POSTs aren't CSRF-403'd; keep it in
   mind for any new deployment target.

Also wire up the deployment + test workflow in CI (see Phase 13).

## Proposed future phases

These are **not yet started**. Each is scoped to preserve the project's core
property — every endpoint, scenario, and dataset must remain deterministic and
reproducible via `POST /api/admin/reset`.

### Phase 9 — Close the scenario-documentation gap (near-term, recommended next)

**Goal**: Make `docs/TEST-USERS.md` and `docs/TESTIDS.md` fully accurate by
implementing the scenario behaviors they already describe but the code does not
yet have (see [10 — Scenario Flags](requirements/10-scenarios-test-data.md) §5).

**Rationale**: Trainees currently read docs that promise behaviors (dead button,
broken image, dashboard delay/500) that don't fire — this teaches the wrong lesson
about trusting documentation vs. verifying behavior, and blocks writing the
corresponding `web/tests/scenarios/*.e2e.ts` suites referenced in
`TESTIDS.md`.

**Key deliverables**:
- `agent.glitch`: add the documented delay to dashboard load (`GET
  /api/transactions`) and `POST /api/eapps/{id}/submit`.
- `agent.bug`: add a frontend branch (keyed off `user.scenario_flag`) that renders
  a disabled/dead "Save" button on one quotation-wizard step, and an
  intentionally-broken `<img>` `src` somewhere in the e-app flow — each with its
  own stable `data-testid`.
- `agent.error`: add a `scenario_flag == error` branch to dashboard
  load (`GET /api/transactions`) returning `500 server_error`.
- Add the four `web/tests/scenarios/*.e2e.ts` files already referenced in
  `TESTIDS.md`.

**Depends on**: nothing — purely additive to existing modules.

---

### Phase 10 — Expanded scenario library

**Goal**: Broaden the deterministic failure-mode catalog beyond locked/glitch/bug/
error so trainees can practice against a wider range of real-world API behaviors.

**Rationale**: The current four scenarios cover auth-lock, latency, data-mismatch,
and 5xx. Real QA work also needs: rate limiting, optimistic-locking conflicts,
pagination edge cases, and partial-failure (multi-field validation) practice.

**Candidate additions**:
- `429 too_many_requests` on a configurable endpoint for a 6th scenario user
  (e.g. `agent.ratelimit`).
- Optimistic-concurrency `409 conflict` when two `PUT`s race on the same
  quotation/e-app (currently last-write-wins).
- A seeded agent with >100 transactions to exercise
  [07](requirements/07-dashboard-transactions.md) pagination boundaries
  (`page_size` clamping, last-page partial results).
- A "slow network" scenario applied to `/api/catalog/*` (currently has no
  scenario hooks at all).

**Depends on**: Phase 9 (establishes the pattern for adding new
`scenario_flag`-gated branches).

---

### Phase 11 — Policy lifecycle extensions

**Goal**: Make the `expired` `QuotationStatus` (defined but unused — see
[04](requirements/04-quotations.md) §6) meaningful, and add basic policy
post-issuance actions.

**Candidate additions**:
- Time-based or admin-triggerable transition of `quoted` quotations past
  `valid_until` into `expired`, blocking e-app creation with `409 conflict`.
- Policy cancellation (`/(app)/policies/[id]` → cancel action), producing a new
  transaction status.
- Re-quote flow: clone an `expired` quotation back into a fresh `draft`.

**Depends on**: none directly, but should reuse the transaction-update pattern
from [07](requirements/07-dashboard-transactions.md) §3.

---

### Phase 12 — Claims module (new feature area)

**Goal**: Add a minimal "file a claim against an issued policy" flow as a new,
self-contained feature area — giving trainees a second multi-step form/workflow
distinct from the quotation wizard.

**Candidate scope**:
- `backend/src/claims/` — `Claim` entity (policy reference, claim type, amount,
  status: `submitted → reviewing → approved/declined`).
- New dashboard transaction kind usage (`TransactionKind::Policy` is already
  defined but unused — could be repurposed or a `Claim` kind added).
- A new requirements spec (`11-claims.md`) following the existing template.

**Depends on**: Phase 11 (claims are filed against issued policies).

---

### Phase 13 — CI pipeline & regression baseline

**Status**: 🟡 Core CI shipped — [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
runs three jobs on every push/PR:
- **backend** — `cargo clippy --all-targets -- -D warnings` + `cargo test`
- **web** — `pnpm check` + `pnpm lint` + `pnpm test:unit --run` + `pnpm build`
- **e2e** — builds the images, `docker compose up`, runs the full blackbox
  suite (API + UI) against the stack, uploads the Playwright report artifact.

**Remaining**:
- `axe-core` accessibility audit integrated into the Playwright suite for the
  routes in [09 — i18n](requirements/09-i18n-localization.md) (both locales).
- Playwright visual-regression snapshots for the dashboard and quotation wizard.
- Optional: a CI job that fails the build on the open [`FINDINGS.md`](FINDINGS.md)
  defects once they're fixed (flip the `test.fixme` guards to required).

**Depends on**: none — purely tooling.

---

### Phase 14 — Role-based access & manager view (exploratory)

**Goal**: Exercise the currently-unused `Role::Admin` value with a real
manager/admin persona who can see **all agents'** leads/quotations/transactions
(read-only), distinct from the secret-gated tooling in
[08](requirements/08-admin-qa-tooling.md).

**Rationale**: Every current endpoint scopes data to `agent_id == caller`
([README §Ownership model](requirements/README.md)). A manager role would
introduce a second, intentional authorization dimension for trainees to test
(`403` vs `404` distinctions, cross-agent visibility rules).

**Depends on**: none, but is a larger structural change — should be scoped as its
own design discussion before implementation.

---

### Phase 15 — Persistent storage backend (exploratory)

**Goal**: Swap the in-memory `Db` (`backend/src/db.rs`) for a SQLite-backed store
behind the same internal interface, so `POST /api/admin/reset` re-seeds a real
database instead of an in-memory map.

**Rationale**: Lets trainees practice "does my test leave the system in a clean
state" against a persistence layer that survives process restarts — closer to
production systems than the current pure in-memory model.

**Constraints**: Must preserve `POST /api/admin/reset` semantics exactly (full
reseed, session invalidation) and must not change any API contract documented in
[`requirements/`](requirements/README.md).

**Depends on**: none, but is high-effort relative to training-value gained —
lowest priority unless a specific training need (e.g. "test data persistence")
is identified.

---

## Out of scope (by design, indefinitely)

- Real payment gateway integration, real SMS/email delivery, or any external
  network dependency — the app must remain runnable fully offline/deterministically.
- Non-Thailand insurance domains/regulations.
- Production-grade auth (password hashing, MFA, rate limiting) — the plaintext
  password model is intentional for a training fixture and should not be
  "fixed" without an explicit decision to change the project's premise.
