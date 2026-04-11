use crate::services::{get_system_metrics, DbPool};
use axum::{extract::State, Json};

/// API - 获取系统指标
pub async fn api_system_metrics(State(pool): State<DbPool>) -> Json<crate::services::SystemMetrics> {
    let metrics = get_system_metrics(&pool).await;
    Json(metrics)
}