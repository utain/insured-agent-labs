use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::{Datelike, Utc};
use serde::Deserialize;
use utoipa_axum::router::OpenApiRouter;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::db::{Modal, Quotation, QuotationStatus, RiderSelection, ScenarioFlag};
use crate::error::{ApiError, FieldError};
use crate::quotations::calc;
use crate::quotations::dto::{CreateQuotationRequest, QuotationDto, UpdateQuotationRequest};
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(list_quotations))
        .routes(utoipa_axum::routes!(create_quotation))
        .routes(utoipa_axum::routes!(get_quotation))
        .routes(utoipa_axum::routes!(update_quotation))
        .routes(utoipa_axum::routes!(calculate_quotation))
        .routes(utoipa_axum::routes!(finalize_quotation))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub status: Option<Vec<QuotationStatus>>,
}

/// List the current agent's quotations, optionally filtered by status.
#[utoipa::path(
    get,
    path = "/api/quotations",
    params(("status" = Option<Vec<QuotationStatus>>, Query, description = "Filter by status (repeatable)")),
    responses((status = 200, body = [QuotationDto])),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Quotations"
)]
async fn list_quotations(
    State(state): State<AppState>,
    user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let list: Vec<QuotationDto> = db
        .quotations
        .values()
        .filter(|qq| qq.agent_id == user.0.id)
        .filter(|qq| q.status.as_ref().is_none_or(|s| s.contains(&qq.status)))
        .cloned()
        .map(QuotationDto::from)
        .collect();
    Ok(Json(list))
}

/// Create a draft quotation from a lead + base product.
#[utoipa::path(
    post,
    path = "/api/quotations",
    request_body = CreateQuotationRequest,
    responses(
        (status = 201, body = QuotationDto),
        (status = 404, description = "Lead not found", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Quotations"
)]
async fn create_quotation(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<CreateQuotationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let mut db = state.db.lock().await;
    let lead = db
        .leads
        .get(&req.lead_id)
        .filter(|l| l.agent_id == user.0.id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("lead {}", req.lead_id)))?;
    let product = db
        .products
        .iter()
        .find(|p| p.code == req.base_product_code)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("product {}", req.base_product_code)))?;

    let today = chrono::Local::now().date_naive();
    let age = today.year() - lead.dob.year();

    let now = Utc::now();
    let q = Quotation {
        id: Uuid::new_v4(),
        lead_id: lead.id,
        agent_id: user.0.id,
        base_product_code: product.code,
        insured_name: lead.full_name,
        insured_age: age,
        sum_assured: product.min_sum_assured,
        term: product.term_options.first().copied().unwrap_or(10),
        modal: Modal::Annual,
        riders: vec![],
        calc: None,
        status: QuotationStatus::Draft,
        valid_until: None,
        created_at: now,
        updated_at: now,
    };
    let dto = QuotationDto::from(q.clone());
    db.quotations.insert(q.id, q.clone());

    // Create a dashboard transaction.
    db.transactions.push(crate::db::make_transaction(
        user.0.id,
        crate::db::TransactionKind::Quotation,
        q.id,
        "Draft Quotation",
        "ใบเสนอราคาฉบับร่าง",
        &format!("{} — {}", dto.insured_name, dto.base_product_code),
        &format!("{} — {}", dto.insured_name, dto.base_product_code),
        "draft",
    ));

    // Update lead status to Quoted.
    if let Some(l) = db.leads.get_mut(&lead.id) {
        l.status = crate::db::LeadStatus::Quoted;
        l.updated_at = now;
    }

    Ok((StatusCode::CREATED, Json(dto)))
}

/// Get a single quotation.
#[utoipa::path(
    get,
    path = "/api/quotations/{id}",
    params(("id" = Uuid, Path)),
    responses(
        (status = 200, body = QuotationDto),
        (status = 404, body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Quotations"
)]
async fn get_quotation(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let q = db
        .quotations
        .get(&id)
        .filter(|q| q.agent_id == user.0.id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("quotation {id}")))?;
    Ok(Json(QuotationDto::from(q)))
}

/// Update a draft quotation (sum assured, term, modal, riders) and recompute the calc.
#[utoipa::path(
    put,
    path = "/api/quotations/{id}",
    params(("id" = Uuid, Path)),
    request_body = UpdateQuotationRequest,
    responses(
        (status = 200, body = QuotationDto),
        (status = 404, body = crate::error::ErrorEnvelope),
        (status = 409, description = "Not editable", body = crate::error::ErrorEnvelope),
        (status = 422, body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Quotations"
)]
async fn update_quotation(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateQuotationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Lock and read everything we need, then clone and release.
    let (mut q, product, rider_plans) = {
        let db = state.db.lock().await;
        let q = db
            .quotations
            .get(&id)
            .filter(|q| q.agent_id == user.0.id)
            .cloned()
            .ok_or_else(|| ApiError::NotFound(format!("quotation {id}")))?;
        if q.status != QuotationStatus::Draft {
            return Err(ApiError::Conflict("Quotation can only be edited while in Draft status".into()));
        }
        let product = db
            .products
            .iter()
            .find(|p| p.code == q.base_product_code)
            .cloned()
            .ok_or_else(|| ApiError::Server("product vanished".into()))?;
        let rider_plans: Vec<crate::db::CatalogRiderPlan> = db.riders.clone();
        (q, product, rider_plans)
    };

    // Apply field updates to our local clone.
    if let Some(sa) = req.sum_assured { q.sum_assured = sa; }
    if let Some(t) = req.term { q.term = t; }
    if let Some(m) = req.modal { q.modal = m; }
    if let Some(r) = req.riders { q.riders = r; }

    // Validate bounds against the product.
    let mut errs: Vec<FieldError> = Vec::new();
    if !(product.min_age..=product.max_age).contains(&q.insured_age) {
        errs.push(FieldError::new("sum_assured", "Insured age outside product bounds"));
    }
    if !(product.min_sum_assured..=product.max_sum_assured).contains(&q.sum_assured) {
        errs.push(FieldError::new("sum_assured", format!("Sum assured must be {}–{}", product.min_sum_assured, product.max_sum_assured)));
    }
    if !product.term_options.contains(&q.term) {
        errs.push(FieldError::new("term", "Term not valid for this product"));
    }
    // Validate riders exist and are compatible.
    let mut rider_pairs: Vec<(&crate::db::CatalogRiderPlan, &RiderSelection)> = Vec::new();
    for sel in &q.riders {
        let plan = rider_plans.iter().find(|r| r.code == sel.code);
        match plan {
            Some(p) => {
                if !(p.min_age..=p.max_age).contains(&q.insured_age) {
                    errs.push(FieldError::new("riders", format!("Rider {} not available at insured age", sel.code)));
                }
                rider_pairs.push((p, sel));
            }
            None => errs.push(FieldError::new("riders", format!("Unknown rider code: {}", sel.code))),
        }
    }
    if !errs.is_empty() {
        return Err(ApiError::Validation { fields: errs });
    }

    // Recompute calc (with scenario flag).
    let bug_inflate = user.0.scenario_flag == ScenarioFlag::Bug;
    q.calc = Some(calc::calculate(&product, &rider_pairs, q.insured_age, q.sum_assured, q.term, q.modal, bug_inflate));
    q.updated_at = Utc::now();

    // Persist back.
    {
        let mut db = state.db.lock().await;
        db.quotations.insert(q.id, q.clone());
    }
    Ok(Json(QuotationDto::from(q)))
}

/// Preview the premium calculation without persisting changes.
#[utoipa::path(
    post,
    path = "/api/quotations/{id}/calculate",
    params(("id" = Uuid, Path)),
    responses(
        (status = 200, body = crate::db::QuotationCalc),
        (status = 404, body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Quotations"
)]
async fn calculate_quotation(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    // Glitch scenario: add an artificial delay (3s) BEFORE acquiring the lock.
    if user.0.scenario_flag == ScenarioFlag::Glitch {
        tokio::time::sleep(std::time::Duration::from_millis(3000)).await;
    }

    let db = state.db.lock().await;
    let q = db
        .quotations
        .get(&id)
        .filter(|q| q.agent_id == user.0.id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("quotation {id}")))?;
    let product = db
        .products
        .iter()
        .find(|p| p.code == q.base_product_code)
        .cloned()
        .ok_or_else(|| ApiError::Server("product vanished".into()))?;
    let rider_plans: Vec<crate::db::CatalogRiderPlan> = q
        .riders
        .iter()
        .filter_map(|sel| db.riders.iter().find(|r| r.code == sel.code).cloned())
        .collect();
    let rider_refs: Vec<(&crate::db::CatalogRiderPlan, &RiderSelection)> = rider_plans
        .iter()
        .zip(&q.riders)
        .collect();
    let bug_inflate = user.0.scenario_flag == ScenarioFlag::Bug;

    let calc_result = calc::calculate(&product, &rider_refs, q.insured_age, q.sum_assured, q.term, q.modal, bug_inflate);
    Ok(Json(calc_result))
}

/// Finalize a draft → quoted. Sets valid_until = now + 30 days.
#[utoipa::path(
    post,
    path = "/api/quotations/{id}/finalize",
    params(("id" = Uuid, Path)),
    responses(
        (status = 200, body = QuotationDto),
        (status = 404, body = crate::error::ErrorEnvelope),
        (status = 409, description = "Not in draft status", body = crate::error::ErrorEnvelope),
        (status = 500, description = "Error scenario", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Quotations"
)]
async fn finalize_quotation(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let mut db = state.db.lock().await;
    {
        let q = db
            .quotations
            .get_mut(&id)
            .filter(|q| q.agent_id == user.0.id)
            .ok_or_else(|| ApiError::NotFound(format!("quotation {id}")))?;
        if q.status != QuotationStatus::Draft {
            return Err(ApiError::Conflict("Quotation already finalized".into()));
        }

        // Error scenario: return 500 on finalize.
        if user.0.scenario_flag == ScenarioFlag::Error {
            return Err(ApiError::Server(
                "Internal error during finalize (error scenario)".into(),
            ));
        }

        q.status = QuotationStatus::Quoted;
        q.valid_until = Some(Utc::now() + chrono::Duration::days(30));
        q.updated_at = Utc::now();
    }

    // Update dashboard transaction status to quoted.
    for t in db.transactions.iter_mut() {
        if t.kind == crate::db::TransactionKind::Quotation
            && t.reference_id == id
            && t.agent_id == user.0.id
        {
            t.status = "quoted".to_string();
            t.updated_at = crate::db::now();
        }
    }

    let q = db
        .quotations
        .get(&id)
        .filter(|q| q.agent_id == user.0.id)
        .ok_or_else(|| ApiError::NotFound(format!("quotation {id}")))?;
    Ok(Json(QuotationDto::from(q.clone())))
}
