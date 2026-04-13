use sqlx::mysql::MySqlPoolOptions;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{MySqlPool, SqlitePool};
use std::time::Duration;

/// 创建 MySQL 连接池（用于管理功能）
pub async fn create_mysql_pool(database_url: &str) -> anyhow::Result<MySqlPool> {
    let pool = MySqlPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(30))
        .connect(database_url)
        .await?;

    Ok(pool)
}

/// 创建 SQLite 连接池（用于登录功能）
pub async fn create_sqlite_pool(database_url: &str) -> anyhow::Result<SqlitePool> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(30))
        .connect(database_url)
        .await?;

    Ok(pool)
}

/// 兼容性函数：创建连接池（默认为 MySQL）
#[allow(dead_code)]
#[deprecated(note = "请使用 create_mysql_pool 或 create_sqlite_pool 替代")]
pub async fn create_pool(database_url: &str) -> anyhow::Result<MySqlPool> {
    create_mysql_pool(database_url).await
}