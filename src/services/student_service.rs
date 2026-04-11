use crate::models::{Student, StudentCreateInfo, StudentUpdateInfo};
use crate::services::DbPool;

/// 获取所有学生
pub async fn get_all_students(pool: &DbPool) -> Result<Vec<Student>, sqlx::Error> {
    let students = sqlx::query_as::<_, Student>("SELECT * FROM students ORDER BY id DESC")
        .fetch_all(pool.as_ref())
        .await?;
    Ok(students)
}

/// 根据ID获取学生
pub async fn get_student_by_id(pool: &DbPool, id: i64) -> Result<Option<Student>, sqlx::Error> {
    let student = sqlx::query_as::<_, Student>("SELECT * FROM students WHERE id = ?")
        .bind(id)
        .fetch_optional(pool.as_ref())
        .await?;
    Ok(student)
}

/// 创建学生
pub async fn create_student(pool: &DbPool, info: StudentCreateInfo) -> Result<i64, sqlx::Error> {
    let now = chrono::Utc::now().timestamp();
    let result = sqlx::query(
        r#"
        INSERT INTO students (user_id, name, education, major, graduation_year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(info.user_id)
    .bind(&info.name)
    .bind(&info.education)
    .bind(&info.major)
    .bind(info.graduation_year)
    .bind(now)
    .bind(now)
    .execute(pool.as_ref())
    .await?;

    Ok(result.last_insert_id() as i64)
}

/// 更新学生信息
pub async fn update_student(
    pool: &DbPool,
    id: i64,
    info: StudentUpdateInfo,
) -> Result<u64, sqlx::Error> {
    let now = chrono::Utc::now().timestamp();

    // 根据提供的字段构建UPDATE查询
    if let Some(education) = info.education {
        sqlx::query("UPDATE students SET education = ?, updated_at = ? WHERE id = ?")
            .bind(&education)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(major) = info.major {
        sqlx::query("UPDATE students SET major = ?, updated_at = ? WHERE id = ?")
            .bind(&major)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(graduation_year) = info.graduation_year {
        sqlx::query("UPDATE students SET graduation_year = ?, updated_at = ? WHERE id = ?")
            .bind(graduation_year)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(skills) = info.skills {
        sqlx::query("UPDATE students SET skills = ?, updated_at = ? WHERE id = ?")
            .bind(&skills)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(certificates) = info.certificates {
        sqlx::query("UPDATE students SET certificates = ?, updated_at = ? WHERE id = ?")
            .bind(&certificates)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(soft_skills) = info.soft_skills {
        sqlx::query("UPDATE students SET soft_skills = ?, updated_at = ? WHERE id = ?")
            .bind(&soft_skills)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(internship) = info.internship {
        sqlx::query("UPDATE students SET internship = ?, updated_at = ? WHERE id = ?")
            .bind(&internship)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(projects) = info.projects {
        sqlx::query("UPDATE students SET projects = ?, updated_at = ? WHERE id = ?")
            .bind(&projects)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    if let Some(resume_url) = info.resume_url {
        sqlx::query("UPDATE students SET resume_url = ?, updated_at = ? WHERE id = ?")
            .bind(&resume_url)
            .bind(now)
            .bind(id)
            .execute(pool.as_ref())
            .await?;
    }

    Ok(1)
}

/// 删除学生
pub async fn delete_student(pool: &DbPool, id: i64) -> Result<u64, sqlx::Error> {
    let result = sqlx::query("DELETE FROM students WHERE id = ?")
        .bind(id)
        .execute(pool.as_ref())
        .await?;
    Ok(result.rows_affected())
}