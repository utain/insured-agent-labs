# 02 — Product & Rider Catalog

**Status:** ✅ Implemented (Phase 2)
**Backend:** `backend/src/catalog/mod.rs`, static data in `backend/src/seed.rs`
**Frontend:** `web/src/routes/(app)/catalog`

## 1. Overview

A read-only catalog of base life-insurance products and supplementary "rider" plans.
The catalog is static seed data (no create/update/delete) and is consumed both by
the catalog browser page and by the Quotation wizard ([04](04-quotations.md)) to
populate eligible products, age/sum-assured bounds, and premium-rate tables.

## 2. Actors

- **Agent** — browses the catalog; read-only.

## 3. Data Model

`CatalogProduct`:

| Field | Type | Notes |
|---|---|---|
| `code` | string | e.g. `LIFE_TERM`, `LIFE_WHOLE`, `LIFE_ENDOW`, `LIFE_ULIP` |
| `name_en` / `name_th` | string | |
| `description_en` / `description_th` | string | |
| `min_age` / `max_age` | int | eligible insured age range |
| `min_sum_assured` / `max_sum_assured` | u64 (THB) | |
| `term_options` | `int[]` | valid policy terms in years (`99` = whole life) |
| `rate_per_thousand` | `(age, rate)[]` | age-keyed premium rate table, interpolated — see [04](04-quotations.md) §6 |

Seeded products:

| Code | Name | Age range | Sum assured (THB) | Terms |
|---|---|---|---|---|
| `LIFE_TERM` | Term Life | 18–70 | 100,000 – 10,000,000 | 10, 15, 20, 25, 30 |
| `LIFE_WHOLE` | Whole Life | 18–65 | 100,000 – 5,000,000 | 99 (to age 99) |
| `LIFE_ENDOW` | Endowment | 18–60 | 50,000 – 3,000,000 | 10, 15, 20, 25 |
| `LIFE_ULIP` | Unit-Linked | 18–70 | 100,000 – 20,000,000 | 10, 15, 20, 25, 30 |

`CatalogRiderPlan`:

| Field | Type | Notes |
|---|---|---|
| `code` | string | e.g. `CI_PLAN_1` |
| `rider_type` | `health` \| `ci` \| `pa` \| `tpd` \| `wp` | |
| `name_en` / `name_th` | string | |
| `min_age` / `max_age` | int | eligibility range (18–65 for all seeded riders) |
| `sum_assured_options` | `u64[]` | selectable rider sum-assured amounts |
| `flat_premium` | `f64?` | fixed annual premium (used for `wp` — Waiver of Premium) |
| `rate_per_thousand` | `(age, rate)[]?` | age-keyed rate table (used for all non-WP riders) |

Rider types seeded, each with multiple numbered plans (`<TYPE>_PLAN_<n>`):

| Type | Label (EN / TH) | Plans |
|---|---|---|
| `health` | Health / สุขภาพ | 5 |
| `ci` | Critical Illness / โรคร้ายแรง | 6 |
| `pa` | Personal Accident / อุบัติเหตุ | 6 |
| `tpd` | Total Permanent Disability / ทุพพลภาพถาวรสิ้นเชิง | 5 |
| `wp` | Waiver of Premium / สละสิทธิ์เบี้ยประกัน | 5 |

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/catalog/products` | session | List all base products |
| `GET` | `/api/catalog/products/{code}` | session | Get one product; `404` if unknown |
| `GET` | `/api/catalog/riders?type={RiderType}` | session | List rider plans, optional `type` filter |
| `GET` | `/api/catalog/riders/{code}` | session | Get one rider plan; `404` if unknown |

## 5. Functional Requirements

- **FR-2.1**: The system shall expose all base products and rider plans via
  read-only, authenticated GET endpoints.
- **FR-2.2**: Rider listing shall support filtering by `rider_type` via the `type`
  query parameter; omitting it returns all riders.
- **FR-2.3**: Requesting an unknown product or rider code shall return
  `404 not_found`.
- **FR-2.4**: Catalog data shall be immutable at runtime — no create/update/delete
  endpoints exist. It is restored verbatim by `POST /api/admin/reset`.

## 6. Business Rules & Validation

- None — catalog is static reference data. Age/sum-assured/term **bounds defined
  here** are enforced as validation rules when creating/updating a quotation (see
  [04](04-quotations.md) §6).

## 7. UI Requirements

- `/(app)/catalog` — lists base products (`catalog-products` section) and riders
  (`catalog-riders` section), with a rider-type filter
  (`catalog.rider_type.{all,health,ci,pa,tpd,wp}`).
- Each product/rider card shows localized name/description, min/max age, and
  sum-assured range (`catalog.min_age`, `catalog.max_age`,
  `catalog.sum_assured_range`).
- Bilingual: all names/descriptions render from `name_en`/`name_th` or
  `description_en`/`description_th` depending on the active locale.

## 8. Scenario Hooks (QA Training)

None — the catalog is identical across all scenario users; it is a stable reference
point for cross-checking quotation math.

## 9. Acceptance Criteria

- [ ] `GET /api/catalog/products` returns exactly 4 products with the codes above.
- [ ] `GET /api/catalog/products/LIFE_TERM` returns `200`; `GET
      /api/catalog/products/NOPE` returns `404 not_found`.
- [ ] `GET /api/catalog/riders?type=ci` returns only `CI_PLAN_*` entries.
- [ ] The catalog page renders both languages correctly when switching
      `/en` ↔ `/th`.

## 10. Out of Scope

- Catalog administration UI (add/edit products or riders).
- Pricing changes / versioned rate tables.
- Product eligibility rules beyond age and sum-assured bounds (e.g. occupation
  exclusions, medical underwriting classes).
