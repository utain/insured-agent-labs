use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::Json;
use utoipa_axum::router::OpenApiRouter;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::db::LeadStatus;
use crate::error::ApiError;
use crate::leads::dto::{lead_from_create, CreateLeadRequest, LeadDto, UpdateLeadRequest};
use crate::leads::validation::{validate_create, validate_update};
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(list_leads))
        .routes(utoipa_axum::routes!(create_lead))
        .routes(utoipa_axum::routes!(get_lead))
        .routes(utoipa_axum::routes!(update_lead))
        .routes(utoipa_axum::routes!(delete_lead))
}

/// List the current agent's leads.
#[utoipa::path(
    get,
    path = "/api/leads",
    responses((status = 200, body = [LeadDto], description = "Agent's leads")),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Leads"
)]
async fn list_leads(State(state): State<AppState>, user: AuthUser) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let leads: Vec<LeadDto> = db
        .leads
        .values()
        .filter(|l| l.agent_id == user.0.id)
        .cloned()
        .map(LeadDto::from)
        .collect();
    Ok(Json(leads))
}

/// Create a new lead. Validates Thai national ID checksum, age (18–80), phone.
#[utoipa::path(
    post,
    path = "/api/leads",
    request_body = CreateLeadRequest,
    responses(
        (status = 201, body = LeadDto, description = "Created"),
        (status = 422, description = "Validation error", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Leads"
)]
async fn create_lead(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<CreateLeadRequest>,
) -> Result<impl IntoResponse, ApiError> {
    validate_create(&req)?;
    let lead = lead_from_create(req, user.0.id);
    let dto = LeadDto::from(lead.clone());
    let mut db = state.db.lock().await;
    db.leads.insert(lead.id, lead.clone());

    // Create a dashboard transaction for the new lead.
    db.transactions.push(crate::db::make_transaction(
        user.0.id,
        crate::db::TransactionKind::Lead,
        lead.id,
        "New Lead",
        "ลูกค้าใหม่",
        &format!("{} — {}", lead.full_name, lead.phone),
        &format!("{} — {}", lead.full_name, lead.phone),
        "new",
    ));

    Ok((axum::http::StatusCode::CREATED, Json(dto)))
}

/// Get a single lead (must belong to the caller).
#[utoipa::path(
    get,
    path = "/api/leads/{id}",
    params(("id" = Uuid, Path, description = "Lead ID")),
    responses(
        (status = 200, body = LeadDto),
        (status = 404, description = "Not found / not owned", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Leads"
)]
async fn get_lead(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let lead = db
        .leads
        .get(&id)
        .cloned()
        .filter(|l| l.agent_id == user.0.id)
        .ok_or_else(|| ApiError::NotFound(format!("lead {id}")))?;
    Ok(Json(LeadDto::from(lead)))
}

/// Update a lead (only if status is New).
#[utoipa::path(
    put,
    path = "/api/leads/{id}",
    params(("id" = Uuid, Path)),
    request_body = UpdateLeadRequest,
    responses(
        (status = 200, body = LeadDto),
        (status = 404, description = "Not found", body = crate::error::ErrorEnvelope),
        (status = 409, description = "Lead not editable", body = crate::error::ErrorEnvelope),
        (status = 422, description = "Validation error", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Leads"
)]
async fn update_lead(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateLeadRequest>,
) -> Result<impl IntoResponse, ApiError> {
    validate_update(&req)?;
    let mut db = state.db.lock().await;
    let lead = db
        .leads
        .get_mut(&id)
        .filter(|l| l.agent_id == user.0.id)
        .ok_or_else(|| ApiError::NotFound(format!("lead {id}")))?;
    if lead.status != LeadStatus::New {
        return Err(ApiError::Conflict(
            "Lead can only be edited while status is New".into(),
        ));
    }
    if let Some(v) = req.full_name { lead.full_name = v; }
    if let Some(v) = req.national_id { lead.national_id = v; }
    if let Some(v) = req.dob { lead.dob = v; }
    if let Some(v) = req.gender { lead.gender = v; }
    if let Some(v) = req.phone { lead.phone = v; }
    if let Some(v) = req.email { lead.email = v; }
    if let Some(v) = req.occupation { lead.occupation = v; }
    if let Some(v) = req.income { lead.income = v; }
    lead.updated_at = crate::db::now();
    Ok(Json(LeadDto::from(lead.clone())))
}

/// Delete a lead (only if status is New).
#[utoipa::path(
    delete,
    path = "/api/leads/{id}",
    params(("id" = Uuid, Path)),
    responses(
        (status = 204, description = "Deleted"),
        (status = 404, description = "Not found", body = crate::error::ErrorEnvelope),
        (status = 409, description = "Lead not deletable", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Leads"
)]
async fn delete_lead(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<axum::http::StatusCode, ApiError> {
    let mut db = state.db.lock().await;
    let lead = db
        .leads
        .get(&id)
        .filter(|l| l.agent_id == user.0.id)
        .ok_or_else(|| ApiError::NotFound(format!("lead {id}")))?;
    if lead.status != LeadStatus::New {
        return Err(ApiError::Conflict(
            "Lead can only be deleted while status is New".into(),
        ));
    }
    db.leads.remove(&id);
    Ok(axum::http::StatusCode::NO_CONTENT)
}
