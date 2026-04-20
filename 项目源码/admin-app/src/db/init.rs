use sqlx::SqlitePool;
use anyhow::Result;
use uuid::Uuid;
use bcrypt::hash;
use bcrypt::DEFAULT_COST;

/// 初始化 SQLite 数据库
pub async fn init_sqlite_database(pool: &SqlitePool) -> Result<()> {
    log::info!("开始初始化 SQLite 数据库...");

    // 创建用户表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'teacher',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#
    )
    .execute(pool)
    .await?;

    // 创建索引
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_username ON users(username)
        "#
    )
    .execute(pool)
    .await?;

    // 插入默认管理员用户 (密码: admin123)
    let admin_password_hash = hash("admin123", DEFAULT_COST)?;
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO users (id, username, password_hash, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        "#
    )
    .bind(Uuid::new_v4().to_string())
    .bind("admin")
    .bind(&admin_password_hash)
    .bind("管理员")
    .bind("admin")
    .execute(pool)
    .await?;

    // 插入默认教师用户 (密码: teacher123)
    let teacher_password_hash = hash("teacher123", DEFAULT_COST)?;
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO users (id, username, password_hash, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        "#
    )
    .bind(Uuid::new_v4().to_string())
    .bind("teacher")
    .bind(&teacher_password_hash)
    .bind("教师")
    .bind("teacher")
    .execute(pool)
    .await?;

    log::info!("SQLite 数据库初始化完成");
    Ok(())
}

/// 检查并初始化数据库（如果需要）
pub async fn ensure_database_initialized(pool: &SqlitePool) -> Result<()> {
    // 检查用户表是否存在
    let table_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users'"
    )
    .fetch_one(pool)
    .await?;

    if table_exists == 0 {
        log::info!("检测到未初始化的数据库，开始初始化...");
        init_sqlite_database(pool).await?;
    } else {
        log::info!("数据库已初始化，跳过初始化步骤");
    }

    Ok(())
}