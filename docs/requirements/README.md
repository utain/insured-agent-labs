# Requirements Specifications — InsureAgentLabs

This directory holds per-feature requirements specifications for **InsureAgentLabs**, a
deterministic QA-automation training app modeled on a Thailand life-insurance agent
portal. Each spec documents the feature's data model, API contract, business rules,
UI/test hooks, and acceptance criteria as currently implemented, so it can serve both
as a reference for trainees writing tests and as a baseline for future changes.

See [`../ROADMAP.md`](../ROADMAP.md) for build status and planned future work.

## Feature specs

| # | Spec | Backend module | Frontend routes |
|---|---|---|---|
| 01 | [Authentication & Sessions](01-auth.md) | `backend/src/auth` | `/login`, `/logout` |
| 02 | [Product & Rider Catalog](02-catalog.md) | `backend/src/catalog` | `/(app)/catalog` |
| 03 | [Lead Management](03-leads.md) | `backend/src/leads` | `/(app)/leads`, `/(app)/leads/new`, `/(app)/leads/[id]` |
| 04 | [Quotations](04-quotations.md) | `backend/src/quotations` | `/(app)/quotations/new`, `/(app)/quotations/[id]` |
| 05 | [E-Application & Policy Issuance](05-eapps-policy.md) | `backend/src/eapps` | `/(app)/eapps/[id]`, `/(app)/policies/[id]` |
| 06 | [Payments](06-payments.md) | `backend/src/payments` | `/(app)/eapps/[id]/payment` |
| 07 | [Dashboard & Transaction History](07-dashboard-transactions.md) | `backend/src/transactions` | `/(app)` |
| 08 | [Admin & QA Tooling](08-admin-qa-tooling.md) | `backend/src/admin` | (API-only) |
| 09 | [Internationalization (en/th)](09-i18n-localization.md) | — | all routes (`/en`, `/th`) |
| 10 | [Scenario Flags & Test Data](10-scenarios-test-data.md) | `backend/src/seed.rs`, cross-cutting | all routes |

## Shared conventions

### Error envelope

Every non-2xx API response uses the same JSON shape (`backend/src/error.rs`):

```json
{
  "error": {
    "code": "validation",
    "message": "Validation failed",
    "fields": [{ "field": "national_id", "message": "Invalid Thai national ID" }]
  }
}
```

| `code` | HTTP status | Meaning |
|---|---|---|
| `unauthorized` | 401 | Missing/invalid session |
| `forbidden` | 403 | Authenticated but not allowed (e.g. non-admin calling admin route) |
| `not_found` | 404 | Resource does not exist or isn't owned by the caller |
| `validation` | 422 | One or more field errors (see `fields[]`) |
| `conflict` | 409 | Valid request, but the entity is not in a state that allows it |
| `locked` | 423 | Account scenario flag is `locked` |
| `server_error` | 500 | Unexpected error, or the `agent.error` scenario |

### Ownership model

All Leads, Quotations, E-Applications, Payments (via their E-App), and Transactions
are scoped to the authenticated agent (`agent_id`). Cross-agent access always returns
`404 not_found` (never `403`), so trainees cannot use error codes to enumerate other
agents' data.

### Authentication

All `/api/**` routes except `/api/auth/login` require a valid session, supplied as
either:
- `Authorization: Bearer <token>`, or
- `session=<token>` HttpOnly cookie (set by `/api/auth/login`, forwarded by the
  SvelteKit server proxy).

### data-testid convention

Every interactive element, container, and status/error message has a unique
`data-testid` following `<area>-<element>-<qualifier?>`. See
[`../TESTIDS.md`](../TESTIDS.md) for the full catalog.
