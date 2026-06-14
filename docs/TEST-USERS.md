# Test Users — InsureAgentLabs

All passwords: `insure_demo`

| Username | Scenario flag | Behavior |
|---|---|---|
| `agent.standard` | standard | Happy path — all features work normally. |
| `agent.locked` | locked | Login returns `423 locked`. Cannot reach the app. |
| `agent.glitch` | glitch | Artificial 3–5s delays on dashboard load, premium calc, e-app submit. |
| `agent.bug` | bug | Quotation premium inflated ~5%; dead "Save" button on one step; broken image. |
| `agent.error` | error | Finalize quotation → `500 server_error`; dashboard load may 500. |

## How the flags manifest

- **locked** — `POST /api/auth/login` checks `scenario_flag == locked` and returns `423` with `{"error":{"code":"locked", ...}}`. The UI renders `login-error-alert` with the locked message.
- **glitch** — backend handlers inject `tokio::time::sleep` before responding. Cap is 3–5s so default Playwright timeouts (10s) still pass; trainees learn explicit waits.
- **bug** — backend returns inflated premium; frontend renders a dead button + broken image. Trainees compare UI vs API to spot the defect.
- **error** — backend returns `500` on specific operations. UI shows the error toast / inline alert.

## Which tests cover each user

- `web/tests/auth/login.e2e.ts` — locked alert
- `web/tests/scenarios/locked.e2e.ts` — full locked-user assertion (Phase 6)
- `web/tests/scenarios/glitch.e2e.ts` — delay assertions (Phase 6)
- `web/tests/scenarios/bug.e2e.ts` — premium mismatch + dead button (Phase 6)
- `web/tests/scenarios/error.e2e.ts` — 500 handling (Phase 6)
