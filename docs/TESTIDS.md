# data-testid Catalog — InsureAgentLabs

**Convention:** `<area>-<element>-<qualifier?>`. Stable selectors for Playwright.

## Login
- `login-app-title`, `login-username-input`, `login-password-input`, `login-submit-button`, `login-error-alert`

## App shell
- `app-header`, `app-nav`, `header-app-title`, `header-user-name`, `header-scenario-badge`, `header-logout-button`
- `nav-dashboard-link`, `nav-leads-link`, `nav-packages-link`, `nav-catalog-link`, `nav-new-quotation`, `reset-data-button`

## Dashboard
- `dashboard-page`, `dashboard-page-title`, `dashboard-new-quotation`, `dashboard-empty`, `dashboard-table`, `dashboard-row`, `dashboard-row-action`

## Leads
- `leads-list-page`, `leads-list-page-title`, `leads-new-button`, `leads-table`, `leads-table-row`, `leads-quote-button`
- New: `lead-new-page`, `lead-full-name-input`, `lead-dob-input`, `lead-gender-select`, `lead-occupation-input`, `lead-national-id-input`, `lead-phone-input`, `lead-email-input`, `lead-submit-button`, `lead-*-error`
- Detail: `lead-detail-page`, `lead-detail-page-title`, `lead-detail-status`, `lead-start-quotation-button`

## Packages
- `packages-page`, `package-new-button`, `package-card`, `package-delete`
- Form: `package-form`, `package-name`, `package-description`, `package-product`, `package-sum`, `package-submit`

## Quotation wizard
- Step 1: `quotation-new-page`, `quotation-mode-existing`, `quotation-mode-fresh`, `quotation-lead-select`, `quotation-insured-name`, `quotation-insured-dob`, `quotation-insured-gender`, `quotation-insured-occupation`, `quotation-create-button`
- Step 2/2.1: `quotation-detail-page`, `quotation-error`, `package-options`, `package-option`, `product-options`, `product-option` (`data-code`), `coverage-sum-assured`, `coverage-term`, `coverage-modal`, `rider-list`, `rider-select-<type>`, `rider-sum-<type>`, `recalculate-button`
- Premium: `premium-summary`, `premium-loading`, `premium-base`, `premium-total`, `premium-modal`, `illustration-thumb` (bug only), `confirm-illustration-button`

## Sales Illustration
- `illustration-page`, `illustration-number`, `illustration-insured`, `illustration-benefits`, `illustration-total`, `illustration-exit`, `illustration-edit`

## Catalog
- `catalog-page`, `catalog-product`, `catalog-rider`
