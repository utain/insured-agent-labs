# data-testid Catalog — InsureAgentLabs

**Convention**: `<area>-<element>-<qualifier?>`

Every interactive element, container, and error/status message has a unique `data-testid`. Pair with semantic ARIA roles for `getByRole`-style locators.

> This file is updated as each phase lands. Sections marked *(pending)* are planned but not yet implemented.

---

## Global / Layout
| testid | Element | ARIA |
|---|---|---|
| `app-header` | `<header>` | `banner` (implicit) |
| `app-nav` | `<nav>` | `navigation` (implicit) |
| `header-app-title` | Logo link | — |
| `nav-dashboard-link` | Dashboard nav link | `link` |
| `nav-catalog-link` | Catalog nav link | `link` |
| `lang-select` | Language `<select>` | `combobox` |
| `lang-option-en` / `lang-option-th` | Language options | `option` |
| `header-user-name` | User display name | — |
| `header-logout-button` | Logout button | — |

> **Error display**: errors are surfaced inline per-form (e.g. `login-error-alert`, `quotation-step5-error-alert`, `eapp-error-alert`, `payment-status-alert`) rather than via a global toast.

## Login
| testid | Element | ARIA |
|---|---|---|
| `login-app-title` | App title heading | `heading` |
| `login-app-tagline` | Subtitle | — |
| `login-page-title` | Page heading | `heading` |
| `login-username-label` / `login-username-input` | Username field | `textbox` |
| `login-username-error` | Username field error | `role="alert"` |
| `login-password-label` / `login-password-input` | Password field | `textbox` |
| `login-password-error` | Password field error | `role="alert"` |
| `login-submit-button` | Submit button | — |
| `login-error-alert` | Login failure (invalid/locked) | `role="alert"` `aria-live="assertive"` |
| `login-hint` | Test-user hint text | — |

## Dashboard
| testid | Element | ARIA |
|---|---|---|
| `dashboard-page` | Page container | — |
| `dashboard-page-title` | Welcome heading | `heading` |
| `dashboard-new-quotation` | New Quotation CTA | `link` |
| `dashboard-new-lead` | New Lead CTA | `link` |
| `dashboard-filter-form` | Filter `<form>` | `form` |
| `dashboard-filter-search` | Search input | `textbox` |
| `dashboard-filter-apply` | Apply filters button | `button` |
| `dashboard-filter-clear` | Clear filters link | `link` |
| `dashboard-table` | Transactions table | `table` |
| `dashboard-row` | Per-row `<tr>` (also has `data-kind`, `data-status`) | `row` |
| `dashboard-row-kind` | Kind badge in row | — |
| `dashboard-row-title` | Title cell | — |
| `dashboard-row-summary` | Summary cell | — |
| `dashboard-row-status` | Status badge | — |
| `dashboard-row-action` | Continue/View link | `link` |
| `dashboard-empty` | Empty state | — |
| `dashboard-empty-cta` | Empty state CTA | `link` |
| `dashboard-count` | Total count line | — |

## Catalog *(pending Phase 2)*
| testid | Element |
|---|---|
| `catalog-product-card-{code}` | Product card |
| `catalog-rider-type-filter` | Rider type filter |

## Leads *(pending Phase 2)*
| testid | Element |
|---|---|
| `lead-full-name-input` / `lead-full-name-error` | Full name |
| `lead-national-id-input` / `lead-national-id-error` | Thai national ID |
| `lead-dob-input` / `lead-dob-error` | Date of birth |
| `lead-gender-select` | Gender |
| `lead-phone-input` / `lead-phone-error` | Phone |
| `lead-email-input` | Email |
| `lead-submit-button` | Submit |

## Quotation wizard *(pending Phase 3)*
| testid | Element |
|---|---|
| `quotation-stepper` / `quotation-step-indicator-{1..5}` | Wizard chrome |
| `quotation-step1-lead-select` | Step 1: choose lead |
| `quotation-step2-product-card-{code}` | Step 2: base product cards |
| `quotation-step3-rider-type-tab-{type}` | Step 3: rider type tabs |
| `quotation-step3-rider-toggle-{code}` | Step 3: rider plan toggle |
| `quotation-step4-sum-assured-input` | Step 4: sum assured |
| `quotation-step4-base-premium-value` | Step 4: base premium |
| `quotation-step4-total-premium-value` | Step 4: total premium |
| `quotation-step4-modal-premium-value` | Step 4: modal premium |
| `quotation-step5-finalize-button` | Step 5: finalize |

## E-App *(pending Phase 4)*
| testid | Element |
|---|---|
| `eapp-beneficiary-name-input-{i}` | Beneficiary name |
| `eapp-beneficiary-share-input-{i}` | Beneficiary share % |
| `eapp-beneficiary-total-share-value` | Total share |
| `eapp-beneficiary-total-share-error` | Share ≠ 100 error |
| `eapp-health-question-{qid}` | Health declaration question |
| `eapp-submit-button` | Submit |

## Payment *(pending Phase 4)*
| testid | Element |
|---|---|
| `payment-amount-value` | Amount |
| `payment-outcome-success-button` / `payment-outcome-declined-button` / `payment-outcome-pending-button` | Mock outcomes |
| `payment-status-alert` | Result |

## Policy *(pending Phase 4)*
| testid | Element |
|---|---|
| `policy-number-value` | Policy number |
| `policy-status-badge` | Status |
