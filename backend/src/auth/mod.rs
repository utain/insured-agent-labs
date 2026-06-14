use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use axum::http::HeaderMap;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::db::{Role, ScenarioFlag, Locale, User};
use crate::error::ApiError;
use crate::state::AppState;

pub mod routes;

pub use routes::router;

// ===== DTOs =====

#[derive(Debug, Deserialize, ToSchema)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct UserDto {
    pub id: Uuid,
    pub username: String,
    pub display_name_en: String,
    pub display_name_th: String,
    pub role: Role,
    pub scenario_flag: ScenarioFlag,
    pub locale: Locale,
}

impl From<&User> for UserDto {
    fn from(u: &User) -> Self {
        Self {
            id: u.id,
            username: u.username.clone(),
            display_name_en: u.display_name_en.clone(),
            display_name_th: u.display_name_th.clone(),
            role: u.role,
            scenario_flag: u.scenario_flag,
            locale: u.locale,
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserDto,
}

// ===== Session helpers =====

/// Read token from "Authorization: Bearer <token>" or "Cookie: session=<token>".
pub fn extract_token(headers: &HeaderMap) -> Option<String> {
    let bearer = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.trim().to_string());
    if let Some(token) = bearer {
        return Some(token);
    }
    for cookie in headers.get_all(axum::http::header::COOKIE).iter() {
        if let Ok(s) = cookie.to_str() {
            for part in s.split(';') {
                if let Some(rest) = part.trim().strip_prefix("session=") {
                    return Some(rest.to_string());
                }
            }
        }
    }
    None
}

/// Axum extractor: resolves the authenticated user, or returns 401.
#[derive(Debug, Clone)]
pub struct AuthUser(pub User);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    AppState: axum::extract::FromRef<S>,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let token = extract_token(&parts.headers).ok_or(ApiError::Unauthorized)?;
        let user_id = {
            let sessions = app_state.sessions.lock().await;
            sessions.get(&token).copied()
        }
        .ok_or(ApiError::Unauthorized)?;
        let user = {
            let db = app_state.db.lock().await;
            db.users.get(&user_id).cloned()
        }
        .ok_or(ApiError::Unauthorized)?;
        Ok(AuthUser(user))
    }
}

/// Extractor requiring an admin role (or matching X-Admin-Secret).
#[derive(Debug, Clone)]
pub struct RequireAdmin;

impl<S> FromRequestParts<S> for RequireAdmin
where
    S: Send + Sync,
    AppState: axum::extract::FromRef<S>,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        // X-Admin-Secret shortcut
        if let Some(secret) = parts.headers.get("x-admin-secret")
            && let Ok(s) = secret.to_str()
            && s == app_state.config.admin_secret
        {
            return Ok(RequireAdmin);
        }
        // Otherwise require an authed admin user
        let AuthUser(user) = AuthUser::from_request_parts(parts, state).await?;
        if user.role == Role::Admin {
            Ok(RequireAdmin)
        } else {
            Err(ApiError::Forbidden)
        }
    }
}
