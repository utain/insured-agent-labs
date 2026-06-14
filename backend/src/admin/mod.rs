use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;

use crate::auth::AuthUser;
use crate::db::{Lead, LeadStatus, ScenarioFlag, User};
use crate::error::ApiError;
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(reset_state))
        .routes(utoipa_axum::routes!(list_users))
        .routes(utoipa_axum::routes!(get_user))
        .routes(utoipa_axum::routes!(debug_state))
        .routes(utoipa_axum::routes!(seed_extra_lead))
}

/// Guard: only the QA `agent.standard` (or admin-secret header) can call admin endpoints.
fn require_admin(user: &AuthUser, secret: Option<&str>, expected: &str) -> Result<(), ApiError> {
    if secret == Some(expected) {
        return Ok(());
    }
    // Allow agent.standard to self-administer for the demo flow.
    if user.0.username == "agent.standard" {
        return Ok(());
    }
    Err(ApiError::Forbidden)
}

/// Reset the in-memory database back to the seeded state (clears all sessions).
#[utoipa::path(
    post,
    path = "/api/admin/reset",
    responses((status = 204, description = "State reset")),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Admin"
)]
async fn reset_state(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<impl IntoResponse, ApiError> {
    require_admin(&user, None, &state.config.admin_secret)?;
    state.reseed_async().await;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DebugState {
    pub users: usize,
    pub leads: usize,
    pub quotations: usize,
    pub eapps: usize,
    pub payments: usize,
    pub transactions: usize,
    pub catalog_products: usize,
    pub catalog_riders: usize,
    pub sessions: usize,
    pub current_user: String,
    pub scenario: ScenarioFlag,
}

/// Return counts of each collection — useful for QA assertions.
#[utoipa::path(
    get,
    path = "/api/admin/debug-state",
    responses((status = 200, body = DebugState)),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Admin"
)]
async fn debug_state(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<impl IntoResponse, ApiError> {
    require_admin(&user, None, &state.config.admin_secret)?;
    let db = state.db.lock().await;
    let sessions = state.sessions.lock().await;
    Ok(Json(DebugState {
        users: db.users.len(),
        leads: db.leads.len(),
        quotations: db.quotations.len(),
        eapps: db.eapps.len(),
        payments: db.payments.len(),
        transactions: db.transactions.len(),
        catalog_products: db.products.len(),
        catalog_riders: db.riders.len(),
        sessions: sessions.len(),
        current_user: user.0.username.clone(),
        scenario: user.0.scenario_flag,
    }))
}

/// List all demo users (without passwords).
#[utoipa::path(
    get,
    path = "/api/admin/users",
    responses((status = 200, body = Vec<User>)),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Admin"
)]
async fn list_users(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<impl IntoResponse, ApiError> {
    require_admin(&user, None, &state.config.admin_secret)?;
    let db = state.db.lock().await;
    let mut users: Vec<User> = db.users.values().cloned().collect();
    // Do not expose password hashes in the admin listing.
    for u in &mut users {
        u.password = String::new();
    }
    Ok(Json(users))
}

/// Get a single demo user by username.
#[utoipa::path(
    get,
    path = "/api/admin/users/{username}",
    params(("username" = String, Path, description = "Username")),
    responses(
        (status = 200, body = User),
        (status = 404, description = "User not found", body = crate::error::ErrorEnvelope)
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Admin"
)]
async fn get_user(
    State(state): State<AppState>,
    user: AuthUser,
    Path(username): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    require_admin(&user, None, &state.config.admin_secret)?;
    let db = state.db.lock().await;
    let uid = db
        .users_by_username
        .get(&username)
        .ok_or_else(|| ApiError::NotFound(format!("user {username}")))?;
    let mut u = db
        .users
        .get(uid)
        .ok_or_else(|| ApiError::NotFound(format!("user {username}")))?
        .clone();
    u.password = String::new();
    Ok(Json(u))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct SeedExtraLeadRequest {
    pub full_name: String,
    pub national_id: String,
    pub phone: String,
    pub email: Option<String>,
    /// Optional scenario to stamp onto the new lead (does not change user).
    pub tag: Option<String>,
}

/// Seed an extra lead belonging to the current user — handy for test setup.
#[utoipa::path(
    post,
    path = "/api/admin/seed-extra",
    request_body = SeedExtraLeadRequest,
    responses((status = 201, body = Lead)),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Admin"
)]
async fn seed_extra_lead(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<SeedExtraLeadRequest>,
) -> Result<impl IntoResponse, ApiError> {
    require_admin(&user, None, &state.config.admin_secret)?;
    if !crate::db::validate_thai_national_id(&req.national_id) {
        return Err(ApiError::Validation {
            fields: vec![crate::error::FieldError::new(
                "national_id",
                "Invalid Thai national ID",
            )],
        });
    }
    if !crate::db::validate_thai_phone(&req.phone) {
        return Err(ApiError::Validation {
            fields: vec![crate::error::FieldError::new("phone", "Invalid Thai phone")],
        });
    }

    let mut db = state.db.lock().await;
    let now = crate::db::now();
    let lead = Lead {
        id: uuid::Uuid::new_v4(),
        agent_id: user.0.id,
        full_name: req.full_name,
        national_id: req.national_id,
        dob: chrono::NaiveDate::from_ymd_opt(1990, 1, 1).unwrap(),
        gender: crate::db::Gender::Male,
        phone: req.phone,
        email: req.email,
        occupation: Some("QA Seeded".to_string()),
        income: Some(0.0),
        status: LeadStatus::New,
        created_at: now,
        updated_at: now,
    };
    db.leads.insert(lead.id, lead.clone());

    // Also push a dashboard transaction so the new lead is visible.
    db.transactions.push(crate::db::make_transaction(
        user.0.id,
        crate::db::TransactionKind::Lead,
        lead.id,
        "Seeded Lead",
        "ลูกค้าที่เพิ่ม",
        &format!("{} — {}", lead.full_name, lead.phone),
        &format!("{} — {}", lead.full_name, lead.phone),
        "new",
    ));

    Ok((StatusCode::CREATED, Json(lead)))
}
