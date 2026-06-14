# Findings — Blackbox Suite & Deployment

Issues surfaced while building the [deployment workflow](DEPLOYMENT.md) and the
[blackbox e2e/API suite](../e2e/README.md), validated against a running stack
(Rust backend + production SvelteKit `node build`). Each is encoded in the test
suite (as a "current behavior" guard plus a `test.fixme` for the intended
behavior) so that fixing it flips the suite and prompts updating the assertion.

| # | Severity | Area | Status |
|---|---|---|---|
| 1 | High | Frontend — new-lead form unusable in browser | Open |
| 2 | Medium | Backend — `kind`/`status` query filters return 400 | Open |
| 3 | Medium | Deployment — adapter-node `ORIGIN` required | Fixed in compose/k8s configs |

---

## 1. New-lead form `national_id` pattern is malformed (HTML5 validation blocks submit)

**Where:** `web/src/routes/(app)/leads/new/+page.svelte` — the national-ID input.

**What:** The template writes `pattern="[0-9]{13}"`. Svelte interprets `{13}` as
an **interpolation expression** (value `13`), so the *rendered* attribute is
`pattern="[0-9]13"`. That regex matches "a single digit followed by the literal
13", so the browser's HTML5 validation rejects **every** real 13-digit Thai
national ID. Native form submission is then silently blocked — **no POST is sent
and the user is stuck on the form** with no visible error.

**Impact:** A real user cannot create a lead through the UI at all. The backend is
fine — `POST /api/leads` and `POST /leads/new` (curl) accept the same data and
return `201`/`302`. This is purely the client-side pattern attribute.

**Repro:** Log in, open *New Lead*, fill a valid ID, click *Save lead* → nothing
happens. In devtools the input is `:invalid` with "Please match the requested
format"; the rendered `pattern` is `[0-9]13`.

**Fix (one line):** escape the braces so they reach HTML literally, e.g.
`pattern={'[0-9]{13}'}` (bind the string) or `pattern="[0-9]{'{'}13{'}'}"`.

**Test:** `e2e/ui/sale-journey.e2e.spec.ts` — guard asserts the broken pattern and
blocked submit; `test.fixme` holds the intended create-lead journey.

---

## 2. `kind` / `status` query-string filters return 400

**Where:** `backend/src/transactions/mod.rs` (`GET /api/transactions`) and
`backend/src/quotations/routes.rs` (`GET /api/quotations`).

**What:** These handlers type the filters as `Option<Vec<_>>` but use axum's
default `Query` extractor, which is backed by `serde_urlencoded` — and
`serde_urlencoded` **cannot deserialize sequences**. So any `?kind=…`,
`?status=…` (on transactions) or `?status=…` (on quotations) yields
`400 Failed to deserialize query string: … expected a sequence`, rather than
filtering.

**Impact:** The documented kind/status filtering doesn't work over HTTP. The
dashboard avoids it by filtering via `search` (a plain `String`), so the UI
appears to work, but the API contract in
[`requirements/07`](requirements/07-dashboard-transactions.md) /
[`04`](requirements/04-quotations.md) is unmet.

**Fix:** switch these handlers to `axum_extra::extract::Query`, which supports
repeated keys → `Vec`.

**Test:** `e2e/api/transactions.api.spec.ts` — guard asserts the current 400;
`test.fixme` holds the intended kind-filter behavior.

---

## 3. adapter-node requires `ORIGIN` for form POSTs (deployment)

**Where:** the production web server (`node build`) in
[`docker-compose.yml`](../docker-compose.yml) and
[`deploy/k8s/web.yaml`](../deploy/k8s/web.yaml).

**What:** SvelteKit's CSRF protection compares a form POST's `Origin` header to
the app's own origin. Under adapter-node, the app only knows its public origin if
the `ORIGIN` env var is set. Without it, **login (and every other form POST) is
rejected with `403 "Cross-site POST form submissions are forbidden"`** — the user
can never log in, even though the backend and credentials are correct. (The Vite
dev server derives its origin automatically, so this only bites the production
build / containers.)

**Status: fixed in the deployment configs.** `ORIGIN` is now set on the web
container in `docker-compose.yml` (`WEB_ORIGIN`, default `http://localhost:5173`),
the `web/Dockerfile` default, and the k8s `web` Deployment (the Ingress host). It
must match the browser-facing URL — see the config table in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

**Test:** every `e2e/ui/*.e2e.spec.ts` login flow exercises this implicitly; they
pass only when `ORIGIN` is correct.
