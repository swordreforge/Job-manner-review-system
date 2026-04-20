use crate::models::{User, CreateUserRequest, UserResponse};
use sqlx::MySqlPool;
use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;

const USER_SELECT_SQL: &str = "SELECT id, username, password_hash, name, role, created_at, updated_at FROM users";

/// 用户数据访问层
#[allow(dead_code)]
pub struct UserRepository {
    pool: Arc<MySqlPool>,
}

#[allow(dead_code)]
impl UserRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    /// 创建用户(密码自动加密)
    pub async fn create(&self, req: CreateUserRequest) -> Result<User> {
        // 检查用户名是否已存在
        if self.find_by_username(&req.username).await?.is_some() {
            return Err(anyhow::anyhow!("用户名已存在"));
        }

        let id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let password = req.password.clone();
        let password_hash = tokio::task::spawn_blocking(move || bcrypt::hash(&password, bcrypt::DEFAULT_COST))
            .await
            .map_err(|e| anyhow::anyhow!("Hash task failed: {}", e))??;
        let role = req.role.unwrap_or_else(|| "teacher".to_string());

        // 执行插入操作
        sqlx::query(
            r#"
            INSERT INTO users (id, username, password_hash, name, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(id)
        .bind(&req.username)
        .bind(&password_hash)
        .bind(&req.name)
        .bind(&role)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        // 查询刚创建的用户
        let sql = format!("{} WHERE id = ?", USER_SELECT_SQL);
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(id)
            .fetch_one(&*self.pool)
            .await?;

        Ok(user)
    }

    /// 根据 ID 查询用户
    pub async fn find_by_id(&self, id: &Uuid) -> Result<Option<User>> {
        let sql = format!("{} WHERE id = ?", USER_SELECT_SQL);
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(id)
            .fetch_optional(&*self.pool)
            .await?;

        Ok(user)
    }

    /// 根据用户名查询用户
    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let sql = format!("{} WHERE username = ?", USER_SELECT_SQL);
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(username)
            .fetch_optional(&*self.pool)
            .await?;

        Ok(user)
    }

    /// 验证用户登录
    pub async fn verify_credentials(&self, username: &str, password: &str) -> Result<Option<UserResponse>> {
        let user = self.find_by_username(username).await?;
        match user {
            Some(user) => {
                let password_owned = password.to_string();
                let hash = user.password_hash.clone();
                let verified = tokio::task::spawn_blocking(move || bcrypt::verify(&password_owned, &hash))
                    .await
                    .map_err(|e| anyhow::anyhow!("Verify task failed: {}", e))??;
                if verified {
                    Ok(Some(user.into()))
                } else {
                    Ok(None)
                }
            }
            None => Ok(None),
        }
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
        query = query.bind(id);

        query.execute(&*self.pool).await?;

        self.find_by_id(id).await
    }

    /// 更新密码
    pub async fn update_password(&self, id: &Uuid, new_password: &str) -> Result<bool> {
        let new_password_owned = new_password.to_string();
        let password_hash = tokio::task::spawn_blocking(move || bcrypt::hash(&new_password_owned, bcrypt::DEFAULT_COST))
            .await
            .map_err(|e| anyhow::anyhow!("Hash task failed: {}", e))??;

        let result = sqlx::query(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?"
        )
        .bind(&password_hash)
        .bind(chrono::Utc::now())
        .bind(id)
        .execute(&*self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 删除用户
    pub async fn delete(&self, id: &Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}