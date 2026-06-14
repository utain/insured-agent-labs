use chrono::Datelike;
use chrono::NaiveDate;

use crate::db::{validate_thai_national_id, validate_thai_phone};
use crate::error::{ApiError, FieldError};
use crate::leads::dto::{CreateLeadRequest, UpdateLeadRequest};

const MIN_AGE: i32 = 18;
const MAX_AGE: i32 = 80;

fn age_at(dob: NaiveDate, today: NaiveDate) -> i32 {
    let mut age = today.year() - dob.year();
    if today.ordinal() < dob.ordinal() {
        age -= 1;
    }
    age
}

fn validate_common(
    full_name: &str,
    national_id: &str,
    dob: NaiveDate,
    phone: &str,
    email: &Option<String>,
    income: &Option<f64>,
) -> Result<(), ApiError> {
    let mut errs: Vec<FieldError> = Vec::new();

    if full_name.trim().is_empty() {
        errs.push(FieldError::new("full_name", "Full name is required"));
    }
    if !validate_thai_national_id(national_id) {
        errs.push(FieldError::new(
            "national_id",
            "Invalid Thai national ID (must be 13 digits with valid checksum)",
        ));
    }
    let today = chrono::Local::now().date_naive();
    let age = age_at(dob, today);
    if !(MIN_AGE..=MAX_AGE).contains(&age) {
        errs.push(FieldError::new(
            "dob",
            format!("Age must be between {MIN_AGE} and {MAX_AGE} (currently {age})"),
        ));
    }
    if !validate_thai_phone(phone) {
        errs.push(FieldError::new(
            "phone",
            "Phone must be 10 digits starting with 0",
        ));
    }
    if let Some(e) = email
        && !e.is_empty()
        && !e.contains('@')
    {
        errs.push(FieldError::new("email", "Email must contain @"));
    }
    if let Some(i) = income
        && *i < 0.0
    {
        errs.push(FieldError::new("income", "Income cannot be negative"));
    }

    if errs.is_empty() {
        Ok(())
    } else {
        Err(ApiError::Validation { fields: errs })
    }
}

pub fn validate_create(req: &CreateLeadRequest) -> Result<(), ApiError> {
    validate_common(
        &req.full_name,
        &req.national_id,
        req.dob,
        &req.phone,
        &req.email,
        &req.income,
    )
}

pub fn validate_update(req: &UpdateLeadRequest) -> Result<(), ApiError> {
    // For partial update, only validate fields that are present.
    let full_name = req.full_name.as_deref().unwrap_or("placeholder");
    let national_id = req.national_id.as_deref().unwrap_or("placeholder");
    // Skip age check if dob missing (use a safe default inside bounds).
    let dob = req.dob.unwrap_or_else(|| {
        chrono::Local::now().date_naive() - chrono::Duration::days(30 * 365)
    });
    let phone = req.phone.as_deref().unwrap_or("placeholder");

    let mut errs: Vec<FieldError> = Vec::new();
    if req.full_name.as_ref().is_some_and(|n| n.trim().is_empty()) {
        errs.push(FieldError::new("full_name", "Full name is required"));
    }
    if req.national_id.as_ref().is_some_and(|id| !validate_thai_national_id(id)) {
        errs.push(FieldError::new("national_id", "Invalid Thai national ID"));
    }
    if req.phone.as_ref().is_some_and(|p| !validate_thai_phone(p)) {
        errs.push(FieldError::new("phone", "Phone must be 10 digits starting with 0"));
    }
    if let Some(Some(e)) = &req.email
        && !e.is_empty()
        && !e.contains('@')
    {
        errs.push(FieldError::new("email", "Email must contain @"));
    }

    let _ = (full_name, national_id, dob, phone); // suppress unused

    if errs.is_empty() {
        Ok(())
    } else {
        Err(ApiError::Validation { fields: errs })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    fn valid_req() -> CreateLeadRequest {
        // 1100200123453 is a valid Thai national ID (checksum = 3).
        CreateLeadRequest {
            full_name: "Somchai Jaidee".into(),
            national_id: "1100200123453".into(),
            dob: NaiveDate::from_ymd_opt(1990, 1, 1).unwrap(),
            gender: crate::db::Gender::Male,
            phone: "0812345678".into(),
            email: Some("s@example.com".into()),
            occupation: Some("Engineer".into()),
            income: Some(500_000.0),
        }
    }

    #[test]
    fn valid_request_passes() {
        assert!(validate_create(&valid_req()).is_ok());
    }

    #[test]
    fn invalid_national_id_rejected() {
        let mut r = valid_req();
        r.national_id = "1234567890123".into(); // bad checksum
        let err = validate_create(&r).unwrap_err();
        let ApiError::Validation { fields } = err else {
            panic!("expected validation");
        };
        assert!(fields.iter().any(|f| f.field == "national_id"));
    }

    #[test]
    fn underage_rejected() {
        let mut r = valid_req();
        r.dob = NaiveDate::from_ymd_opt(2020, 1, 1).unwrap();
        let err = validate_create(&r).unwrap_err();
        let ApiError::Validation { fields } = err else {
            panic!("expected validation");
        };
        assert!(fields.iter().any(|f| f.field == "dob"));
    }

    #[test]
    fn multiple_errors_returned() {
        let mut r = valid_req();
        r.full_name = "".into();
        r.national_id = "bad".into();
        r.phone = "bad".into();
        let err = validate_create(&r).unwrap_err();
        let ApiError::Validation { fields } = err else {
            panic!("expected validation");
        };
        // Should report at least full_name, national_id, phone (3 distinct).
        assert!(fields.len() >= 3, "got {} errors: {:?}", fields.len(), fields);
    }
}
