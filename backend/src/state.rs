use crate::db::Db;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Mutex<Db>>,
    pub sessions: Arc<Mutex<HashMap<String, Uuid>>>,
    pub config: Arc<Config>,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub admin_secret: String,
    pub cors_origin: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            admin_secret: std::env::var("ADMIN_SECRET")
                .unwrap_or_else(|_| "dev-admin-secret".to_string()),
            cors_origin: std::env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
        }
    }
}

impl AppState {
    pub fn new_seeded() -> Self {
        let db = crate::seed::seed();
        Self {
            db: Arc::new(Mutex::new(db)),
            sessions: Arc::new(Mutex::new(HashMap::new())),
            config: Arc::new(Config::default()),
        }
    }

    /// Async reseed (used by /api/admin/reset). Clears sessions too.
    pub async fn reseed_async(&self) {
        let fresh = crate::seed::seed();
        {
            let mut db = self.db.lock().await;
            *db = fresh;
        }
        let mut sessions = self.sessions.lock().await;
        sessions.clear();
    }
}
