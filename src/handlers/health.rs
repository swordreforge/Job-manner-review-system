use actix_web::{web, HttpResponse, Responder};
use serde::Serialize;
use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub database: String,
    pub version: String,
}

pub async fn health_check(state: web::Data<AppState>) -> impl Responder {
    let db_status = match sqlx::query("SELECT 1")
        .fetch_one(state.db())
        .await
    {
        Ok(_) => "connected".to_string(),
        Err(_) => "disconnected".to_string(),
    };

    let response = HealthResponse {
        status: "ok".to_string(),
        database: db_status,
        version: env!("CARGO_PKG_VERSION").to_string(),
    };

    HttpResponse::Ok().json(response)
}