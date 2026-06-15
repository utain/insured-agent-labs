# Requirements Specifications — InsureAgentLabs

Per-feature specs for **InsureAgentLabs**, a deterministic QA-automation training app
modeled on a Thailand life-insurance agent portal. This MVP covers the **quotation
journey only** (e-application, payment, and policy issuance are out of scope).

> **Note:** the app is now a single **SvelteKit** application — UI and JSON API in one
> process, in-memory store, no separate backend. Some specs below still describe domain
> rules in their original framing; the authoritative implementation is under
> `web/src/lib/server/` (services + domain) and `web/src/routes/api/`.

See [`../ROADMAP.md`](../ROADMAP.md) for status.

## Feature specs

| # | Spec | Implementation |
|---|---|---|
| 01 | [Authentication & Sessions](01-auth.md) | `services/auth.ts`, `/api/auth/*`, `/login` |
| 02 | [Product & Rider Catalog](02-catalog.md) | `services/catalog.ts`, `/api/catalog/*`, `/(app)/catalog` |
| 03 | [Lead Management](03-leads.md) | `services/leads.ts`, `/api/leads`, `/(app)/leads/**` |
| 04 | [Quotations & Sales Illustration](04-quotations.md) | `services/quotations.ts` + `services/illustrations.ts`, `/api/quotations/**`, `/(app)/quotations/**`, `/(app)/illustrations/[id]` |
| 07 | [Dashboard & Activity](07-dashboard-transactions.md) | `services/transactions.ts`, `/api/transactions`, `/(app)` |
| 08 | [Admin & QA Tooling](08-admin-qa-tooling.md) | `/api/admin/reset`, `/api/admin/debug-state` |
| 10 | [Scenario Flags & Test Data](10-scenarios-test-data.md) | `seed.ts`, cross-cutting |

New in this MVP (no standalone spec yet): **Package management** — agents bundle a base
plan + riders + default coverage as a reusable "game plan" (`services/packages.ts`,
`/api/packages`, `/(app)/packages/**`).

## Shared conventions

### Error envelope

```json
{
  "error": {
    "code": "validation",
    "message": "Validation failed",
    "fields": [{ "field": "sum_assured", "message": "..." }]
  }
}
```

| `code` | HTTP | Meaning |
|---|---|---|
| `invalid_credentials` | 401 | Wrong username/password |
| `unauthorized` | 401 | Missing/invalid session |
| `forbidden` | 403 | Authenticated but not allowed |
| `not_found` | 404 | Resource missing or not owned by the caller |
| `validation` | 422 | Field errors (see `fields[]`) |
| `conflict` | 409 | Entity not in a state that allows the action |
| `locked` | 423 | Account scenario flag is `locked` |
| `server_error` | 500 | Unexpected error, or the `agent.error` scenario |

### Ownership

Leads, packages, quotations, illustrations, and transactions are scoped to the
authenticated agent (`agent_id`); global package templates are visible to all. Cross-
agent access returns `404` (never `403`).

### Authentication

All `/api/**` routes except `/api/auth/login` and `/api/admin/*` require a valid
session via `Authorization: Bearer <token>` or the `session` HttpOnly cookie.
