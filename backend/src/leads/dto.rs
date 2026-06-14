use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::db::{Gender, Lead, LeadStatus};

// ===== DTOs =====

#[derive(Debug, Serialize, ToSchema)]
pub struct LeadDto {
    pub id: Uuid,
    pub agent_id: Uuid,
    pub full_name: String,
    pub national_id: String,
    pub dob: chrono::NaiveDate,
    pub gender: Gender,
    pub phone: String,
    pub email: Option<String>,
    pub occupation: Option<String>,
    pub income: Option<f64>,
    pub status: LeadStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<Lead> for LeadDto {
    fn from(l: Lead) -> Self {
        Self {
            id: l.id,
            agent_id: l.agent_id,
            full_name: l.full_name,
            national_id: l.national_id,
            dob: l.dob,
            gender: l.gender,
            phone: l.phone,
            email: l.email,
            occupation: l.occupation,
            income: l.income,
            status: l.status,
            created_at: l.created_at,
            updated_at: l.updated_at,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateLeadRequest {
    pub full_name: String,
    pub national_id: String,
    pub dob: chrono::NaiveDate,
    pub gender: Gender,
    pub phone: String,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub occupation: Option<String>,
    #[serde(default)]
    pub income: Option<f64>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateLeadRequest {
    pub full_name: Option<String>,
    pub national_id: Option<String>,
    pub dob: Option<chrono::NaiveDate>,
    pub gender: Option<Gender>,
    pub phone: Option<String>,
    pub email: Option<Option<String>>,
    pub occupation: Option<Option<String>>,
    pub income: Option<Option<f64>>,
}

// Strip a DTO back to the entity fields (for create/update).
pub fn lead_from_create(req: CreateLeadRequest, agent_id: Uuid) -> Lead {
    let now = crate::db::now();
    Lead {
        id: Uuid::new_v4(),
        agent_id,
        full_name: req.full_name,
        national_id: req.national_id,
        dob: req.dob,
        gender: req.gender,
        phone: req.phone,
        email: req.email,
        occupation: req.occupation,
        income: req.income,
        status: LeadStatus::New,
        created_at: now,
        updated_at: now,
    }
}
