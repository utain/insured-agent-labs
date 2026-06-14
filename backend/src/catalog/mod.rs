use axum::extract::{Path, Query, State};
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;

use crate::auth::AuthUser;
use crate::db::{CatalogProduct, CatalogRiderPlan, RiderType};
use crate::error::ApiError;
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(list_products))
        .routes(utoipa_axum::routes!(get_product))
        .routes(utoipa_axum::routes!(list_riders))
        .routes(utoipa_axum::routes!(get_rider))
}

#[utoipa::path(
    get,
    path = "/api/catalog/products",
    responses((status = 200, body = [CatalogProduct], description = "All base life products")),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Catalog"
)]
async fn list_products(State(state): State<AppState>, _user: AuthUser) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    Ok(Json(db.products.clone()))
}

#[utoipa::path(
    get,
    path = "/api/catalog/products/{code}",
    params(("code" = String, Path, description = "Product code e.g. LIFE_TERM")),
    responses(
        (status = 200, body = CatalogProduct, description = "Product detail"),
        (status = 404, description = "Unknown product", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Catalog"
)]
async fn get_product(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(code): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let product = db
        .products
        .iter()
        .find(|p| p.code == code)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("product {code}")))?;
    Ok(Json(product))
}

#[derive(Debug, Deserialize)]
pub struct RiderFilter {
    #[serde(rename = "type")]
    pub rider_type: Option<RiderType>,
}

#[utoipa::path(
    get,
    path = "/api/catalog/riders",
    params(("type" = Option<RiderType>, Query, description = "Filter by rider type")),
    responses((status = 200, body = [CatalogRiderPlan], description = "Rider plans")),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Catalog"
)]
async fn list_riders(
    State(state): State<AppState>,
    _user: AuthUser,
    Query(filter): Query<RiderFilter>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let riders: Vec<CatalogRiderPlan> = db
        .riders
        .iter()
        .filter(|r| filter.rider_type.is_none_or(|t| r.rider_type == t))
        .cloned()
        .collect();
    Ok(Json(riders))
}

#[utoipa::path(
    get,
    path = "/api/catalog/riders/{code}",
    params(("code" = String, Path, description = "Rider plan code e.g. CI_PLAN_1")),
    responses(
        (status = 200, body = CatalogRiderPlan, description = "Rider plan detail"),
        (status = 404, description = "Unknown rider", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Catalog"
)]
async fn get_rider(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(code): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let rider = db
        .riders
        .iter()
        .find(|r| r.code == code)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("rider {code}")))?;
    Ok(Json(rider))
}

// Keep ToSchema in scope for the path macro.
#[allow(unused_imports)]
use ToSchema as _;
