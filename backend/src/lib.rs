pub mod admin;
pub mod auth;
pub mod catalog;
pub mod db;
pub mod docs;
pub mod eapps;
pub mod error;
pub mod leads;
pub mod payments;
pub mod quotations;
pub mod seed;
pub mod state;
pub mod transactions;

use axum::routing::get;
use axum::Router;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;

use crate::state::{AppState, Config};

/// Build the full axum router with all routes + Swagger + CORS + tracing.
pub fn app_router(state: AppState) -> Router {
    let cors = build_cors(&state.config);

    // OpenApiRouter collects both the axum routes AND the OpenAPI path items.
    let api = OpenApiRouter::new()
        .merge(auth::router())
        .merge(catalog::router())
        .merge(leads::router())
        .merge(quotations::router())
        .merge(eapps::router())
        .merge(payments::router())
        .merge(transactions::router())
        .merge(admin::router());

    // split_for_parts gives (axum_router, openapi_spec)
    let (api_routes, path_api) = api.split_for_parts();

    // Merge the path items collected by OpenApiRouter into our base ApiDoc.
    let mut openapi = docs::ApiDoc::openapi();
    openapi.merge(path_api);

    Router::new()
        .route("/api/health", get(health))
        .merge(api_routes)
        .merge(utoipa_swagger_ui::SwaggerUi::new("/api-docs").url("/api-docs/openapi.json", openapi))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}

async fn health() -> impl axum::response::IntoResponse {
    axum::Json(serde_json::json!({ "status": "ok" }))
}

fn build_cors(config: &Config) -> CorsLayer {
    let allowed = config.cors_origin.clone();
    let origin = AllowOrigin::predicate(move |req_origin, _| {
        req_origin
            .to_str()
            .map(|s| s == allowed || s.starts_with("http://localhost"))
            .unwrap_or(false)
    });
    // Cannot use Any methods/headers with credentials=true; list the ones we need.
    CorsLayer::new()
        .allow_origin(origin)
        .allow_credentials(true)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::PATCH,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ACCEPT,
            axum::http::header::COOKIE,
            // Custom
            axum::http::HeaderName::from_static("x-admin-secret"),
        ])
}

// Re-export for tests / main
pub use state::AppState as AppStateType;
