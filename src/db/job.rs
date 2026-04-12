use crate::models::{Job, CreateJobRequest, UpdateJobRequest, JobQuery};
use sqlx::MySqlPool;
use std::sync::Arc;
use anyhow::Result;

pub struct JobRepository {
    pool: Arc<MySqlPool>,
}

impl JobRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateJobRequest) -> Result<Job> {
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            r#"
            INSERT INTO jobs (
                name, description, company, industry, location, salary_range,
                skills, certificates, soft_skills, requirements, growth_potential,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.company)
        .bind(&req.industry)
        .bind(&req.location)
        .bind(&req.salary_range)
        .bind(&req.skills)
        .bind(&req.certificates)
        .bind(&req.soft_skills)
        .bind(&req.requirements)
        .bind(&req.growth_potential)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        let job = sqlx::query_as::<_, Job>(
            "SELECT * FROM jobs ORDER BY id DESC LIMIT 1"
        )
        .fetch_one(&*self.pool)
        .await?;

        Ok(job)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<Job>> {
        let job = sqlx::query_as::<_, Job>(
            "SELECT * FROM jobs WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(job)
    }

    pub async fn find_all(&self, query: &JobQuery) -> Result<(Vec<Job>, i64)> {
        let page = query.page.unwrap_or(1);
        let page_size = query.page_size.unwrap_or(20);
        let offset = (page - 1) * page_size;

        let base_select = "SELECT * FROM jobs";
        
        let mut sql = base_select.to_string();
        let mut count_sql = "SELECT COUNT(*) as count FROM jobs".to_string();

        if let Some(keyword) = &query.keyword {
            let where_clause = format!(" WHERE name LIKE '%{}%' OR company LIKE '%{}%'", keyword, keyword);
            sql.push_str(&where_clause);
            count_sql.push_str(&where_clause);
        }

        if let Some(industry) = &query.industry {
            let and_clause = if sql.contains(" WHERE ") {
                format!(" AND industry = '{}'", industry)
            } else {
                format!(" WHERE industry = '{}'", industry)
            };
            sql.push_str(&and_clause);
            count_sql.push_str(&and_clause);
        }

        sql.push_str(&format!(" ORDER BY id DESC LIMIT {} OFFSET {}", page_size, offset));

        let total: (i64,) = sqlx::query_as(&count_sql)
            .fetch_one(&*self.pool)
            .await?;

        let jobs = sqlx::query_as::<_, Job>(&sql)
            .fetch_all(&*self.pool)
            .await?;

        Ok((jobs, total.0))
    }

    pub async fn update(&self, id: i64, req: UpdateJobRequest) -> Result<Option<Job>> {
        let now = chrono::Utc::now().timestamp();

        let mut updates = Vec::new();

        if let Some(name) = &req.name {
            updates.push(("name", name.clone()));
        }
        if let Some(description) = &req.description {
            updates.push(("description", description.clone()));
        }
        if let Some(company) = &req.company {
            updates.push(("company", company.clone()));
        }
        if let Some(industry) = &req.industry {
            updates.push(("industry", industry.clone()));
        }
        if let Some(location) = &req.location {
            updates.push(("location", location.clone()));
        }
        if let Some(salary_range) = &req.salary_range {
            updates.push(("salary_range", salary_range.clone()));
        }
        if let Some(skills) = &req.skills {
            updates.push(("skills", skills.clone()));
        }
        if let Some(certificates) = &req.certificates {
            updates.push(("certificates", certificates.clone()));
        }
        if let Some(soft_skills) = &req.soft_skills {
            updates.push(("soft_skills", soft_skills.clone()));
        }
        if let Some(requirements) = &req.requirements {
            updates.push(("requirements", requirements.clone()));
        }
        if let Some(growth_potential) = &req.growth_potential {
            updates.push(("growth_potential", growth_potential.clone()));
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        updates.push(("updated_at", now.to_string()));

        let set_clause: Vec<String> = updates.iter().map(|(k, _)| format!("{} = ?", k)).collect();
        let sql = format!("UPDATE jobs SET {} WHERE id = ?", set_clause.join(", "));

        let mut query = sqlx::query(&sql);
        for (_, v) in &updates {
            query = query.bind(v);
        }
        query = query.bind(id);
        query.execute(&*self.pool).await?;

        self.find_by_id(id).await
    }

    pub async fn delete(&self, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM jobs WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count(&self) -> Result<i64> {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM jobs")
            .fetch_one(&*self.pool)
            .await?;

        Ok(result.0)
    }
}
