use crate::models::{Job, CreateJobRequest, UpdateJobRequest, JobQuery};
use sqlx::{MySqlPool, Row};
use std::sync::Arc;
use anyhow::Result;

const JOB_SELECT_SQL: &str = concat!(
    "SELECT id, name, description, company, industry, category, location, salary_range, ",
    "job_code, company_scale, company_funding_status, company_description, ",
    "source_url, CAST(update_date AS CHAR) AS update_date, job_detail, ",
    "skills, certificates, soft_skills, requirements, ",
    "CAST(growth_potential AS CHAR) AS growth_potential, created_at, updated_at ",
    "FROM jobs"
);

pub struct JobRepository {
    pool: Arc<MySqlPool>,
}

impl JobRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateJobRequest) -> Result<Job> {
        let now = chrono::Utc::now().timestamp();

        let result = sqlx::query(
            r#"
            INSERT INTO jobs (
                name, description, company, industry, category, location, salary_range,
                job_code, company_scale, company_funding_status, company_description,
                source_url, update_date, job_detail,
                skills, certificates, soft_skills, requirements, growth_potential,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.company)
        .bind(&req.industry)
        .bind(&req.category)
        .bind(&req.location)
        .bind(&req.salary_range)
        .bind(&req.job_code)
        .bind(&req.company_scale)
        .bind(&req.company_funding_status)
        .bind(&req.company_description)
        .bind(&req.source_url)
        .bind(&req.update_date)
        .bind(&req.job_detail)
        .bind(&req.skills)
        .bind(&req.certificates)
        .bind(&req.soft_skills)
        .bind(&req.requirements)
        .bind(&req.growth_potential)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        let id = result.last_insert_id();
        let find_sql = format!("{} WHERE id = ?", JOB_SELECT_SQL);
        sqlx::query_as::<_, Job>(&find_sql)
            .bind(id as i64)
            .fetch_one(&*self.pool)
            .await
            .map_err(Into::into)
    }

    pub async fn create_many(&self, reqs: Vec<CreateJobRequest>) -> Result<(u32, u32)> {
        let now = chrono::Utc::now().timestamp();
        let mut success = 0u32;
        let mut failed = 0u32;

        for req in reqs {
            let result = sqlx::query(
                r#"
                INSERT INTO jobs (
                    name, description, company, industry, category, location, salary_range,
                    job_code, company_scale, company_funding_status, company_description,
                    source_url, update_date, job_detail,
                    skills, certificates, soft_skills, requirements, growth_potential,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#
            )
            .bind(&req.name)
            .bind(&req.description)
            .bind(&req.company)
            .bind(&req.industry)
            .bind(&req.category)
            .bind(&req.location)
            .bind(&req.salary_range)
            .bind(&req.job_code)
            .bind(&req.company_scale)
            .bind(&req.company_funding_status)
            .bind(&req.company_description)
            .bind(&req.source_url)
            .bind(&req.update_date)
            .bind(&req.job_detail)
            .bind(&req.skills)
            .bind(&req.certificates)
            .bind(&req.soft_skills)
            .bind(&req.requirements)
            .bind(&req.growth_potential)
            .bind(now)
            .bind(now)
            .execute(&*self.pool)
            .await;

            match result {
                Ok(_) => success += 1,
                Err(e) => {
                    log::warn!("插入岗位失败: {}, 错误: {}", req.name, e);
                    failed += 1;
                }
            }
        }

        Ok((success, failed))
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<Job>> {
        let find_by_id_sql = format!("{} WHERE id = ?", JOB_SELECT_SQL);
        let job = sqlx::query_as::<_, Job>(&find_by_id_sql)
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(job)
    }

    pub async fn find_all(&self, query: &JobQuery) -> Result<(Vec<Job>, i64)> {
        let page = query.page.unwrap_or(1).min(100);
        let page_size = query.page_size.unwrap_or(20).min(200);
        let offset = page.saturating_sub(1) * page_size;

        let mut sql = JOB_SELECT_SQL.to_string();
        let mut where_parts: Vec<String> = Vec::new();
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(keyword) = &query.keyword {
            let pattern = format!("%{}%", keyword);
            where_parts.push("(name LIKE ? OR company LIKE ?)".to_string());
            bind_values.push(pattern.clone());
            bind_values.push(pattern);
        }

        if let Some(industry) = &query.industry {
            where_parts.push("industry = ?".to_string());
            bind_values.push(industry.clone());
        }

        if let Some(category) = &query.category {
            where_parts.push("category = ?".to_string());
            bind_values.push(category.clone());
        }

        let where_clause = if where_parts.is_empty() {
            String::new()
        } else {
            format!(" WHERE {}", where_parts.join(" AND "))
        };

        sql.push_str(&where_clause);
        let count_sql_final = if where_parts.is_empty() {
            String::from("SELECT COUNT(*) as count FROM jobs")
        } else {
            format!("SELECT COUNT(*) as count FROM jobs WHERE {}", where_parts.join(" AND "))
        };
        sql.push_str(" ORDER BY id DESC LIMIT ? OFFSET ?");

        let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql_final);
        for val in &bind_values {
            count_query = count_query.bind(val);
        }
        let total: (i64,) = count_query.fetch_one(&*self.pool).await?;

        let mut data_query = sqlx::query_as::<_, Job>(&sql);
        for val in &bind_values {
            data_query = data_query.bind(val);
        }
        data_query = data_query.bind(page_size).bind(offset);
        let jobs = data_query.fetch_all(&*self.pool).await?;

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
        if let Some(category) = &req.category {
            updates.push(("category", category.clone()));
        }
        if let Some(location) = &req.location {
            updates.push(("location", location.clone()));
        }
        if let Some(salary_range) = &req.salary_range {
            updates.push(("salary_range", salary_range.clone()));
        }
        if let Some(job_code) = &req.job_code {
            updates.push(("job_code", job_code.clone()));
        }
        if let Some(company_scale) = &req.company_scale {
            updates.push(("company_scale", company_scale.clone()));
        }
        if let Some(company_funding_status) = &req.company_funding_status {
            updates.push(("company_funding_status", company_funding_status.clone()));
        }
        if let Some(company_description) = &req.company_description {
            updates.push(("company_description", company_description.clone()));
        }
        if let Some(source_url) = &req.source_url {
            updates.push(("source_url", source_url.clone()));
        }
        if let Some(update_date) = &req.update_date {
            updates.push(("update_date", update_date.clone()));
        }
        if let Some(job_detail) = &req.job_detail {
            updates.push(("job_detail", job_detail.clone()));
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

    #[allow(dead_code)]
    pub async fn count(&self) -> Result<i64> {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM jobs")
            .fetch_one(&*self.pool)
            .await?;

        Ok(result.0)
    }

    pub async fn list_all(&self) -> Result<Vec<Job>> {
        let sql = format!("{} ORDER BY id DESC", JOB_SELECT_SQL);
        let jobs = sqlx::query_as::<_, Job>(&sql)
            .fetch_all(&*self.pool)
            .await?;
        Ok(jobs)
    }

    pub async fn exists_by_job_code(&self, job_code: &str) -> Result<bool> {
        let result: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM jobs WHERE job_code = ?"
        )
        .bind(job_code)
        .fetch_one(&*self.pool)
        .await?;

        Ok(result.0 > 0)
    }

    pub async fn exists_by_job_codes(&self, codes: &[String]) -> Result<std::collections::HashSet<String>> {
        if codes.is_empty() {
            return Ok(std::collections::HashSet::new());
        }
        let placeholders: Vec<String> = codes.iter().map(|_| "?".to_string()).collect();
        let sql = format!("SELECT job_code FROM jobs WHERE job_code IN ({})", placeholders.join(","));
        let mut query = sqlx::query(&sql);
        for code in codes {
            query = query.bind(code);
        }
        let rows = query.fetch_all(&*self.pool).await?;
        Ok(rows.iter().filter_map(|row| row.try_get::<String, _>("job_code").ok()).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::JOB_SELECT_SQL;

    #[test]
    fn job_select_sql_casts_growth_potential_to_char() {
        assert!(JOB_SELECT_SQL.contains("CAST(growth_potential AS CHAR) AS growth_potential"));
    }

    #[test]
    fn job_select_sql_avoids_select_star() {
        assert!(!JOB_SELECT_SQL.contains("SELECT *"));
    }
}
