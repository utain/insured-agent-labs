# InsureAgentLabs — Blackbox E2E & API Test Suite

A standalone [Playwright](https://playwright.dev) project that tests a **running**
InsureAgentLabs app from the outside (blackbox). The app is a single SvelteKit
service, so the UI and the JSON API share one origin (`BASE_URL`).

| Project | Level | Targets | Files |
|---|---|---|---|
| `api` | Integration | JSON API under `/api` **directly** | `tests/api/*.api.spec.ts` |
| `ui` | End-to-end | The app via a real browser | `tests/ui/*.e2e.spec.ts` |

The `api` project exercises the REST contract; the `ui` project drives real user
journeys. Both share an **object layer** so specs read as domain language — an
**API Object Model** (`clients/`) symmetric with the **Page Object Model**
(`pages/`). See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the conventions and the
"add a resource / add a spec" recipes.

## Prerequisites

The suite does **not** start the app — bring it up first (see the repo root
[`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)):

```bash
# from the repo root:
make up      # docker compose → http://localhost:5173
# or native:
make dev     # pnpm dev → http://localhost:5173
```

## Run

```bash
cd e2e
cp .env.example .env          # optional; defaults target localhost:5173
pnpm install
pnpm install:browsers         # one-time: Playwright Chromium

pnpm test                     # full suite (api + ui)
pnpm test:api                 # integration (API) only
pnpm test:ui                  # e2e (UI) only
pnpm report                   # open the last HTML report
```

Or from the repo root: `make e2e`, `make e2e-api`, `make e2e-ui`, `make stack-e2e`.

## Pointing at another environment

```bash
BASE_URL=https://staging.example.com pnpm test
```

`global-setup.ts` waits for `${BASE_URL}/api/healthz`, resets to the seed, and fails
fast with guidance if the app isn't up.

## Determinism & scale

The store is **in-memory** with a global `POST /api/admin/reset`, so the suite runs
**single-worker, non-parallel** (`workers: 1`). Specs that assert exact state reset
to seed first. Scale-out is by **CI sharding** — each shard is a separate runner
with its own app stack (state is never shared), emitting a `blob` report that a
downstream job merges into one HTML report. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

```bash
pnpm test:smoke                   # @smoke-tagged happy paths (api + ui)
pnpm test:regression              # everything else
pnpm typecheck                    # tsc --noEmit (types flow from Zod via z.infer)
PW_SHARD=1 pnpm test --shard=1/4  # one shard → blob-report/ (PW_SHARD switches on the blob reporter)
pnpm merge-reports                # merge ./blob-report into one HTML report
```

> The blob reporter clears `blob-report/` on every run, so each shard's blob lives on
> its own runner in CI and is uploaded as a separate artifact; the `e2e-report` job
> collects them into one folder before merging. To merge multiple shards **locally**,
> copy each run's `blob-report/*.zip` into a shared folder first, then
> `playwright merge-reports --reporter html <folder>`.

## Layout

```
e2e/
├── playwright.config.ts     # two projects: api, ui (same BASE_URL); blob report when sharded
├── global-setup.ts          # waits for /api/healthz + resets to seed
├── schemas/                 # Zod response schemas + inferred types (the API contract)
├── clients/                 # API Object Model: HttpClient → resource clients → AgentApi facade
├── fixtures/
│   ├── env.ts               # BASE_URL / API_BASE_URL / WEB_BASE_URL / DEMO_PASSWORD
│   ├── data.ts              # seeded users, product/rider codes, seed counts, builders
│   ├── api.ts               # agent / anon / loginAs / resetState fixtures
│   └── pages.ts             # mergeTests(api, pageObjects): UI specs get both
├── pages/                   # Page Object Model (UI specs)
└── tests/
    ├── api/                 # *.api.spec.ts — uses the AgentApi facade
    └── ui/                  # *.e2e.spec.ts — uses Page Objects (+ API fixtures to seed)
```

### Fixtures

- **`agent`** — a client authenticated as `agent.standard`, minted per test:
  `await agent.quotations.create({ insured })`.
- **`anon`** — an unauthenticated client for login, health, reset, and 401 paths.
- **`loginAs(user)`** — mint any other seeded role: `const bug = await loginAs(USERS.bug)`.
- **`resetState()`** — reset the store to seed and return a fresh standard client; use
  it (not `agent`) where you assert exact store state, since reset re-seeds sessions.
- **`agent.flows.createIllustration({...})`** — insured → coverage → Sales Illustration.
- **`expectError(call)`** — re-type a `{ expect: 4xx }` call as the error envelope to
  read `.error.code` / `.error.fields`.

Every response is validated against a Zod schema, so contract drift fails loudly. The
object layer (`clients/` for API, `pages/` for UI) is delivered as Playwright
fixtures — a spec names what it needs and Playwright builds it.

> This `e2e/` project is the single blackbox suite (API + UI). The web app keeps only
> Vitest unit/service tests (`web/ pnpm test`).
