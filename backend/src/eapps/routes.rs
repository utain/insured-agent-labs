use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use utoipa_axum::router::OpenApiRouter;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::db::{EAppStatus, EApplication, QuotationStatus};
use crate::eapps::dto::{CreateEAppRequest, EAppDto, UpdateEAppRequest};
use crate::eapps::validation;
use crate::error::ApiError;
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(create_eapp))
        .routes(utoipa_axum::routes!(get_eapp))
        .routes(utoipa_axum::routes!(update_eapp))
        .routes(utoipa_axum::routes!(submit_eapp))
}

/// Create an e-application from a finalized quotation.
#[utoipa::path(
    post,
    path = "/api/eapps",
    request_body = CreateEAppRequest,
    responses(
        (status = 201, body = EAppDto),
        (status = 404, body = crate::error::ErrorEnvelope),
        (status = 409, description = "Quotation not finalized", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "EApps"
)]
async fn create_eapp(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<CreateEAppRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let mut db = state.db.lock().await;
    let quotation = db
        .quotations
        .get(&req.quotation_id)
        .filter(|q| q.agent_id == user.0.id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("quotation {}", req.quotation_id)))?;
    if quotation.status != QuotationStatus::Quoted {
        return Err(ApiError::Conflict("Quotation must be finalized (Quoted) before creating an e-application".into()));
    }

    let now = Utc::now();
    let eapp = EApplication {
        id: Uuid::new_v4(),
        quotation_id: quotation.id,
        lead_id: quotation.lead_id,
        agent_id: user.0.id,
        beneficiaries: vec![],
        health_declarations: vec![],
        payment_id: None,
        status: EAppStatus::Created,
        submitted_at: None,
        policy_number: None,
        created_at: now,
        updated_at: now,
    };
    let dto = EAppDto::from(eapp.clone());
    db.eapps.insert(eapp.id, eapp.clone());

    // Link quotation status.
    if let Some(q) = db.quotations.get_mut(&quotation.id) {
        q.status = QuotationStatus::Eapp;
        q.updated_at = now;
    }

    // Create a dashboard transaction.
    db.transactions.push(crate::db::make_transaction(
        user.0.id,
        crate::db::TransactionKind::Eapp,
        eapp.id,
        "E-Application",
        "ใบคำขอประกัน",
        &format!("{} — {}", quotation.insured_name, quotation.base_product_code),
        &format!("{} — {}", quotation.insured_name, quotation.base_product_code),
        "created",
    ));

    Ok((StatusCode::CREATED, Json(dto)))
}

/// Get an e-application.
#[utoipa::path(
    get,
    path = "/api/eapps/{id}",
    params(("id" = Uuid, Path)),
    responses((status = 200, body = EAppDto), (status = 404, body = crate::error::ErrorEnvelope)),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "EApps"
)]
async fn get_eapp(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let eapp = db
        .eapps
        .get(&id)
        .filter(|e| e.agent_id == user.0.id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("eapp {id}")))?;
    Ok(Json(EAppDto::from(eapp)))
}

/// Update beneficiaries + health declarations (only if status is Created).
#[utoipa::path(
    put,
    path = "/api/eapps/{id}",
    params(("id" = Uuid, Path)),
    request_body = UpdateEAppRequest,
    responses(
        (status = 200, body = EAppDto),
        (status = 404, body = crate::error::ErrorEnvelope),
        (status = 409, description = "Already submitted", body = crate::error::ErrorEnvelope),
        (status = 422, body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "EApps"
)]
async fn update_eapp(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateEAppRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let mut db = state.db.lock().await;
    let eapp = db
        .eapps
        .get_mut(&id)
        .filter(|e| e.agent_id == user.0.id)
        .ok_or_else(|| ApiError::NotFound(format!("eapp {id}")))?;
    if eapp.status != EAppStatus::Created {
        return Err(ApiError::Conflict("E-application already submitted".into()));
    }
    if let Some(b) = &req.beneficiaries {
        if let Some(h) = &req.health_declarations {
            validation::validate(b, h)?;
        }
        eapp.beneficiaries = b.clone();
    }
    if let Some(h) = req.health_declarations {
        eapp.health_declarations = h;
    }
    eapp.updated_at = Utc::now();
    Ok(Json(EAppDto::from(eapp.clone())))
}

/// Submit the e-application. Requires a successful payment. Issues a policy number.
#[utoipa::path(
    post,
    path = "/api/eapps/{id}/submit",
    params(("id" = Uuid, Path)),
    responses(
        (status = 200, body = EAppDto, description = "Submitted, policy issued"),
        (status = 404, body = crate::error::ErrorEnvelope),
        (status = 409, description = "Payment required or already submitted", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "EApps"
)]
async fn submit_eapp(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    // Read eapp, then release the borrow so we can access db.quotations.
    let (mut eapp, quotation_id) = {
        let db = state.db.lock().await;
        let e = db
            .eapps
            .get(&id)
            .filter(|e| e.agent_id == user.0.id)
            .cloned()
            .ok_or_else(|| ApiError::NotFound(format!("eapp {id}")))?;
        let qid = e.quotation_id;
        (e, qid)
    };

    let mut db = state.db.lock().await;

    if eapp.status != EAppStatus::Created {
        return Err(ApiError::Conflict("E-application already submitted".into()));
    }

    // Require a successful payment.
    let payment_id = eapp.payment_id;
    let payment_ok = payment_id
        .and_then(|pid| db.payments.get(&pid))
        .is_some_and(|p| p.status == crate::db::PaymentStatus::Success);
    if !payment_ok {
        return Err(ApiError::Conflict("A successful payment is required before submission".into()));
    }

    // Validate beneficiaries are filled.
    validation::validate(&eapp.beneficiaries, &eapp.health_declarations)?;

    let now = Utc::now();
    eapp.status = EAppStatus::Submitted;
    eapp.submitted_at = Some(now);
    eapp.policy_number = Some(format!("POL-{}-{}", now.format("%Y%m%d"), &Uuid::new_v4().to_string()[..8]));
    eapp.updated_at = now;

    // Persist back + update quotation.
    db.eapps.insert(eapp.id, eapp.clone());
    if let Some(q) = db.quotations.get_mut(&quotation_id) {
        q.status = QuotationStatus::Submitted;
        q.updated_at = now;
    }
    let insured_name = db
        .quotations
        .get(&quotation_id)
        .map(|q| q.insured_name.clone())
        .unwrap_or_else(|| "Insured".to_string());
    let dto = EAppDto::from(eapp.clone());
    let policy_no = dto.policy_number.as_deref().unwrap_or("pending");

    // Update dashboard transaction to "submitted" + policy issued.
    for t in db.transactions.iter_mut() {
        if t.kind == crate::db::TransactionKind::Eapp
            && t.reference_id == eapp.id
            && t.agent_id == user.0.id
        {
            t.status = "submitted".to_string();
            t.summary_en = format!("{} — Policy {}", insured_name, policy_no);
            t.summary_th = format!("{} — กรมธรรม์ {}", insured_name, policy_no);
            t.updated_at = now;
        }
    }

    Ok(Json(dto))
}
