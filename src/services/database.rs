use sqlx::{MySql, Pool};
use std::sync::Arc;

pub type DbPool = Arc<Pool<MySql>>;

/// 创建数据库连接池
pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    let pool = Pool::connect(database_url).await?;
    Ok(Arc::new(pool))
}

/// 检查数据库连接
pub async fn check_connection(pool: &DbPool) -> Result<bool, sqlx::Error> {
    sqlx::query("SELECT 1")
        .fetch_one(pool.as_ref())
        .await
        .map(|_| true)
        .map_err(|e| e)
}

/// 获取数据库统计信息
pub async fn get_database_stats(pool: &DbPool) -> Result<DatabaseStats, sqlx::Error> {
    let user_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(pool.as_ref())
        .await?;

    let student_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM students")
        .fetch_one(pool.as_ref())
        .await?;

    let job_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM jobs")
        .fetch_one(pool.as_ref())
        .await?;

    let interview_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM interview_sessions")
        .fetch_one(pool.as_ref())
        .await?;

    let report_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM career_reports")
        .fetch_one(pool.as_ref())
        .await?;

    Ok(DatabaseStats {
        user_count,
        student_count,
        job_count,
        interview_count,
        report_count,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DatabaseStats {
    pub user_count: i64,
    pub student_count: i64,
    pub job_count: i64,
    pub interview_count: i64,
    pub report_count: i64,
}