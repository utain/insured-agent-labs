# Test Users — InsureAgentLabs

All passwords: `insure_demo`. State resets via `POST /api/admin/reset`.

Each agent triggers one deterministic behaviour so QA scenarios are reproducible.

| Username | Flag | Behaviour | Where it surfaces |
|---|---|---|---|
| `agent.standard` | `standard` | Happy path — everything works | baseline for all suites |
| `agent.locked` | `locked` | Login is rejected | `POST /api/auth/login` → **423 Locked** (no token issued) |
| `agent.glitch` | `glitch` | Slow premium calculation | `POST /api/quotations/{id}/calculate` sleeps ~3.5s before responding |
| `agent.bug` | `bug` | Premium defect + broken UI | base premium ×1.05 in calc; **Confirm** button is dead (no-op); illustration thumbnail is a broken image |
| `agent.error` | `error` | Illustration generation fails | `POST /api/quotations/{id}/illustrate` → **500** (no SI created) |

## How to exercise each

1. **standard** — log in, create/select a lead, pick a plan or package, set coverage, calculate, confirm → a Sales Illustration is produced.
2. **locked** — attempt login; assert 423 and that no session is established.
3. **glitch** — build a quotation and click **Calculate premium**; assert the response/spinner takes >3s. Compare the premium value with `agent.standard` (it should match — only timing differs).
4. **bug** — for identical inputs, assert the base premium is ~5% higher than `agent.standard`; assert the **Confirm & create illustration** button does nothing when clicked; assert the preview image fails to load.
5. **error** — build a complete quotation and confirm; assert the illustrate call returns 500 and the user stays on the wizard with an error message.

## Notes

- The premium formula is identical for all users; only `agent.bug` inflates the base. See `web/src/lib/server/domain/premium.ts` and its `premium.spec.ts`.
- Scenario hooks live in the service layer: `services/auth.ts` (locked), `services/quotations.ts` (glitch delay, bug inflation), `services/illustrations.ts` (error 500). The bug UI effects are in `routes/(app)/quotations/[id]/+page.svelte`.
