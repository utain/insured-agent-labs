# Roadmap — InsureAgentLabs

InsureAgentLabs is a deterministic QA-automation training app: a realistic but fully
reproducible life-insurance agent portal where five demo agents trigger fixed
behaviours (including intentional bugs).

## Current state (single SvelteKit app)

Reworked from a Rust-backend + SvelteKit-frontend pair into a **single SvelteKit
application** (UI + `/api` JSON surface + Swagger, in-memory store). Scope trimmed to
the **quotation journey** only.

Shipped:

- Auth with the five scenario agents (standard / locked / glitch / bug / error).
- Catalog (4 life products, 27 riders) and a redesigned product browser.
- Lead / customer management.
- **Package management** — reusable plan + rider bundles.
- Quotation wizard: insured (existing lead or fresh) → base plan or package + riders →
  coverage & live premium → **Sales Illustration** (print-friendly).
- Dashboard activity feed; QA reset.
- OpenAPI + Swagger UI at `/api-docs`; zod-validated API.
- Vitest unit/service tests (premium parity, full flow, scenarios).

## Possible future work

- Per-agent persistence (swap the in-memory store for SQLite) if multi-replica deploys
  are needed.
- Quotation comparison (multiple illustrations side by side).
- Re-introduce e-application / payment / policy issuance as a second MVP.
- Restore bilingual EN/TH if required for localisation training.
