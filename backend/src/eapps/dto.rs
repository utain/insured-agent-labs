use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::db::{Beneficiary, EAppStatus, EApplication, HealthDeclaration};

// ===== DTOs =====

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct EAppDto {
    pub id: Uuid,
    pub quotation_id: Uuid,
    pub lead_id: Uuid,
    pub agent_id: Uuid,
    pub beneficiaries: Vec<Beneficiary>,
    pub health_declarations: Vec<HealthDeclaration>,
    pub payment_id: Option<Uuid>,
    pub status: EAppStatus,
    pub submitted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub policy_number: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<EApplication> for EAppDto {
    fn from(e: EApplication) -> Self {
        Self {
            id: e.id,
            quotation_id: e.quotation_id,
            lead_id: e.lead_id,
            agent_id: e.agent_id,
            beneficiaries: e.beneficiaries,
            health_declarations: e.health_declarations,
            payment_id: e.payment_id,
            status: e.status,
            submitted_at: e.submitted_at,
            policy_number: e.policy_number,
            created_at: e.created_at,
            updated_at: e.updated_at,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateEAppRequest {
    pub quotation_id: Uuid,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateEAppRequest {
    #[serde(default)]
    pub beneficiaries: Option<Vec<Beneficiary>>,
    #[serde(default)]
    pub health_declarations: Option<Vec<HealthDeclaration>>,
}
