use crate::services::{get_all_jobs, DbPool};
use crate::templates::JobsTemplate;
use axum::extract::State;

/// 职位管理页面
pub async fn jobs_index(State(pool): State<DbPool>) -> JobsTemplate {
    let jobs = get_all_jobs(&pool).await.unwrap_or_default();
    JobsTemplate::new(jobs)
}