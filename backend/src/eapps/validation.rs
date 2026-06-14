use crate::db::{Beneficiary, HealthDeclaration};
use crate::db::validate_thai_national_id;
use crate::error::{ApiError, FieldError};

/// Validate beneficiaries + health declarations for an e-application.
pub fn validate(beneficiaries: &[Beneficiary], health: &[HealthDeclaration]) -> Result<(), ApiError> {
    let mut errs: Vec<FieldError> = Vec::new();

    // Beneficiaries: at least 1, total share == 100, valid IDs.
    if beneficiaries.is_empty() {
        errs.push(FieldError::new("beneficiaries", "At least one beneficiary is required"));
    } else {
        let total: f64 = beneficiaries.iter().map(|b| b.share_pct).sum();
        if (total - 100.0).abs() > 0.01 {
            errs.push(FieldError::new(
                "beneficiaries",
                format!("Beneficiary shares must total 100% (currently {total:.1}%)"),
            ));
        }
        for (i, b) in beneficiaries.iter().enumerate() {
            if b.name.trim().is_empty() {
                errs.push(FieldError::new(format!("beneficiary_{i}_name"), "Name is required"));
            }
            if b.relationship.trim().is_empty() {
                errs.push(FieldError::new(format!("beneficiary_{i}_relationship"), "Relationship is required"));
            }
            if !validate_thai_national_id(&b.national_id) {
                errs.push(FieldError::new(format!("beneficiary_{i}_national_id"), "Invalid Thai national ID"));
            }
            if b.share_pct <= 0.0 || b.share_pct > 100.0 {
                errs.push(FieldError::new(format!("beneficiary_{i}_share_pct"), "Share must be 1–100"));
            }
        }
    }

    // Health: every Yes answer requires non-empty details.
    for (i, h) in health.iter().enumerate() {
        if h.answer && h.details.as_ref().is_none_or(|d| d.trim().is_empty()) {
            errs.push(FieldError::new(
                format!("health_{i}_details"),
                "Details required when answer is Yes",
            ));
        }
    }

    if errs.is_empty() {
        Ok(())
    } else {
        Err(ApiError::Validation { fields: errs })
    }
}
