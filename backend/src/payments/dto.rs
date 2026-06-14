use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::db::{Payment, PaymentMethod, PaymentStatus};

#[derive(Debug, Serialize, ToSchema)]
pub struct PaymentDto {
    pub id: Uuid,
    pub eapp_id: Uuid,
    pub amount: f64,
    pub method: PaymentMethod,
    pub status: PaymentStatus,
    pub transaction_ref: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<Payment> for PaymentDto {
    fn from(p: Payment) -> Self {
        Self {
            id: p.id,
            eapp_id: p.eapp_id,
            amount: p.amount,
            method: p.method,
            status: p.status,
            transaction_ref: p.transaction_ref,
            created_at: p.created_at,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreatePaymentRequest {
    pub eapp_id: Uuid,
    pub method: PaymentMethod,
    /// Mock gateway lever for QA branching: "success" | "declined" | "pending".
    /// If omitted, defaults to Success.
    pub outcome: Option<PaymentStatus>,
}
