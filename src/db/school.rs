use crate::models::{School, CreateSchoolRequest, UpdateSchoolRequest, SchoolQuery};
use sqlx::MySqlPool;
use std::sync::Arc;
use anyhow::Result;

const SCHOOL_SELECT_SQL: &str = "SELECT id, name, code, address, contact_person, contact_phone, contact_email, status, created_at, updated_at FROM schools";

pub struct SchoolRepository {
    pool: Arc<MySqlPool>,
}

impl SchoolRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateSchoolRequest, code: String) -> Result<School> {
        let now = chrono::Utc::now().timestamp();

        let result = sqlx::query(
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

        let id = result.last_insert_id();
        let sql = format!("{} WHERE id = ?", SCHOOL_SELECT_SQL);
        sqlx::query_as::<_, School>(&sql)
            .bind(id as i64)
            .fetch_one(&*self.pool)
            .await
            .map_err(Into::into)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<School>> {
        let sql = format!("{} WHERE id = ?", SCHOOL_SELECT_SQL);
        let school = sqlx::query_as::<_, School>(&sql)
            .bind(id)
            .fetch_optional(&*self.pool)
            .await?;

        Ok(school)
    }

    pub async fn find_by_code(&self, code: &str) -> Result<Option<School>> {
        let sql = format!("{} WHERE code = ?", SCHOOL_SELECT_SQL);
        let school = sqlx::query_as::<_, School>(&sql)
            .bind(code)
            .fetch_optional(&*self.pool)
            .await?;

        Ok(school)
    }

    pub async fn find_all(&self, query: &SchoolQuery) -> Result<(Vec<School>, i64)> {
        let page = query.page.unwrap_or(1).min(100);
        let page_size = query.page_size.unwrap_or(20).min(200);
        let offset = page.saturating_sub(1) * page_size;

        let mut sql = format!("{} WHERE 1=1", SCHOOL_SELECT_SQL);
        let mut count_sql = String::from("SELECT COUNT(*) as count FROM schools WHERE 1=1");
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(keyword) = &query.keyword {
            let pattern = format!("%{}%", keyword);
            sql.push_str(" AND (name LIKE ? OR code LIKE ?)");
            count_sql.push_str(" AND (name LIKE ? OR code LIKE ?)");
            bind_values.push(pattern.clone());
            bind_values.push(pattern);
        }

        if let Some(status) = &query.status {
            sql.push_str(" AND status = ?");
            count_sql.push_str(" AND status = ?");
            bind_values.push(status.clone());
        }

        sql.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

        let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql);
        for val in &bind_values {
            count_query = count_query.bind(val);
        }
        let total: (i64,) = count_query.fetch_one(&*self.pool).await?;

        let mut data_query = sqlx::query_as::<_, School>(&sql);
        for val in &bind_values {
            data_query = data_query.bind(val);
        }
        data_query = data_query.bind(page_size).bind(offset);
        let schools = data_query.fetch_all(&*self.pool).await?;

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
        let sql = format!("{} ORDER BY id DESC", SCHOOL_SELECT_SQL);
        let schools = sqlx::query_as::<_, School>(&sql)
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