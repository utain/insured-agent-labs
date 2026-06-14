use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::db::{Modal, QuotationCalc, QuotationStatus, RiderSelection};

// ===== DTOs =====

#[derive(Debug, Serialize, ToSchema)]
pub struct QuotationDto {
    pub id: Uuid,
    pub lead_id: Uuid,
    pub agent_id: Uuid,
    pub base_product_code: String,
    pub insured_name: String,
    pub insured_age: i32,
    pub sum_assured: u64,
    pub term: i32,
    pub modal: Modal,
    pub riders: Vec<RiderSelection>,
    pub calc: Option<QuotationCalc>,
    pub status: QuotationStatus,
    pub valid_until: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<crate::db::Quotation> for QuotationDto {
    fn from(q: crate::db::Quotation) -> Self {
        Self {
            id: q.id,
            lead_id: q.lead_id,
            agent_id: q.agent_id,
            base_product_code: q.base_product_code,
            insured_name: q.insured_name,
            insured_age: q.insured_age,
            sum_assured: q.sum_assured,
            term: q.term,
            modal: q.modal,
            riders: q.riders,
            calc: q.calc,
            status: q.status,
            valid_until: q.valid_until,
            created_at: q.created_at,
            updated_at: q.updated_at,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateQuotationRequest {
    pub lead_id: Uuid,
    pub base_product_code: String,
}

#[derive(Debug, Deserialize, ToSchema, Default)]
pub struct UpdateQuotationRequest {
    pub sum_assured: Option<u64>,
    pub term: Option<i32>,
    pub modal: Option<Modal>,
    pub riders: Option<Vec<RiderSelection>>,
}
