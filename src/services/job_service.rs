use crate::models::{Job, JobCreateInfo, JobUpdateInfo};
use crate::services::DbPool;

/// 获取所有职位
pub async fn get_all_jobs(pool: &DbPool) -> Result<Vec<Job>, sqlx::Error> {
    let jobs = sqlx::query_as::<_, Job>("SELECT * FROM jobs ORDER BY id DESC")
        .fetch_all(pool.as_ref())
        .await?;
    Ok(jobs)
}

/// 根据ID获取职位
pub async fn get_job_by_id(pool: &DbPool, id: i64) -> Result<Option<Job>, sqlx::Error> {
    let job = sqlx::query_as::<_, Job>("SELECT * FROM jobs WHERE id = ?")
        .bind(id)
        .fetch_optional(pool.as_ref())
        .await?;
    Ok(job)
}

/// 创建职位
pub async fn create_job(pool: &DbPool, info: JobCreateInfo) -> Result<i64, sqlx::Error> {
    let now = chrono::Utc::now().timestamp();
    let result = sqlx::query(
        r#"
        INSERT INTO jobs (name, description, company, industry, location, salary_range, skills, requirements, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&info.name)
    .bind(&info.description)
    .bind(&info.company)
    .bind(&info.industry)
    .bind(&info.location)
    .bind(&info.salary_range)
    .bind(&info.skills)
    .bind(&info.requirements)
    .bind(now)
    .bind(now)
    .execute(pool.as_ref())
    .await?;

    Ok(result.last_insert_id() as i64)
}

/// 更新职位信息
pub async fn update_job(
    pool: &DbPool,
    id: i64,
    info: JobUpdateInfo,
) -> Result<u64, sqlx::Error> {
    let now = chrono::Utc::now().timestamp();

    // 根据提供的字段构建UPDATE查询
    if let Some(name) = info.name {
        sqlx::query("UPDATE jobs SET name = ?, updated_at = ? WHERE id = ?")
            .bind(&name)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(description) = info.description {
        sqlx::query("UPDATE jobs SET description = ?, updated_at = ? WHERE id = ?")
            .bind(&description)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(company) = info.company {
        sqlx::query("UPDATE jobs SET company = ?, updated_at = ? WHERE id = ?")
            .bind(&company)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(industry) = info.industry {
        sqlx::query("UPDATE jobs SET industry = ?, updated_at = ? WHERE id = ?")
            .bind(&industry)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(location) = info.location {
        sqlx::query("UPDATE jobs SET location = ?, updated_at = ? WHERE id = ?")
            .bind(&location)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(salary_range) = info.salary_range {
        sqlx::query("UPDATE jobs SET salary_range = ?, updated_at = ? WHERE id = ?")
            .bind(&salary_range)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(skills) = info.skills {
        sqlx::query("UPDATE jobs SET skills = ?, updated_at = ? WHERE id = ?")
            .bind(&skills)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(certificates) = info.certificates {
        sqlx::query("UPDATE jobs SET certificates = ?, updated_at = ? WHERE id = ?")
            .bind(&certificates)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(soft_skills) = info.soft_skills {
        sqlx::query("UPDATE jobs SET soft_skills = ?, updated_at = ? WHERE id = ?")
            .bind(&soft_skills)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(requirements) = info.requirements {
        sqlx::query("UPDATE jobs SET requirements = ?, updated_at = ? WHERE id = ?")
            .bind(&requirements)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(growth_potential) = info.growth_potential {
        sqlx::query("UPDATE jobs SET growth_potential = ?, updated_at = ? WHERE id = ?")
            .bind(&growth_potential)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    Ok(1)
}

/// 删除职位
pub async fn delete_job(pool: &DbPool, id: i64) -> Result<u64, sqlx::Error> {
    let result = sqlx::query("DELETE FROM jobs WHERE id = ?")
        .bind(id)
        .execute(pool.as_ref())
        .await?;
    Ok(result.rows_affected())
}