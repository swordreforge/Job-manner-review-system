use crate::services::{get_system_metrics, DbPool};
use crate::templates::DashboardTemplate;
use axum::extract::State;

/// 首页 - 系统监控仪表板
pub async fn dashboard_index(State(pool): State<DbPool>) -> DashboardTemplate {
    let metrics = get_system_metrics(&pool).await;

    DashboardTemplate::from_metrics(
        metrics.database_connected,
        metrics.database_stats,
        metrics.cpu_cores,
        metrics.memory_usage_mb,
        metrics.uptime_seconds,
    )
}