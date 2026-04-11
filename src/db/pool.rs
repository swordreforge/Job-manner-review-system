use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use std::time::Duration;

pub async fn create_pool(database_url: &str) -> anyhow::Result<MySqlPool> {
    let pool = MySqlPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(30))
        .connect(database_url)
        .await?;

    Ok(pool)
}