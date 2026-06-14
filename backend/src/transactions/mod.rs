use axum::extract::{Query, State};
use axum::response::IntoResponse;
use axum::Json;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;

use crate::auth::AuthUser;
use crate::db::TransactionKind;
use crate::error::ApiError;
use crate::state::AppState;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new().routes(utoipa_axum::routes!(list_transactions))
}

#[derive(Debug, Deserialize)]
pub struct TransactionFilter {
    pub kind: Option<Vec<TransactionKind>>,
    pub status: Option<Vec<String>>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct TransactionPage {
    pub items: Vec<crate::db::Transaction>,
    pub total: usize,
    pub page: u32,
    pub page_size: u32,
}

/// List the current agent's transaction history with optional filters.
#[utoipa::path(
    get,
    path = "/api/transactions",
    params(
        ("kind" = Option<Vec<TransactionKind>>, Query, description = "Filter by kind (repeatable)"),
        ("status" = Option<Vec<String>>, Query, description = "Filter by status (repeatable)"),
        ("search" = Option<String>, Query, description = "Search title/summary"),
        ("page" = Option<u32>, Query),
        ("page_size" = Option<u32>, Query),
    ),
    responses((status = 200, body = TransactionPage)),
    security(("bearerAuth" = []), ("cookieAuth" = [])),
    tag = "Transactions"
)]
async fn list_transactions(
    State(state): State<AppState>,
    user: AuthUser,
    Query(filter): Query<TransactionFilter>,
) -> Result<impl IntoResponse, ApiError> {
    let db = state.db.lock().await;
    let search = filter.search.as_deref().unwrap_or("").to_lowercase();

    let mut items: Vec<&crate::db::Transaction> = db
        .transactions
        .iter()
        .filter(|t| t.agent_id == user.0.id)
        .filter(|t| {
            filter
                .kind
                .as_ref()
                .is_none_or(|k| k.contains(&t.kind))
        })
        .filter(|t| {
            filter
                .status
                .as_ref()
                .is_none_or(|s| s.iter().any(|ss| ss == &t.status))
        })
        .filter(|t| {
            if search.is_empty() {
                true
            } else {
                t.title_en.to_lowercase().contains(&search)
                    || t.title_th.to_lowercase().contains(&search)
                    || t.summary_en.to_lowercase().contains(&search)
                    || t.summary_th.to_lowercase().contains(&search)
                    || t.reference_id.to_string().contains(&search)
            }
        })
        .collect();

    // Sort by updated_at desc.
    items.sort_by_key(|b| std::cmp::Reverse(b.updated_at));

    let total = items.len();
    let page = filter.page.unwrap_or(1).max(1);
    let page_size = filter.page_size.unwrap_or(20).clamp(1, 100);
    let start = ((page - 1) as usize) * (page_size as usize);
    let paged: Vec<crate::db::Transaction> = items
        .into_iter()
        .skip(start)
        .take(page_size as usize)
        .cloned()
        .collect();

    Ok(Json(TransactionPage {
        items: paged,
        total,
        page,
        page_size,
    }))
}
