use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;
use utoipa::ToSchema;

/// Unified API error type. All handlers return `Result<T, ApiError>`.
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Forbidden")]
    Forbidden,
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Validation failed")]
    Validation { fields: Vec<FieldError> },
    #[error("Conflict: {0}")]
    Conflict(String),
    #[error("Account is locked. Contact administrator.")]
    Locked,
    #[error("Server error: {0}")]
    Server(String),
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct FieldError {
    pub field: String,
    pub message: String,
}

impl FieldError {
    pub fn new(field: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            field: field.into(),
            message: message.into(),
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorEnvelope {
    pub error: ErrorBody,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorBody {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<FieldError>>,
}

impl ApiError {
    fn parts(&self) -> (&'static str, StatusCode, String, Option<Vec<FieldError>>) {
        match self {
            ApiError::Unauthorized => ("unauthorized", StatusCode::UNAUTHORIZED, self.to_string(), None),
            ApiError::Forbidden => ("forbidden", StatusCode::FORBIDDEN, self.to_string(), None),
            ApiError::NotFound(m) => ("not_found", StatusCode::NOT_FOUND, m.clone(), None),
            ApiError::Validation { fields } => ("validation", StatusCode::UNPROCESSABLE_ENTITY, self.to_string(), Some(fields.clone())),
            ApiError::Conflict(m) => ("conflict", StatusCode::CONFLICT, m.clone(), None),
            ApiError::Locked => ("locked", StatusCode::LOCKED, self.to_string(), None),
            ApiError::Server(m) => ("server_error", StatusCode::INTERNAL_SERVER_ERROR, m.clone(), None),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (code, status, message, fields) = self.parts();
        let body = ErrorEnvelope {
            error: ErrorBody {
                code: code.to_string(),
                message,
                fields,
            },
        };
        (status, axum::Json(body)).into_response()
    }
}

/// Convenience for internal server errors from any error type.
impl From<anyhow::Error> for ApiError {
    fn from(e: anyhow::Error) -> Self {
        ApiError::Server(e.to_string())
    }
}
