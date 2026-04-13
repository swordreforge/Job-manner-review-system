use crate::models::{User, CreateUserRequest, UserResponse};
use sqlx::SqlitePool;
use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;

/// SQLite 用户数据访问层（用于登录功能）
pub struct SqliteUserRepository {
    pool: Arc<SqlitePool>,
}

/// SQLite 专用的用户结构体（ID 为字符串格式）
#[derive(Debug, Clone, sqlx::FromRow)]
struct SqliteUserRow {
    id: String,
    username: String,
    password_hash: String,
    name: String,
    role: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[allow(dead_code)]
impl SqliteUserRepository {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// 将 SQLite 行转换为 User 模型
    fn row_to_user(row: SqliteUserRow) -> Result<User> {
        Ok(User {
            id: Uuid::parse_str(&row.id)?,
            username: row.username,
            password_hash: row.password_hash,
            name: row.name,
            role: row.role,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }

    /// 创建用户(密码自动加密)
    pub async fn create(&self, req: CreateUserRequest) -> Result<User> {
        // 检查用户名是否已存在
        if self.find_by_username(&req.username).await?.is_some() {
            return Err(anyhow::anyhow!("用户名已存在"));
        }

        let id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let password_hash = bcrypt::hash(&req.password, bcrypt::DEFAULT_COST)?;
        let role = req.role.unwrap_or_else(|| "teacher".to_string());

        // 执行插入操作
        sqlx::query(
            r#"
            INSERT INTO users (id, username, password_hash, name, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(id.to_string())
        .bind(&req.username)
        .bind(&password_hash)
        .bind(&req.name)
        .bind(&role)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        // 查询刚创建的用户
        let row = sqlx::query_as::<_, SqliteUserRow>(
            "SELECT * FROM users WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_one(&*self.pool)
        .await?;

        Self::row_to_user(row)
    }

    /// 根据 ID 查询用户
    pub async fn find_by_id(&self, id: &Uuid) -> Result<Option<User>> {
        let row = sqlx::query_as::<_, SqliteUserRow>(
            "SELECT * FROM users WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_optional(&*self.pool)
        .await?;

        row.map(Self::row_to_user).transpose()
    }

    /// 根据用户名查询用户
    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let row = sqlx::query_as::<_, SqliteUserRow>(
            "SELECT * FROM users WHERE username = ?"
        )
        .bind(username)
        .fetch_optional(&*self.pool)
        .await?;

        row.map(Self::row_to_user).transpose()
    }

    /// 验证用户登录
    pub async fn verify_credentials(&self, username: &str, password: &str) -> Result<Option<UserResponse>> {
        if let Some(user) = self.find_by_username(username).await? {
            if user.verify_password(password)? {
                return Ok(Some(user.into()));
            }
        }
        Ok(None)
    }

    /// 更新用户信息
    pub async fn update(&self, id: &Uuid, name: Option<String>, role: Option<String>) -> Result<Option<User>> {
        let mut updates = Vec::new();
        let mut params: Vec<String> = Vec::new();

        if let Some(name) = name {
            updates.push("name = ?");
            params.push(name);
        }
        if let Some(role) = role {
            updates.push("role = ?");
            params.push(role);
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        updates.push("updated_at = ?");
        params.push(chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string());

        let sql = format!(
            "UPDATE users SET {} WHERE id = ?",
            updates.join(", ")
        );

        let mut query = sqlx::query(&sql);
        for param in params {
            query = query.bind(param);
        }
        query = query.bind(id.to_string());

        query.execute(&*self.pool).await?;

        self.find_by_id(id).await
    }

    /// 更新密码
    pub async fn update_password(&self, id: &Uuid, new_password: &str) -> Result<bool> {
        let password_hash = bcrypt::hash(new_password, bcrypt::DEFAULT_COST)?;

        let result = sqlx::query(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?"
        )
        .bind(&password_hash)
        .bind(chrono::Utc::now())
        .bind(id.to_string())
        .execute(&*self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 删除用户
    pub async fn delete(&self, id: &Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(id.to_string())
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}