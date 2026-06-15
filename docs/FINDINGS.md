# Findings — Intentional Defects (for QA trainees)

InsureAgentLabs deliberately ships reproducible defects keyed to the logged-in agent.
A trainee's job is to detect and document them. Expected findings:

| Agent | Finding | Surfaced at |
|---|---|---|
| `agent.locked` | Cannot log in — server returns **423**, no session created | login |
| `agent.glitch` | Premium calculation is slow (~3–5s) but returns a correct value | quotation → Calculate premium |
| `agent.bug` | Base premium is ~5% higher than the standard agent for identical inputs | premium summary |
| `agent.bug` | **Confirm & create illustration** button does nothing when clicked | quotation wizard |
| `agent.bug` | Illustration preview image is broken (404) | quotation wizard |
| `agent.error` | Creating the Sales Illustration fails with **500**; no SI is produced | quotation → Confirm |

All other behaviour matches `agent.standard` (the baseline). Reset state between runs
with `POST /api/admin/reset`. See [`TEST-USERS.md`](TEST-USERS.md) for how to reproduce
each one.
