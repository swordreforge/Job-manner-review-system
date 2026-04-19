use crate::models::{School, CreateSchoolRequest, UpdateSchoolRequest, SchoolQuery};
use sqlx::MySqlPool;
use std::sync::Arc;
use anyhow::Result;

pub struct SchoolRepository {
    pool: Arc<MySqlPool>,
}

impl SchoolRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateSchoolRequest, code: String) -> Result<School> {
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            r#"
            INSERT INTO schools (
                name, code, address, contact_person, contact_phone, contact_email,
                status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
            "#
        )
        .bind(&req.name)
        .bind(&code)
        .bind(&req.address)
        .bind(&req.contact_person)
        .bind(&req.contact_phone)
        .bind(&req.contact_email)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        let school = sqlx::query_as::<_, School>(
            "SELECT * FROM schools ORDER BY id DESC LIMIT 1"
        )
        .fetch_one(&*self.pool)
        .await?;

        Ok(school)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<School>> {
        let school = sqlx::query_as::<_, School>(
            "SELECT * FROM schools WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(school)
    }

    pub async fn find_by_code(&self, code: &str) -> Result<Option<School>> {
        let school = sqlx::query_as::<_, School>(
            "SELECT * FROM schools WHERE code = ?"
        )
        .bind(code)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(school)
    }

    pub async fn find_all(&self, query: &SchoolQuery) -> Result<(Vec<School>, i64)> {
        let page = query.page.unwrap_or(1);
        let page_size = query.page_size.unwrap_or(20);
        let offset = (page - 1) * page_size;

        let base_select = "SELECT * FROM schools";

        let mut sql = base_select.to_string();
        let mut count_sql = "SELECT COUNT(*) as count FROM schools".to_string();

        if let Some(keyword) = &query.keyword {
            let where_clause = format!(" WHERE name LIKE '%{}%' OR code LIKE '%{}%'", keyword, keyword);
            sql.push_str(&where_clause);
            count_sql.push_str(&where_clause);
        }

        if let Some(status) = &query.status {
            let and_clause = if sql.contains(" WHERE ") {
                format!(" AND status = '{}'", status)
            } else {
                format!(" WHERE status = '{}'", status)
            };
            sql.push_str(&and_clause);
            count_sql.push_str(&and_clause);
        }

        sql.push_str(&format!(" ORDER BY created_at DESC LIMIT {} OFFSET {}", page_size, offset));

        let total: (i64,) = sqlx::query_as(&count_sql)
            .fetch_one(&*self.pool)
            .await?;

        let schools = sqlx::query_as::<_, School>(&sql)
            .fetch_all(&*self.pool)
            .await?;

        Ok((schools, total.0))
    }

    pub async fn update(&self, id: i64, req: UpdateSchoolRequest) -> Result<Option<School>> {
        let now = chrono::Utc::now().timestamp();

        let mut updates = Vec::new();

        if let Some(name) = &req.name {
            updates.push(("name", name.clone()));
        }
        if let Some(address) = &req.address {
            updates.push(("address", address.clone()));
        }
        if let Some(contact_person) = &req.contact_person {
            updates.push(("contact_person", contact_person.clone()));
        }
        if let Some(contact_phone) = &req.contact_phone {
            updates.push(("contact_phone", contact_phone.clone()));
        }
        if let Some(contact_email) = &req.contact_email {
            updates.push(("contact_email", contact_email.clone()));
        }
        if let Some(status) = &req.status {
            updates.push(("status", status.clone()));
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        updates.push(("updated_at", now.to_string()));

        let set_clause: Vec<String> = updates.iter().map(|(k, _)| format!("{} = ?", k)).collect();
        let sql = format!("UPDATE schools SET {} WHERE id = ?", set_clause.join(", "));

        let mut query = sqlx::query(&sql);
        for (_, v) in &updates {
            query = query.bind(v);
        }
        query = query.bind(id);
        query.execute(&*self.pool).await?;

        self.find_by_id(id).await
    }

    pub async fn delete(&self, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM schools WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn list_all(&self) -> Result<Vec<School>> {
        let sql = "SELECT * FROM schools ORDER BY id DESC";
        let schools = sqlx::query_as::<_, School>(sql)
            .fetch_all(&*self.pool)
            .await?;
        Ok(schools)
    }

    pub async fn count(&self) -> Result<i64> {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM schools")
            .fetch_one(&*self.pool)
            .await?;

        Ok(result.0)
    }

    pub async fn code_exists(&self, code: &str) -> Result<bool> {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM schools WHERE code = ?")
            .bind(code)
            .fetch_one(&*self.pool)
            .await?;

        Ok(result.0 > 0)
    }
}