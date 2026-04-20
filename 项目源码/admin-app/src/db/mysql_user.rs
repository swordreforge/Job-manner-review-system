use crate::models::MySqlUser;
use sqlx::MySqlPool;
use std::sync::Arc;
use anyhow::Result;

const MYSQL_USER_SELECT_SQL: &str = concat!(
    "SELECT id, username, password, email, phone, avatar, role, ",
    "COALESCE(created_at, 0) AS created_at, ",
    "COALESCE(updated_at, 0) AS updated_at ",
    "FROM users"
);

pub struct MySqlUserRepository {
    pool: Arc<MySqlPool>,
}

#[cfg(test)]
mod tests {
    use super::MYSQL_USER_SELECT_SQL;

    #[test]
    fn mysql_user_select_sql_handles_null_timestamps() {
        assert!(MYSQL_USER_SELECT_SQL.contains("COALESCE(created_at, 0) AS created_at"));
        assert!(MYSQL_USER_SELECT_SQL.contains("COALESCE(updated_at, 0) AS updated_at"));
    }

    #[test]
    fn mysql_user_select_sql_avoids_select_star() {
        assert!(!MYSQL_USER_SELECT_SQL.contains("SELECT *"));
    }
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

        let find_all_sql = format!("{} ORDER BY id DESC LIMIT ? OFFSET ?", MYSQL_USER_SELECT_SQL);
        let users = sqlx::query_as::<_, MySqlUser>(&find_all_sql)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&*self.pool)
        .await?;

        Ok((users, total.0))
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<MySqlUser>> {
        let find_by_id_sql = format!("{} WHERE id = ?", MYSQL_USER_SELECT_SQL);
        let user = sqlx::query_as::<_, MySqlUser>(&find_by_id_sql)
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(user)
    }

    pub async fn create(&self, username: &str, password: &str, email: Option<&str>, phone: Option<&str>, role: &str) -> Result<MySqlUser> {
        let now = chrono::Utc::now().timestamp();
        let password_owned = password.to_string();
        let password_hash = tokio::task::spawn_blocking(move || bcrypt::hash(&password_owned, bcrypt::DEFAULT_COST))
            .await
            .map_err(|e| anyhow::anyhow!("Hash task failed: {}", e))??;

        let result = sqlx::query(
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

        let id = result.last_insert_id();
        let create_fetch_sql = format!("{} WHERE id = ?", MYSQL_USER_SELECT_SQL);
        let user = sqlx::query_as::<_, MySqlUser>(&create_fetch_sql)
            .bind(id as i64)
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
        let new_password_owned = new_password.to_string();
        let password_hash = tokio::task::spawn_blocking(move || bcrypt::hash(&new_password_owned, bcrypt::DEFAULT_COST))
            .await
            .map_err(|e| anyhow::anyhow!("Hash task failed: {}", e))??;
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
