# Frontend Functional Requirements — InsureAgentLabs

> **Purpose of this document.** A complete, **functional** specification of the web frontend so it can be re-designed (new layout, styling, components, interaction patterns) **without changing what the app does**. It deliberately says nothing about visual design, spacing, colours, or copywriting. Every page entry lists: what data it shows, what the user can do, what states exist, what rules apply, and where it navigates.
>
> **Redesign contract.** A redesign MAY change everything visual. It MUST preserve: the routes, the data shown, the available actions, the validation/business rules, the navigation transitions, the five scenario behaviours, and the `data-testid` hooks (the automated test suite keys off them). Treat the listed test IDs as a functional API.

---

## 1. System Overview

InsureAgentLabs is an **insurance agent portal** (SvelteKit). An agent signs in, manages **leads/customers**, builds **quotations** through a 3-step wizard, generates a printable **sales illustration**, and manages reusable **packages**. A read-only **catalog** lists products and riders. All data is in-memory and seeded; a **Reset** action restores the baseline.

The app is also a **QA training sandbox**: five demo agents each trigger a different scripted behaviour (happy path + four fault scenarios). Reproducing these behaviours faithfully is a hard requirement.

**Tech context (for the redesign):** server-rendered routes with SvelteKit `load` functions + form `actions`; the quotation build screen additionally calls JSON APIs from the client. Currency is **Thai Baht (THB)**, displayed with no decimals (e.g. `฿1,260`). Dates display as day-month-year.

---

## 2. Cross-Cutting Requirements

### 2.1 Authentication & session
- Session is a cookie named `session`. API requests may instead send `Authorization: Bearer <token>`.
- **Route guard:** any non-public page without a valid session redirects to `/login?redirectTo=<original path>`. After login the user returns to `redirectTo` (default `/`).
- A logged-in user visiting `/login` is redirected to `/`.
- **Public (no auth) routes:** `/login`, `/api-docs`. API routes return JSON errors instead of redirecting.
- **Sign out:** `POST /logout` clears the session and returns to `/login`.

### 2.2 Demo agents & scenario behaviours
Five seeded agents, all password `insure_demo`. Each carries a `scenario_flag` that changes runtime behaviour:

| Username | Flag | Required behaviour |
|---|---|---|
| `agent.standard` | `standard` | Happy path, no faults. |
| `agent.locked` | `locked` | Login is **rejected** with a 423 "account is locked" error; no session issued. |
| `agent.glitch` | `glitch` | Premium **calculate** is artificially delayed ~3.5s (loading state must show). |
| `agent.bug` | `bug` | Base premium **inflated +5%**; on the quotation build screen a broken illustration thumbnail appears and the **Confirm & create illustration** button is **inert** (does nothing). |
| `agent.error` | `error` | Creating the illustration **always fails with a 500**; no illustration is created and the error surfaces on the build screen. |

The signed-in agent's `display_name`, `username`, and a **scenario badge** (label per flag) are shown in the app header.

### 2.3 App shell (authenticated layout)
Wraps every authenticated page. Provides:
- **Brand/home link** → `/`.
- **Primary nav:** Dashboard (`/`), Leads (`/leads`), Packages (`/packages`), Catalog (`/catalog`). The item matching the current path is marked active (`/` matches exactly; others match by path prefix).
- **New Quotation** action → `/quotations/new`.
- **Reset** action → `POST /api/admin/reset`, then re-load all data; show a busy state while in flight. (Restores the seeded baseline for every entity.)
- **User block:** display name, username, scenario badge.
- **Sign out** → `POST /logout`.

Test IDs: `app-header`, `app-nav`, `header-app-title`, `nav-dashboard-link`, `nav-leads-link`, `nav-packages-link`, `nav-catalog-link`, `nav-new-quotation`, `reset-data-button`, `header-user-name`, `header-scenario-badge`, `header-logout-button`.

### 2.4 Data scoping & ownership
- Leads, quotations, and illustrations are **owned by the signed-in agent**; another agent's records are not visible and resolve as 404.
- Packages are either **agent-owned** (editable/deletable) or **global templates** (`agent_id = null`): templates are usable but **read-only** (no edit/delete).

### 2.5 Validation & error display
- Form actions return either field-level errors (keyed by field name) or a general error message.
- Pages must render: (a) a general error banner when present, and (b) inline field errors next to the offending input.
- API/client errors (quotation build screen) surface as a general error message on the page.

### 2.6 Common entity shapes (data the UI consumes)
- **Lead:** `full_name`, `dob` (YYYY-MM-DD), `gender` (male/female/other), `occupation?`, `national_id?`, `phone?`, `email?`, `status` (new/contacted/quoted/customer), timestamps.
- **CatalogProduct:** `code`, `name`, `description`, `min_age`/`max_age`, `min_sum_assured`/`max_sum_assured`, `term_options[]` (value `≥99` = "Whole life").
- **CatalogRiderPlan:** `code`, `rider_type` (health/ci/pa/tpd/wp), `name`, `description`, `min_age`/`max_age`, and **either** `flat_premium` (fixed annual cost) **or** `sum_assured_options[]` (rate-based).
- **Package:** `agent_id` (null = template), `name`, `description`, `base_product_code`, `default_sum_assured`, `term`, `modal` (payment frequency), `riders[]` (`{code, sum_assured}`).
- **Quotation:** insured snapshot (`insured_name`, `insured_dob`, `insured_age`, `insured_gender`, `insured_occupation`), `base_product_code?`, `sum_assured`, `term`, `modal`, `riders[]`, `calc?`, `status` (draft/illustrated), `illustration_id?`, timestamps.
- **QuotationCalc:** `base_premium`, `rider_premiums[]` (`{code, premium}`), `total_annual_premium`, `modal_premium` (amount per installment for the chosen frequency).
- **SalesIllustration:** `number` (`SI-YYYYMMDD-XXXX`), `insured_name`, `insured_age`, `product_name`, `term`, `modal`, `benefits[]` (`{label, detail, sum_assured?, premium?}`), `calc`, `created_at`.
- **Payment frequency (modal):** `annual` (×1/yr), `semi` (×2/yr), `quarterly` (×4/yr), `monthly` (×12/yr). Installment amount = `total_annual_premium × factor`, factors: annual 1.0, semi 0.52, quarterly 0.27, monthly 0.09 (includes a modal surcharge — paying more often costs more per year).

---

## 3. Pages

### 3.1 Login — `/login` (public)
**Purpose:** authenticate an agent.
**Inputs:** `username`, `password`.
**Actions:**
- Submit credentials. On success, set session and redirect to `redirectTo` (default `/`).
- On failure, show an error alert (e.g. invalid credentials; locked account for `agent.locked`).
- Provide a **demo-agent helper**: list the five demo usernames with a one-line note each; clicking one fills the username field. Show the shared password (`insure_demo`).
**States:** idle, submitting (disable submit / "Signing in…"), error.
**Test IDs:** `login-app-title`, `login-error-alert`, `login-username-input`, `login-password-input`, `login-submit-button`.

### 3.2 Dashboard — `/` (home)
**Purpose:** pipeline overview + recent activity.
**Data:** counts of leads, packages, quotations, and illustrated quotations; a **recent activity feed** (latest ~8 transactions across leads/quotations/illustrations).
**Actions:**
- Stat tiles link to their sections: Leads→`/leads`, Packages→`/packages`, Quotations→`/quotations/new`, Illustrations→`/`.
- **Start a quotation** → `/quotations/new`. **+ New lead** → `/leads/new`.
- Each activity row shows type, title/summary, status, updated date, and an **Open** action that deep-links by kind: lead→`/leads/{id}`, quotation→`/quotations/{id}`, illustration→`/illustrations/{id}`.
**States:** populated table vs **empty state** ("nothing yet" with a CTA to start a quotation).
**Test IDs:** `dashboard-page`, `dashboard-page-title`, `dashboard-new-quotation`, `dashboard-empty`, `dashboard-table`, `dashboard-row` (with `data-kind`, `data-status`), `dashboard-row-action`.

### 3.3 Leads list — `/leads`
**Purpose:** list the agent's leads/customers.
**Data:** all leads owned by the agent (name, occupation, status, created date).
**Actions:** **New lead** → `/leads/new`; per row **View** → `/leads/{id}` and **Quote** → `/quotations/new?leadId={id}`.
**States:** table vs empty state.
**Test IDs:** `leads-list-page`, `leads-list-page-title`, `leads-new-button`, `leads-empty-state`, `leads-table`, `leads-table-row` (`data-lead-id`), `leads-quote-button`.

### 3.4 Lead detail — `/leads/[id]`
**Purpose:** show one lead and its quotations.
**Data:** lead fields (DOB + computed age, gender, occupation, national ID, phone, email), status; list of the lead's quotations.
**Actions:** **Start quotation** → `/quotations/new?leadId={id}`; back to `/leads`; each quotation links to its illustration if illustrated (`/illustrations/{illustration_id}`) otherwise the build screen (`/quotations/{id}`). Each quotation row shows base product (or "Draft"), created date, and annual premium (or "No premium yet").
**States:** quotations list vs "no quotations yet". 404 if the lead isn't owned by the agent.
**Test IDs:** `lead-detail-page`, `lead-detail-page-title`, `lead-detail-status`, `lead-start-quotation-button`.

### 3.5 New lead — `/leads/new`
**Purpose:** create a lead.
**Inputs:** `full_name` (required), `dob` (date, required, YYYY-MM-DD), `gender` (required: male/female/other), `occupation` (optional), and an optional **contact details** group: `national_id`, `phone`, `email`.
**Validation rules:**
- `full_name` required; `dob` required and well-formed; `gender` required.
- `email` must be valid if provided.
- `national_id`, when provided, must pass the **Thai national-ID checksum** (13 digits).
**Actions:** Save → creates the lead and redirects to `/leads/{id}`. Cancel → `/leads`.
**States:** field errors inline; general error banner on failure.
**Test IDs:** `lead-new-page`, `lead-new-page-title`, `lead-form-error`, `lead-full-name-input`, `lead-full-name-error`, `lead-dob-input`, `lead-dob-error`, `lead-gender` (radio group), `lead-occupation-input`, `lead-national-id-input`, `lead-national-id-error`, `lead-phone-input`, `lead-email-input`, `lead-email-error`, `lead-submit-button`, `lead-cancel-button`.

### 3.6 Quotation wizard — overview
A 3-step flow. **Step 1** is its own route; **Steps 2 and 3** share the build route and are distinguished by internal state (`plan` vs `coverage`). The step label reads "Step N of 3".

#### 3.6.1 Step 1 — Insured — `/quotations/new`
**Purpose:** capture who is being insured and create a draft quotation.
**Modes (toggle):**
- **Existing lead:** select from the agent's leads. If arriving with `?leadId=`, that lead is preselected and this mode is default. If the agent has no leads, show a prompt to create one or start fresh.
- **Start fresh:** enter `full_name`, `dob`, `gender`, `occupation` directly.
**Validation:** exactly one source required — a valid `lead_id` **or** complete fresh insured details (name/dob/gender required). Submit is disabled in existing-lead mode until a lead is chosen.
**Actions:** **Continue to plan** → creates a draft quotation and redirects to `/quotations/{id}` (which opens at Step 2). Cancel → `/`.
**Test IDs:** `quotation-new-page`, `quotation-new-page-title`, `quotation-new-error-alert`, `quotation-mode-existing`, `quotation-mode-fresh`, `quotation-step1-no-lead`, `quotation-lead-select`, `quotation-insured-name`, `quotation-insured-dob`, `quotation-insured-gender`, `quotation-insured-occupation`, `quotation-create-button`.

#### 3.6.2 Step 2 — Choose plan — `/quotations/[id]` (state: `plan`)
**Purpose:** pick the basis of the quotation. Shown when the quotation has no base product yet.
**Data:** the insured's name + age in the header; available **packages** and **base life products**.
**Actions:**
- **Apply a package:** seeds base product, sum insured, term, payment frequency, and riders from the package, then advances to Step 3 and auto-calculates.
- **Pick a base life plan:** sets the product (seeding sensible default sum insured/term), then advances to Step 3.
- **Exit** → `/`.
**States:** package section only shown if packages exist; buttons disabled while a request is in flight.
**Test IDs:** `quotation-detail-page`, `package-options`, `package-option`, `product-options`, `product-option` (`data-code`), `quotation-error`.

#### 3.6.3 Step 3 — Coverage & premium — `/quotations/[id]` (state: `coverage`)
**Purpose:** configure coverage, calculate the premium, and finalize.
**Coverage inputs:**
- **Sum insured** (number; product min/max bounds).
- **Term** (choose from the product's `term_options`; `≥99` shown as "Whole life").
- **Payment frequency** (annual/semi/quarterly/monthly). Each option should communicate the **per-installment amount** once a premium exists (amount = `total_annual_premium × modal factor`); before calculation, show the payment cadence instead.
- **Riders:** for each rider type, optionally select a plan; rate-based riders also require choosing a sum-insured option, flat-premium riders do not.
- **Change plan** returns to Step 2.
**Premium calculation:**
- **Calculate premium** triggers a recompute (persist current selections, then a preview calculation). For `agent.glitch` this takes ~3.5s and must show a loading state ("Calculating premium…").
- Validation errors (age outside product range, sum insured out of bounds, term unavailable, rider age/sum invalid) surface as field/general errors.
- **Premium summary** shows: base plan premium, each rider's premium, **total annual premium**, and the **per-installment amount** for the selected frequency.
**Finalize:**
- **Confirm & create illustration** → creates the illustration and redirects to `/illustrations/{id}`.
- **Scenario `agent.bug`:** a (broken) illustration thumbnail is rendered and the confirm button is **inert**.
- **Scenario `agent.error`:** confirmation fails with a 500; show the error, stay on the page, no illustration created.
**Business rules:** only `draft` quotations are editable; a finalized quotation rejects further edits.
**Test IDs:** `quotation-detail-page`, `coverage-sum-assured`, `coverage-term` (radio group), `coverage-modal` (frequency control — option test IDs are `coverage-modal-<value>`), `rider-list`, `rider-select-<type>`, `rider-sum-<type>`, `recalculate-button`, `premium-summary`, `premium-loading`, `premium-base`, `premium-total`, `premium-modal`, `illustration-thumb` (bug only), `confirm-illustration-button`, `quotation-error`.

### 3.7 Sales illustration — `/illustrations/[id]`
**Purpose:** present a finalized, printable illustration (read-only).
**Data:** illustration number (`SI-YYYYMMDD-XXXX`) + date; insured name & age; base plan name; term + payment frequency; a **benefits table** (coverage label, type/detail, sum insured, annual premium per line); **total annual premium** and **per-installment amount**; a fixed disclaimer.
**Actions:** **Print** (browser print); **Back to edit** → `/quotations/{quotation_id}`; **Dashboard** → `/`. Print controls must not appear in the printed output.
**States:** 404 if not owned by the agent.
**Test IDs:** `illustration-page`, `illustration-exit`, `illustration-edit`, `illustration-number`, `illustration-insured`, `illustration-benefits`, `illustration-total`.

### 3.8 Packages list — `/packages`
**Purpose:** manage reusable plan bundles.
**Data:** cards per package — name, description, base plan code, default sum insured, rider count; **Template** marker for global templates (`agent_id = null`).
**Actions:** **New package** → `/packages/new`. Agent-owned packages expose **Edit** → `/packages/{id}` and **Delete** (`POST ?/delete`). Templates expose neither.
**Test IDs:** `packages-page`, `package-new-button`, `package-card`, `package-delete`.

### 3.9 New / Edit package — `/packages/new`, `/packages/[id]`
Both use the same form component.
**Inputs:** `name` (required), `description`, **base life plan** (required; selecting one keeps `term` valid against the plan's options), `default_sum_assured` (positive number), `term` (from the selected plan's options), **payment frequency**, and **riders** (per rider type: optional plan; rate-based plans also need a sum-insured option).
**Actions:** Save (Create / "Save changes") → persists and returns to the packages list/flow; Cancel → `/packages`.
**Validation:** name required; base product required; default sum insured positive; term positive. Field/general errors render inline.
**Test IDs:** `package-form`, `package-name`, `package-description`, `package-product` (base-plan radio group), `package-sum`, `package-submit`. (Edit page wrapper: `package-edit-page`.)

### 3.10 Catalog — `/catalog`
**Purpose:** read-only reference of products and riders.
**Data/behaviour:** tabbed view — **Life plans** plus one tab per rider type (Health, Critical Illness, Personal Accident, Total Permanent Disability, Waiver of Premium).
- **Product card:** name, description, age range, sum-insured range, term options ("WL" for whole life).
- **Rider card:** name, description, age range, and **either** flat annual premium **or** entry sum-insured option (depending on plan type).
**Test IDs:** `catalog-page`, `catalog-product`, `catalog-rider`.

### 3.11 API docs — `/api-docs` (public)
**Purpose:** interactive Swagger UI for the JSON API, loaded from `/api/openapi.json`. Browser-only; no auth required.

---

## 4. Client-Called APIs (quotation build screen)
The build screen (Step 2/3) drives these directly from the browser; a redesign must keep using them:
- `PUT /api/quotations/{id}` — persist selections (product / package apply / sum / term / modal / riders).
- `POST /api/quotations/{id}/calculate` — preview premium (carries the glitch delay & bug inflation).
- `POST /api/quotations/{id}/illustrate` — finalize → returns the new illustration id (fails for `agent.error`).
- `POST /api/admin/reset` — reset all data (used by the header Reset action).

---

## 5. Out of Scope for Redesign
- Premium math, modal factors, and validation thresholds (server-owned; keep displaying their outputs).
- The five scenario behaviours and the seeded demo data.
- Route paths, auth/redirect rules, and the `data-testid` contract.
