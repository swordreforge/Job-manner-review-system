use crate::models::{Student, CreateStudentRequest, UpdateStudentRequest, StudentQuery};
use sqlx::MySqlPool;
use std::sync::Arc;
use anyhow::Result;

pub struct StudentRepository {
    pool: Arc<MySqlPool>,
}

impl StudentRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, user_id: i64, req: CreateStudentRequest) -> Result<Student> {
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            r#"
            INSERT INTO students (
                user_id, name, education, major, graduation_year,
                skills, certificates, soft_skills, internship, projects,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.education)
        .bind(&req.major)
        .bind(req.graduation_year)
        .bind(&req.skills)
        .bind(&req.certificates)
        .bind(&req.soft_skills)
        .bind(&req.internship)
        .bind(&req.projects)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        let student = sqlx::query_as::<_, Student>(
            "SELECT * FROM students ORDER BY id DESC LIMIT 1"
        )
        .fetch_one(&*self.pool)
        .await?;

        Ok(student)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<Student>> {
        let student = sqlx::query_as::<_, Student>(
            "SELECT * FROM students WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(student)
    }

    pub async fn find_all(&self, query: &StudentQuery) -> Result<(Vec<Student>, i64)> {
        let page = query.page.unwrap_or(1);
        let page_size = query.page_size.unwrap_or(20);
        let offset = (page - 1) * page_size;

        let base_select = "SELECT id, user_id, name, education, major, graduation_year, skills, certificates, soft_skills, internship, projects, completeness_score, competitiveness_score, resume_url, suggestions, resume_content, created_at, updated_at FROM students";
        
        let mut sql = base_select.to_string();
        let mut count_sql = "SELECT COUNT(*) as count FROM students".to_string();

        if let Some(keyword) = &query.keyword {
            let where_clause = format!(" WHERE name LIKE '%{}%'", keyword);
            sql.push_str(&where_clause);
            count_sql.push_str(&where_clause);
        }

        sql.push_str(&format!(" ORDER BY id DESC LIMIT {} OFFSET {}", page_size, offset));

        let total: (i64,) = sqlx::query_as(&count_sql)
            .fetch_one(&*self.pool)
            .await?;

        let students = sqlx::query_as::<_, Student>(&sql)
            .fetch_all(&*self.pool)
            .await?;

        Ok((students, total.0))
    }

    pub async fn update(&self, id: i64, req: UpdateStudentRequest) -> Result<Option<Student>> {
        let now = chrono::Utc::now().timestamp();

        let mut updates = Vec::new();

        if let Some(name) = &req.name {
            updates.push(("name", name.clone()));
        }
        if let Some(education) = &req.education {
            updates.push(("education", education.clone()));
        }
        if let Some(major) = &req.major {
            updates.push(("major", major.clone()));
        }
        if let Some(graduation_year) = req.graduation_year {
            updates.push(("graduation_year", graduation_year.to_string()));
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
        if let Some(internship) = &req.internship {
            updates.push(("internship", internship.clone()));
        }
        if let Some(projects) = &req.projects {
            updates.push(("projects", projects.clone()));
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        updates.push(("updated_at", now.to_string()));

        let set_clause: Vec<String> = updates.iter().map(|(k, _)| format!("{} = ?", k)).collect();
        let sql = format!("UPDATE students SET {} WHERE id = ?", set_clause.join(", "));

        let mut query = sqlx::query(&sql);
        for (_, v) in &updates {
            query = query.bind(v);
        }
        query = query.bind(id);
        query.execute(&*self.pool).await?;

        self.find_by_id(id).await
    }

    pub async fn delete(&self, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM students WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count(&self) -> Result<i64> {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM students")
            .fetch_one(&*self.pool)
            .await?;

        Ok(result.0)
    }
}
