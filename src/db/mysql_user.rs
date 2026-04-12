use crate::models::MySqlUser;
use sqlx::MySqlPool;
use std::sync::Arc;
use anyhow::Result;

pub struct MySqlUserRepository {
    pool: Arc<MySqlPool>,
}

impl MySqlUserRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self, page: u64, page_size: u64) -> Result<(Vec<MySqlUser>, i64)> {
        let offset = (page - 1) * page_size;
        let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
            .fetch_one(&*self.pool)
            .await?;

        let users = sqlx::query_as::<_, MySqlUser>(
            "SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?"
        )
        .bind(page_size)
        .bind(offset)
        .fetch_all(&*self.pool)
        .await?;

        Ok((users, total.0))
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<MySqlUser>> {
        let user = sqlx::query_as::<_, MySqlUser>(
            "SELECT * FROM users WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(user)
    }

    pub async fn create(&self, username: &str, password: &str, email: Option<&str>, phone: Option<&str>, role: &str) -> Result<MySqlUser> {
        let now = chrono::Utc::now().timestamp();
        let password_hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)?;

        sqlx::query(
            "INSERT INTO users (username, password, email, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(username)
        .bind(&password_hash)
        .bind(email)
        .bind(phone)
        .bind(role)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        let user = sqlx::query_as::<_, MySqlUser>("SELECT * FROM users ORDER BY id DESC LIMIT 1")
            .fetch_one(&*self.pool)
            .await?;

        Ok(user)
    }

    pub async fn update(&self, id: i64, email: Option<&str>, phone: Option<&str>, role: Option<&str>) -> Result<Option<MySqlUser>> {
        let now = chrono::Utc::now().timestamp();
        let mut updates = Vec::new();

        if email.is_some() {
            updates.push("email = ?");
        }
        if phone.is_some() {
            updates.push("phone = ?");
        }
        if role.is_some() {
            updates.push("role = ?");
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        updates.push("updated_at = ?");

        let sql = format!("UPDATE users SET {} WHERE id = ?", updates.join(", "));

        let mut query = sqlx::query(&sql);
        if let Some(e) = email {
            query = query.bind(e);
        }
        if let Some(p) = phone {
            query = query.bind(p);
        }
        if let Some(r) = role {
            query = query.bind(r);
        }
        query = query.bind(now);
        query = query.bind(id);
        query.execute(&*self.pool).await?;

        self.find_by_id(id).await
    }

    pub async fn update_password(&self, id: i64, new_password: &str) -> Result<bool> {
        let password_hash = bcrypt::hash(new_password, bcrypt::DEFAULT_COST)?;
        let now = chrono::Utc::now().timestamp();

        let result = sqlx::query("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")
            .bind(&password_hash)
            .bind(now)
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(&self, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
