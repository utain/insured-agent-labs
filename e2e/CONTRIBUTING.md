# Contributing to the test suite — conventions

This suite is built to **scale to a large team** and to be **copy-pasteable as a
template**. Two ideas carry everything:

1. **Specs speak the domain, never the transport.** A test says
   `agent.quotations.illustrate(id)` or `wizardPage.startFresh(insured)` — never a
   raw URL, header, `fetch`, or CSS selector. All transport detail lives in the
   object layer.
2. **One mental model for both layers.** The UI uses a Page Object Model; the API
   uses a symmetric **API Object Model**. Learn one, you know the other.

| Concern | UI layer | API layer |
|---|---|---|
| Base primitive | `pages/base.page.ts` (`BasePage` holds `page`) | `clients/base.client.ts` (`HttpClient` holds the token) |
| One object per… | screen → `pages/login.page.ts` | resource → `clients/quotations.client.ts` |
| Barrel | `pages/index.ts` | `clients/index.ts` |
| Composition | `fixtures/pages.ts` (a fixture per Page Object) | `clients/agent.ts` (`AgentApi` composes resources) |
| Delivered to specs as | `loginPage`, `wizardPage`, … fixtures | `agent`, `anon`, `loginAs` fixtures |

> **Why a facade on the API side but not the UI side?** API resources share one
> identity (a bearer token), so `AgentApi` groups them per logged-in agent. On the
> UI side Playwright's `page` already *is* the shared context, so individual Page
> Object fixtures are the idiomatic composition — no extra facade needed.

## Layers, top to bottom

```
schemas/   Zod schemas + inferred types — the response contract (mirrors web/src/lib/schemas.ts)
clients/   HttpClient → resource clients → AgentApi facade → flows (multi-step journeys)
fixtures/  data (builders + constants), api (agent/anon/loginAs/resetState), pages (UI + API merged)
tests/     api/*.api.spec.ts and ui/*.e2e.spec.ts — domain language only
```

### `schemas/` — the contract is validated, not assumed
Every response is parsed by a Zod schema in `HttpClient`. A drifted field fails the
test with a precise `Response contract mismatch: …` message. Schemas mirror the
app's domain types in `web/src/lib/schemas.ts`, so they double as living API docs
and the **single source of truth for response types** (via `z.infer`). No `any`.

## Recipes

### Add a new resource client
1. Add/extend a schema in `schemas/<name>.schema.ts` and export it from `schemas/index.ts`.
2. Create `clients/<name>.client.ts`:
   ```ts
   import { BaseResource } from './base.client';
   import { Thing } from '../schemas';

   export class ThingsApi extends BaseResource {
     list(opts: { expect?: number } = {}) {
       return this.http.get('/api/things', { schema: Thing.array(), expect: opts.expect });
     }
     create(data: Partial<ThingInput>, opts: { expect?: number } = {}) {
       return this.http.post('/api/things', { data, schema: Thing, expect: opts.expect });
     }
   }
   ```
3. Wire it into `AgentApi` (`clients/agent.ts`) as `readonly things` and export from `clients/index.ts`.

### Add a spec
- Import `{ test, expect }` (and `expectError` if you read an error body) from `../../fixtures/api` (API) or `../../fixtures/pages` (UI).
- Pick fixtures by need: `agent` (logged-in standard), `anon` (no auth), `loginAs('agent.bug')` (other roles), `resetState()` (reset + fresh agent — use when you assert exact store state).
- Tag the happy-path cross-section `@smoke`; everything else is regression by default.

### Conventions
- **Status & body in one call.** `agent.x.y(args, { expect })` asserts the status internally. Omit `expect` for the 2xx happy path.
- **Negative bodies** read via `expectError(...)`: `const body = await expectError(agent.leads.create({}, { expect: 422 }))`.
- **Coverage is camelCase** at the spec boundary (`{ product, sumAssured, term }`); the client maps to the API's snake_case.
- **No magic values.** Users/products/riders/seed-counts live in `fixtures/data.ts`.

## Tags & selective runs
| Tag | Meaning | Run |
|---|---|---|
| `@smoke` | Fast, high-value happy paths across API + UI | `pnpm test:smoke` |
| _(untagged)_ | Full regression | `pnpm test:regression` / `pnpm test` |

## Determinism & scale
The app store is **in-memory** with a global `POST /api/admin/reset`, so the suite
runs **single-worker** (`workers: 1`). Scale-out is by **CI sharding**: each shard
is a separate runner with **its own app stack**, so shards never share state. Shards
emit `blob` reports that a downstream job merges into one HTML report
(`pnpm merge-reports`). See `.github/workflows/ci.yml`.
