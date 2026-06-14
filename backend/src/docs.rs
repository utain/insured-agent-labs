use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "InsureAgentLabs API",
        version = "0.1.0",
        description = "QA-Automation training API for a Thailand life-insurance agent platform. \
                       All protected endpoints accept either `Authorization: Bearer <token>` or the \
                       `session` cookie returned by `/api/auth/login`. \
                       Test users (password: `insure_demo`): agent.standard, agent.locked, \
                       agent.glitch, agent.bug, agent.error."
    ),
    servers((url = "http://localhost:3000", description = "Local backend")),
    components(schemas(
        // errors
        crate::error::ErrorEnvelope,
        crate::error::ErrorBody,
        crate::error::FieldError,
        // auth
        crate::auth::LoginRequest,
        crate::auth::LoginResponse,
        crate::auth::UserDto,
        // catalog
        crate::db::CatalogProduct,
        crate::db::CatalogRiderPlan,
        crate::db::RiderType,
        // leads
        crate::leads::dto::LeadDto,
        crate::leads::dto::CreateLeadRequest,
        crate::leads::dto::UpdateLeadRequest,
        // quotations
        crate::quotations::dto::QuotationDto,
        crate::quotations::dto::CreateQuotationRequest,
        crate::quotations::dto::UpdateQuotationRequest,
        crate::db::RiderSelection,
        crate::db::QuotationCalc,
        crate::db::RiderPremium,
        crate::db::Modal,
        // eapps
        crate::eapps::dto::EAppDto,
        crate::eapps::dto::CreateEAppRequest,
        crate::eapps::dto::UpdateEAppRequest,
        crate::db::Beneficiary,
        crate::db::HealthDeclaration,
        // payments
        crate::payments::dto::PaymentDto,
        crate::payments::dto::CreatePaymentRequest,
        crate::db::PaymentMethod,
        crate::db::PaymentStatus,
        // enums
        crate::db::Role,
        crate::db::ScenarioFlag,
        crate::db::Locale,
        crate::db::Gender,
        crate::db::LeadStatus,
        crate::db::QuotationStatus,
        crate::db::EAppStatus,
        crate::db::PaymentStatus,
        crate::db::PaymentMethod,
        crate::db::Modal,
        crate::db::TransactionKind,
        crate::transactions::TransactionPage,
        crate::admin::DebugState,
        crate::admin::SeedExtraLeadRequest,
    )),
    modifiers(&SecurityAddon),
    tags(
        (name = "Auth", description = "Login / logout / current user"),
        (name = "Catalog", description = "Product & rider catalog"),
        (name = "Leads", description = "Prospect CRUD"),
        (name = "Quotations", description = "Quotation lifecycle"),
        (name = "EApps", description = "E-applications"),
        (name = "Payments", description = "Mock payment gateway"),
        (name = "Transactions", description = "Dashboard history"),
        (name = "Admin", description = "QA/admin tooling"),
        (name = "Health", description = "Liveness"),
    )
)]
pub struct ApiDoc;

/// Adds bearer + cookie security schemes to the OpenAPI spec.
struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
        let components = openapi.components.get_or_insert_default();
        components.add_security_scheme(
            "bearerAuth",
            SecurityScheme::Http(
                utoipa::openapi::security::Http::new(
                    utoipa::openapi::security::HttpAuthScheme::Bearer,
                ),
            ),
        );
        components.add_security_scheme(
            "cookieAuth",
            SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::new("session"))),
        );
    }
}
