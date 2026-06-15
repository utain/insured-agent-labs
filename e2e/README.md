# InsureAgentLabs — Blackbox E2E & API Test Suite

A standalone [Playwright](https://playwright.dev) project that tests a **running**
InsureAgentLabs app from the outside (blackbox). The app is a single SvelteKit
service, so the UI and the JSON API share one origin (`BASE_URL`).

| Project | Level | Targets | Files |
|---|---|---|---|
| `api` | Integration | JSON API under `/api` **directly** | `api/*.api.spec.ts` |
| `ui` | End-to-end | The app via a real browser | `ui/*.e2e.spec.ts` |

The `api` project exercises the REST contract; the `ui` project drives real user
journeys. UI tests that need deterministic state reset via the same `api` fixture.

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

## Determinism

The store is **in-memory** with a global `POST /api/admin/reset`. The suite runs
**single-worker, non-parallel** (`workers: 1`). Specs that depend on exact state
reset to seed in a `beforeEach`.

## Layout

```
e2e/
├── playwright.config.ts     # two projects: api, ui (same BASE_URL)
├── global-setup.ts          # waits for /api/healthz + resets to seed
├── fixtures/
│   ├── env.ts               # BASE_URL / API_BASE_URL / WEB_BASE_URL / DEMO_PASSWORD
│   ├── data.ts              # seeded users, product codes, lead/insured builders
│   ├── api.ts               # `api` + `standardToken` fixtures, `json()`, `createIllustration`
│   └── pages.ts             # `api` test extended with one Page Object per screen
├── pages/                   # Page Object Model (UI specs)
└── api/  ·  ui/             # *.api.spec.ts  ·  *.e2e.spec.ts
```

### Helpers

- **`standardToken` fixture** — declare `{ api, standardToken }` for an authenticated
  `agent.standard`, no login boilerplate.
- **`json(res, status, label?)`** — asserts status and returns the parsed body, with a
  located failure message.
- **`createIllustration(api, token, {...})`** — drives insured → plan + coverage →
  Sales Illustration and returns the ids.
- **`resetState(api)`** — resets to seed and returns a fresh standard token.

UI journeys follow the Page Object Model (`pages/`), delivered as Playwright fixtures
(`fixtures/pages.ts`) — a spec names what it needs and Playwright builds it.

> This `e2e/` project is the single blackbox suite (API + UI). The web app keeps only
> Vitest unit/service tests (`web/ pnpm test`).
