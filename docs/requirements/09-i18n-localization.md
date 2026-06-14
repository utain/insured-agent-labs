# 09 — Internationalization (English / Thai)

**Status:** ✅ Implemented (Phase 6)
**Frontend:** `web/messages/{en,th}.json`, `web/project.inlang/`, Paraglide-generated
`web/src/lib/paraglide/`
**Cross-cutting:** applies to every route under `/(app)` plus `/login`.

## 1. Overview

The entire UI is bilingual (English / Thai) via [Paraglide
JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), with
URL-prefixed locales (`/en/...`, `/th/...`). Translations live in
`web/messages/en.json` and `web/messages/th.json` as flat dot-path keys; backend
domain data (catalog names/descriptions, transaction titles/summaries) carries
parallel `_en`/`_th` fields that the frontend selects based on the active locale.

## 2. Actors

- **Agent** — switches language via `lang-select` in the header; the choice
  persists via the URL locale prefix (and the user's `locale` field for default).

## 3. Configuration

`web/project.inlang/settings.json`:

| Setting | Value |
|---|---|
| `baseLocale` | `en` |
| `locales` | `["en", "th"]` |
| message source | `./messages/{locale}.json` (flat key → string map) |

## 4. Message Namespaces

(`web/messages/en.json` / `th.json` — both files must stay key-for-key identical)

| Namespace | Covers |
|---|---|
| `app.*` | App title, tagline |
| `nav.*` | Header navigation (dashboard, leads, catalog, language switch, logout, welcome) |
| `login.*` | Login form labels, placeholders, validation & auth errors, session-expired notice |
| `common.*` | Shared buttons/labels: cancel, save, loading, back, yes, no, currency symbol (`฿`/`common.baht`) |
| `dashboard.*` | Title, welcome, empty/no-results states, filters, table columns, action labels, count |
| `status.*` | Status badges: `draft`, `quoted`, `created`, `paid`, `submitted`, `policy`, `new`, `payment_declined`, `payment_pending` |
| `kind.*` | Transaction kind labels: `quotation`, `eapp`, `payment`, `policy`, `lead` |
| `leads.*` | Lead form field labels/placeholders, validation errors, detail-page actions |
| `catalog.*` | Product/rider section labels, rider-type filter options, age/sum-assured range labels |
| `quotation.*` | Wizard steps 1–5, calc labels (`base_premium`, `total_premium`, `modal_premium`), finalize/valid-until, error states |
| `eapp.*` | Beneficiary fields/actions, health-declaration Q&A, save/submit, submitted confirmation |
| `payment.*` | Method options, amount, simulate action, success/declined/pending labels and statuses |
| `policy.*` | Policy summary field labels |

## 5. Functional Requirements

- **FR-9.1**: Every route under `/(app)` and `/login` shall be reachable under both
  the `/en/...` and `/th/...` URL prefixes and render fully-localized content for
  each.
- **FR-9.2**: `en.json` and `th.json` shall contain the **same set of keys** — no
  key may exist in one and not the other (would otherwise fall back to
  `baseLocale` silently).
- **FR-9.3**: Backend-sourced bilingual content (catalog `name_en`/`name_th`,
  `description_en`/`description_th`; transaction `title_en`/`title_th`,
  `summary_en`/`summary_th`) shall be selected by the frontend based on the active
  Paraglide locale — the backend always returns both.
- **FR-9.4**: The language switcher (`lang-select`, with `lang-option-en` /
  `lang-option-th`) shall change the active locale without losing the current
  page's state (e.g. wizard step, filter selections).
- **FR-9.5**: Currency values shall be formatted with the `฿` symbol
  (`common.currency`) consistently across catalog, quotation, payment, and policy
  views.

## 6. Business Rules & Validation

- A user's `locale` field (`en`/`th` on the `User` record) seeds the initial
  locale on login but does not lock the user out of switching languages
  mid-session.
- No locale-specific business logic exists (e.g. no different validation rules per
  locale) — `national_id`/`phone` formats are Thailand-specific regardless of
  display language.

## 7. UI Requirements

- `app-header` always renders `lang-select` with both options visible.
- All `data-testid`s are language-independent (see `docs/TESTIDS.md`) so Playwright
  locators do not need to branch on locale — only the **text content** of the
  element changes.
- `role="alert"` / `role="status"` elements (errors, confirmations) must be
  translated identically in both locales for accessibility-tree-based assertions
  that check the role rather than the text.

## 8. Scenario Hooks (QA Training)

- Locale switching is orthogonal to scenario flags — every `agent.*` scenario user
  is fully bilingual. A useful combined test: run a scenario assertion (e.g.
  `agent.locked` → `423`) under `/th/login` to confirm error messages localize
  correctly even on error paths.

## 9. Acceptance Criteria

- [ ] Visiting `/th` shows the dashboard fully in Thai (nav, table headers, status
      badges, empty states).
- [ ] Visiting `/en/leads/new` and `/th/leads/new` shows the same field set with
      English vs. Thai labels and placeholders.
- [ ] A validation error (e.g. invalid national ID) renders in the active locale
      without a page reload.
- [ ] Catalog product names/descriptions switch between `name_en`/`description_en`
      and `name_th`/`description_th` when toggling the language switcher.
- [ ] No raw message key (e.g. `"leads.error.invalid.national_id"`) is ever
      rendered as visible text — every key resolves in both locales.

## 10. Out of Scope

- Locales beyond English/Thai.
- Right-to-left (RTL) layout support.
- Locale-aware number/date formatting libraries (dates are not currently
  locale-formatted beyond the raw ISO value in most views).
- Per-agent persisted locale preference across sessions (beyond the seed
  `User.locale` default).
