use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::error::FieldError;

// ===== Enums =====

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Agent,
    Admin,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum ScenarioFlag {
    Standard,
    Locked,
    Glitch,
    Bug,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Locale {
    En,
    Th,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Gender {
    Male,
    Female,
    Other,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum LeadStatus {
    New,
    Contacted,
    Quoted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum QuotationStatus {
    Draft,
    Quoted,
    Eapp,
    Paid,
    Submitted,
    Expired,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum EAppStatus {
    Created,
    Submitted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum PaymentStatus {
    Success,
    Declined,
    Pending,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum PaymentMethod {
    Card,
    BankTransfer,
    PromptPay,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Modal {
    Annual,
    Semi,
    Quarterly,
    Monthly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum RiderType {
    Health,
    Ci,
    Pa,
    Tpd,
    Wp,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum TransactionKind {
    Lead,
    Quotation,
    Eapp,
    Payment,
    Policy,
}

// ===== Entities =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub password: String, // plaintext — training fixture only
    pub display_name_en: String,
    pub display_name_th: String,
    pub role: Role,
    pub scenario_flag: ScenarioFlag,
    pub locale: Locale,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Lead {
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
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RiderSelection {
    pub code: String,
    pub sum_assured: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct QuotationCalc {
    pub base_premium: f64,
    pub rider_premiums: Vec<RiderPremium>,
    pub total_annual_premium: f64,
    pub modal_premium: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RiderPremium {
    pub code: String,
    pub premium: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Quotation {
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
    pub valid_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Beneficiary {
    pub name: String,
    pub relationship: String,
    pub national_id: String,
    pub share_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct HealthDeclaration {
    pub question_id: String,
    pub answer: bool, // true = Yes
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct EApplication {
    pub id: Uuid,
    pub quotation_id: Uuid,
    pub lead_id: Uuid,
    pub agent_id: Uuid,
    pub beneficiaries: Vec<Beneficiary>,
    pub health_declarations: Vec<HealthDeclaration>,
    pub payment_id: Option<Uuid>,
    pub status: EAppStatus,
    pub submitted_at: Option<DateTime<Utc>>,
    pub policy_number: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Payment {
    pub id: Uuid,
    pub eapp_id: Uuid,
    pub amount: f64,
    pub method: PaymentMethod,
    pub status: PaymentStatus,
    pub transaction_ref: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Transaction {
    pub id: Uuid,
    pub agent_id: Uuid,
    pub kind: TransactionKind,
    pub reference_id: Uuid,
    pub title_en: String,
    pub title_th: String,
    pub summary_en: String,
    pub summary_th: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ===== Catalog (static) =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CatalogProduct {
    pub code: String,
    pub name_en: String,
    pub name_th: String,
    pub description_en: String,
    pub description_th: String,
    pub min_age: i32,
    pub max_age: i32,
    pub min_sum_assured: u64,
    pub max_sum_assured: u64,
    pub term_options: Vec<i32>,
    /// Per-age base annual rate (premium per 1000 sum assured).
    pub rate_per_thousand: Vec<(i32, f64)>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CatalogRiderPlan {
    pub code: String,
    pub rider_type: RiderType,
    pub name_en: String,
    pub name_th: String,
    pub min_age: i32,
    pub max_age: i32,
    pub sum_assured_options: Vec<u64>,
    /// Flat annual premium, or per-thousand rate table.
    pub flat_premium: Option<f64>,
    pub rate_per_thousand: Option<Vec<(i32, f64)>>,
}

// ===== In-memory DB =====

#[derive(Debug, Default)]
pub struct Db {
    pub users: HashMap<Uuid, User>,
    pub users_by_username: HashMap<String, Uuid>,
    pub leads: HashMap<Uuid, Lead>,
    pub quotations: HashMap<Uuid, Quotation>,
    pub eapps: HashMap<Uuid, EApplication>,
    pub payments: HashMap<Uuid, Payment>,
    pub transactions: Vec<Transaction>,
    pub products: Vec<CatalogProduct>,
    pub riders: Vec<CatalogRiderPlan>,
}

impl Db {
    pub fn new() -> Self {
        Self::default()
    }
}

// AppState and Config live in crate::state to keep this module focused on data.

// ===== Shared validation helpers =====

/// Validate a Thai national ID (13 digits, checksum-valid).
/// Algorithm: sum of digit[i] * weight[i] for i=0..11, weight = (i%12)+1;
/// remainder = sum % 11; check = (11 - (sum % 11)) % 10; must equal digit[12].
pub fn validate_thai_national_id(id: &str) -> bool {
    if id.len() != 13 || !id.chars().all(|c| c.is_ascii_digit()) {
        return false;
    }
    let digits: Vec<u32> = id.chars().map(|c| c.to_digit(10).unwrap()).collect();
    let sum: u32 = digits
        .iter()
        .take(12)
        .enumerate()
        .map(|(i, d)| d * ((i as u32) % 12 + 1))
        .sum();
    let check = (11 - (sum % 11)) % 10;
    digits[12] == check
}

/// Validate a Thai phone number: 10 digits, starts with 0.
pub fn validate_thai_phone(phone: &str) -> bool {
    phone.len() == 10
        && phone.starts_with('0')
        && phone.chars().all(|c| c.is_ascii_digit())
}

/// Collect multiple field errors into a single ApiError::Validation.
pub fn validation_error(errors: Vec<FieldError>) -> crate::error::ApiError {
    crate::error::ApiError::Validation { fields: errors }
}

pub fn now() -> DateTime<Utc> {
    Utc::now()
}

/// Create a Transaction record for the dashboard. Returns the transaction to insert.
#[allow(clippy::too_many_arguments)]
pub fn make_transaction(
    agent_id: Uuid,
    kind: TransactionKind,
    reference_id: Uuid,
    title_en: &str,
    title_th: &str,
    summary_en: &str,
    summary_th: &str,
    status: &str,
) -> Transaction {
    let now = now();
    Transaction {
        id: Uuid::new_v4(),
        agent_id,
        kind,
        reference_id,
        title_en: title_en.to_string(),
        title_th: title_th.to_string(),
        summary_en: summary_en.to_string(),
        summary_th: summary_th.to_string(),
        status: status.to_string(),
        created_at: now,
        updated_at: now,
    }
}
