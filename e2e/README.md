# InsureAgentLabs — Blackbox E2E & API Test Suite

A standalone [Playwright](https://playwright.dev) project that tests a **running**
InsureAgentLabs stack from the outside (blackbox). It has two layers:

| Project | Level | Targets | Files |
|---|---|---|---|
| `api` | Integration | Rust backend REST API **directly** (`API_BASE_URL`, default `:3000`) | `api/*.api.spec.ts` |
| `ui` | End-to-end | SvelteKit web app via a real browser (`WEB_BASE_URL`, default `:5173`) | `ui/*.e2e.spec.ts` |

Why two layers: the browser never calls `/api/*` (SvelteKit proxies to the backend
server-side), so the public API surface is the Rust service on `:3000` — which the
project intentionally exposes for API-QA. The `api` project exercises that contract;
the `ui` project exercises real user journeys through the browser. UI tests that need
deterministic state reset the backend directly through the same `api` fixture.

## Prerequisites

The suite does **not** start the app — bring a stack up first (see the repo root
[`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)):

```bash
# from the repo root — any one of:
make up                       # docker compose (web :5173, backend :3000)
# or run natively in two terminals:
make dev-backend              # :3000
make dev-web                  # :5173
```

## Run

```bash
cd e2e
cp .env.example .env          # optional; defaults target localhost
pnpm install
pnpm install:browsers         # one-time: Playwright Chromium

pnpm test                     # full suite (api + ui)
pnpm test:api                 # integration (API) only
pnpm test:ui                  # e2e (UI) only
pnpm report                   # open the last HTML report
```

Or from the repo root via the Makefile: `make e2e`, `make e2e-api`, `make e2e-ui`,
or `make stack-e2e` (compose up → run → down).

## Pointing at another environment

Everything is driven by env vars (auto-loaded from `e2e/.env`):

```bash
API_BASE_URL=https://staging-api.example.com \
WEB_BASE_URL=https://staging.example.com \
pnpm test
```

`global-setup.ts` waits for `${API_BASE_URL}/api/health` and `${WEB_BASE_URL}/login`
before any test runs, and fails fast with guidance if the stack isn't up.

## Determinism

The backend uses a single shared **in-memory** store and a **global**
`POST /api/admin/reset`. The suite therefore runs **single-worker, non-parallel**
(`workers: 1`, `fullyParallel: false`). Specs that depend on exact counts reset to
seed state in a `beforeAll`/`beforeEach`; data-creating specs mint unique,
checksum-valid Thai IDs (`fixtures/data.ts`) so they don't collide.

## Layout

```
e2e/
├── playwright.config.ts     # two projects: api, ui
├── global-setup.ts          # waits for backend + web health
├── fixtures/
│   ├── env.ts               # API_BASE_URL / WEB_BASE_URL / DEMO_PASSWORD
│   ├── data.ts              # seeded users, product codes, Thai-ID helpers
│   └── api.ts               # `api` request fixture + login/reset/journey helpers
├── api/                     # *.api.spec.ts — integration (REST contract)
└── ui/                      # *.e2e.spec.ts — end-to-end (browser journeys)
```

Each spec links the requirements doc it verifies (see
[`../docs/requirements/`](../docs/requirements/README.md)).

> Relationship to `web/tests/*.e2e.ts`: those are the in-repo smoke tests wired to
> the SvelteKit build. This `e2e/` project is the dedicated, environment-agnostic
> blackbox suite covering both API and UI; prefer it for integration/e2e coverage.
