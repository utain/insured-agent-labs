use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use utoipa_axum::router::OpenApiRouter;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::db::{Payment, PaymentStatus};
use crate::error::ApiError;
use crate::payments::dto::{CreatePaymentRequest, PaymentDto};
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(create_payment))
        .routes(utoipa_axum::routes!(get_payment))
}

/// Create a mock payment. Use `outcome` to simulate success/declined/pending.
#[utoipa::path(
    post,
    path = "/api/payments",
    request_body = CreatePaymentRequest,
    responses(
        (status = 201, body = PaymentDto),
        (status = 404, body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Payments"
)]
async fn create_payment(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<CreatePaymentRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let mut db = state.db.lock().await;
    let eapp = db
        .eapps
        .get(&req.eapp_id)
        .filter(|e| e.agent_id == user.0.id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("eapp {}", req.eapp_id)))?;

    // Amount = the quotation's modal premium (or annual if not set).
    let quotation = db
        .quotations
        .get(&eapp.quotation_id)
        .ok_or_else(|| ApiError::Server("quotation vanished".into()))?;
    let amount = quotation
        .calc
        .as_ref()
        .map(|c| c.modal_premium)
        .unwrap_or(0.0);

    let status = req.outcome.unwrap_or(PaymentStatus::Success);
    let now = Utc::now();
    let payment = Payment {
        id: Uuid::new_v4(),
        eapp_id: req.eapp_id,
        amount,
        method: req.method,
        status,
        transaction_ref: Uuid::new_v4().to_string(),
        created_at: now,
    };
    let dto = PaymentDto::from(payment.clone());
    db.payments.insert(payment.id, payment);

    // Link payment to the eapp.
    if let Some(e) = db.eapps.get_mut(&eapp.id) {
        e.payment_id = Some(dto.id);
        e.updated_at = now;
    }

    // Update quotation status to Paid on success.
    if status == PaymentStatus::Success
        && let Some(q) = db.quotations.get_mut(&eapp.quotation_id)
    {
        q.status = crate::db::QuotationStatus::Paid;
        q.updated_at = now;
    }

    // Update the eapp dashboard transaction status.
    let pay_status = status;
    for t in db.transactions.iter_mut() {
        if t.kind == crate::db::TransactionKind::Eapp
            && t.reference_id == req.eapp_id
            && t.agent_id == user.0.id
        {
            let label = match pay_status {
                PaymentStatus::Success => "paid",
                PaymentStatus::Declined => "payment_declined",
                PaymentStatus::Pending => "payment_pending",
            };
            t.status = label.to_string();
            t.updated_at = now;
        }
    }

    Ok((StatusCode::CREATED, Json(dto)))
}

/// Get a payment by ID.
#[utoipa::path(
    get,
    path = "/api/payments/{id}",
    params(("id" = Uuid, Path)),
    responses((status = 200, body = PaymentDto), (status = 404, body = crate::error::ErrorEnvelope)),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Payments"
)]
async fn get_payment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let payment = db
        .payments
        .get(&id)
        .filter(|p| {
            db.eapps
                .get(&p.eapp_id)
                .is_some_and(|e| e.agent_id == user.0.id)
        })
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("payment {id}")))?;
    Ok(Json(PaymentDto::from(payment)))
}
