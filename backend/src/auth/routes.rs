use axum::extract::State;
use axum::http::header::SET_COOKIE;
use axum::http::HeaderValue;
use axum::response::IntoResponse;
use axum::Json;
use uuid::Uuid;
use utoipa_axum::router::OpenApiRouter;

use crate::auth::{AuthUser, LoginRequest, LoginResponse, UserDto};
use crate::db::ScenarioFlag;
use crate::error::ApiError;
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new()
        .routes(utoipa_axum::routes!(login))
        .routes(utoipa_axum::routes!(logout))
        .routes(utoipa_axum::routes!(me))
}

/// Authenticate with username + password. Returns an opaque token and sets a `session` cookie.
#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, body = LoginResponse, description = "Login successful"),
        (status = 401, description = "Invalid credentials", body = crate::error::ErrorEnvelope),
        (status = 423, description = "Account locked", body = crate::error::ErrorEnvelope),
    ),
    tag = "Auth"
)]
async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user = {
        let db = state.db.lock().await;
        let id = db.users_by_username.get(&req.username).copied();
        id.and_then(|id| db.users.get(&id).cloned())
    };
    let user = match user {
        Some(u) => u,
        None => {
            return Err(ApiError::Unauthorized);
        }
    };
    if user.password != req.password {
        return Err(ApiError::Unauthorized);
    }
    if user.scenario_flag == ScenarioFlag::Locked {
        return Err(ApiError::Locked);
    }
    let token = Uuid::new_v4().to_string();
    {
        let mut sessions = state.sessions.lock().await;
        sessions.insert(token.clone(), user.id);
    }
    let cookie = format!(
        "session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400"
    );
    let mut resp = Json(LoginResponse {
        token,
        user: UserDto::from(&user),
    })
    .into_response();
    resp.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str(&cookie).unwrap(),
    );
    Ok(resp)
}

/// End the current session.
#[utoipa::path(
    post,
    path = "/api/auth/logout",
    responses(
        (status = 204, description = "Logged out"),
        (status = 401, description = "Not authenticated", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Auth"
)]
async fn logout(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<impl IntoResponse, ApiError> {
    let uid = user.0.id;
    let mut sessions = state.sessions.lock().await;
    sessions.retain(|_, v| *v != uid);
    let mut resp = axum::http::StatusCode::NO_CONTENT.into_response();
    resp.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str("session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0").unwrap(),
    );
    Ok(resp)
}

/// Get the currently authenticated user.
#[utoipa::path(
    get,
    path = "/api/auth/me",
    responses(
        (status = 200, body = UserDto, description = "Current user"),
        (status = 401, description = "Not authenticated", body = crate::error::ErrorEnvelope),
    ),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Auth"
)]
async fn me(user: AuthUser) -> Result<impl IntoResponse, ApiError> {
    Ok(Json(UserDto::from(&user.0)))
}
