# 07 — Dashboard & Transaction History

**Status:** ✅ Implemented (Phase 5)
**Backend:** `backend/src/transactions/mod.rs`, `make_transaction()` in
`backend/src/db.rs`
**Frontend:** `web/src/routes/(app)/+page.svelte` (home / `/(app)`)

## 1. Overview

A unified, paginated, filterable activity feed of everything an agent has done:
leads created, quotations drafted/finalized, e-apps created/submitted, and payment
outcomes. Each domain action ([03](03-leads.md)–[06](06-payments.md)) pushes or
updates a `Transaction` row; the dashboard is the read surface over this log and the
agent's primary landing page after login.

## 2. Actors

- **Agent** — views their own transaction history.

## 3. Data Model

`Transaction` (`backend/src/db.rs`):

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `agent_id` | UUID | owner |
| `kind` | `lead` \| `quotation` \| `eapp` \| `payment` \| `policy` | (`payment`/`policy` are defined in the enum but transactions are currently only created with `kind ∈ {lead, quotation, eapp}` — see §6) |
| `reference_id` | UUID | id of the underlying Lead/Quotation/E-App |
| `title_en` / `title_th` | string | e.g. "Draft Quotation" / "ใบเสนอราคาฉบับร่าง" |
| `summary_en` / `summary_th` | string | e.g. "`<insured name>` — `<product code>`" |
| `status` | string (free-form) | one of: `new`, `draft`, `quoted`, `created`, `paid`, `submitted`, `payment_declined`, `payment_pending` |
| `created_at` / `updated_at` | datetime | sorted desc by `updated_at` for display |

### Status transitions written by other features

| Event | Transaction `kind` | `status` written |
|---|---|---|
| Lead created (incl. `admin/seed-extra`) | `lead` | `new` |
| Quotation created | `quotation` | `draft` |
| Quotation finalized | `quotation` | `quoted` |
| E-app created | `eapp` | `created` |
| Payment success | `eapp` | `paid` |
| Payment declined | `eapp` | `payment_declined` |
| Payment pending | `eapp` | `payment_pending` |
| E-app submitted | `eapp` | `submitted` (+ summary updated with policy number) |

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/transactions?kind=...&status=...&search=...&page=...&page_size=...` | session | Paginated, filtered transaction list |

### Query parameters

| Param | Type | Notes |
|---|---|---|
| `kind` | repeatable enum | filter to one or more `TransactionKind` |
| `status` | repeatable string | exact-match against `status` |
| `search` | string | case-insensitive substring match against `title_en`, `title_th`, `summary_en`, `summary_th`, or `reference_id` (as string) |
| `page` | u32 | 1-based; defaults to `1`; clamped to `max(1, page)` |
| `page_size` | u32 | defaults to `20`; clamped to `[1, 100]` |

Response (`TransactionPage`):
```json
{ "items": [Transaction, ...], "total": 42, "page": 1, "page_size": 20 }
```
Items are sorted by `updated_at` descending before pagination is applied.

## 5. Functional Requirements

- **FR-7.1**: The system shall return only transactions where `agent_id` matches
  the caller.
- **FR-7.2**: `kind` and `status` filters, when provided, shall be combined with
  AND; multiple values for the same filter shall be combined with OR (e.g.
  `kind=quotation&kind=eapp` returns both).
- **FR-7.3**: `search` shall match case-insensitively against both locales' title
  and summary fields, and against the reference UUID as a string.
- **FR-7.4**: Results shall be sorted by `updated_at` descending before
  pagination.
- **FR-7.5**: `page_size` shall be clamped to `[1, 100]` and `page` to `>= 1`,
  regardless of client input.
- **FR-7.6**: `total` shall reflect the count **after** filtering but **before**
  pagination, for client-side page-count calculation.

## 6. Business Rules & Validation

- Transactions are append/update-only — there is no delete endpoint; a single
  logical entity (e.g. one e-app) is represented by **one** transaction row whose
  `status`/`summary` is mutated in place as it progresses (not a new row per
  event).
- `kind: payment` and `kind: policy` are defined in `TransactionKind` for forward
  compatibility/schema completeness but are not emitted by any current handler —
  payment and policy events are reflected by updating the existing `eapp`
  transaction's `status`/`summary` (see table in §3).
- No transaction is created for `PUT` edits to leads/quotations/e-apps — only the
  lifecycle-defining events listed above.

## 7. UI Requirements

- `/(app)` (dashboard home):
  - `dashboard-page-title` welcome heading (`dashboard.welcome`).
  - Primary CTAs: `dashboard-new-quotation`, `dashboard-new-lead`.
  - `dashboard-filter-form` with `dashboard-filter-search` (free text),
    kind/status selects (`dashboard.filter.kind`/`.status`), `Apply`
    (`dashboard-filter-apply`) and `Clear` (`dashboard-filter-clear`).
  - `dashboard-table` of `dashboard-row` entries, each with `data-kind` /
    `data-status` attributes plus `dashboard-row-kind`, `-title`, `-summary`,
    `-status`, `-action` (Continue/View link routing to the relevant
    quotation/e-app/policy page).
  - `dashboard-empty` + `dashboard-empty-cta` when the agent has no
    transactions at all.
  - `dashboard-no-results` when filters produce zero matches (distinct from the
    true-empty state).
  - `dashboard-count` shows the total result count.
- Status badges localize via `status.*` message keys (`status.draft`,
  `status.quoted`, `status.created`, `status.paid`, `status.submitted`,
  `status.new`, `status.payment_declined`, `status.payment_pending`,
  `status.policy`); kind labels via `kind.*`.

## 8. Scenario Hooks (QA Training)

| Scenario user | Effect on this feature |
|---|---|
| `agent.glitch` | Dashboard load has an artificial 3–5s delay (per `docs/TEST-USERS.md`) — trainees test loading skeletons/spinners and explicit waits. |
| `agent.error` | Dashboard load **may** return `500` (per `docs/TEST-USERS.md`) — trainees test page-level error states. |

## 9. Acceptance Criteria

- [ ] After creating a lead, a quotation, an e-app, and submitting it, the
      dashboard shows entries reflecting each lifecycle stage (not 4+ separate
      rows for the same quotation/e-app).
- [ ] `?kind=lead&kind=quotation` returns only those two kinds.
- [ ] `?status=submitted` returns only fully-submitted e-app transactions.
- [ ] `?search=<part of insured name>` matches regardless of case and locale.
- [ ] `?page=2&page_size=5` returns items 6–10 (by `updated_at` desc) and
      `total` equal to the unpaginated filtered count.
- [ ] An agent with zero transactions sees `dashboard-empty`; an agent with
      transactions but a filter matching none sees `dashboard-no-results`.
- [ ] As `agent.glitch`, the dashboard visibly delays before rendering the table.

## 10. Out of Scope

- Real-time updates (WebSocket/SSE) — the dashboard is request/response only.
- Per-row delete/archive.
- Export (CSV/PDF) of transaction history.
- Cross-agent / team-wide dashboards (see [ROADMAP](../ROADMAP.md) for a possible
  future manager role).
