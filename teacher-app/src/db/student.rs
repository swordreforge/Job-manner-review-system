use crate::models::{Student, CreateStudentRequest, UpdateStudentRequest, StudentQuery};
use sqlx::MySqlPool;
use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;

/// 学生数据访问层
pub struct StudentRepository {
    pool: Arc<MySqlPool>,
}

impl StudentRepository {
    pub fn new(pool: Arc<MySqlPool>) -> Self {
        Self { pool }
    }

    /// 创建学生
    pub async fn create(&self, req: CreateStudentRequest) -> Result<Student> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();

        // 执行插入操作
        sqlx::query(
            r#"
            INSERT INTO students (
                id, student_no, name, gender, age, class_name,
                phone, email, address, parent_name, parent_phone,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(id)
        .bind(&req.student_no)
        .bind(&req.name)
        .bind(&req.gender)
        .bind(req.age)
        .bind(&req.class_name)
        .bind(&req.phone)
        .bind(&req.email)
        .bind(&req.address)
        .bind(&req.parent_name)
        .bind(&req.parent_phone)
        .bind(now)
        .bind(now)
        .execute(&*self.pool)
        .await?;

        // 查询刚创建的学生
        let student = sqlx::query_as::<_, Student>(
            "SELECT * FROM students WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&*self.pool)
        .await?;

        Ok(student)
    }

    /// 根据 ID 查询学生
    pub async fn find_by_id(&self, id: &Uuid) -> Result<Option<Student>> {
        let student = sqlx::query_as::<_, Student>(
            "SELECT * FROM students WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(student)
    }

    /// 根据学号查询学生
    pub async fn find_by_student_no(&self, student_no: &str) -> Result<Option<Student>> {
        let student = sqlx::query_as::<_, Student>(
            "SELECT * FROM students WHERE student_no = ?"
        )
        .bind(student_no)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(student)
    }

    /// 查询学生列表
    pub async fn find_all(
        &self,
        query: &StudentQuery,
    ) -> Result<(Vec<Student>, u64)> {
        let page = query.page.unwrap_or(1);
        let page_size = query.page_size.unwrap_or(20);
        let offset = (page - 1) * page_size;

        // 构建查询条件
        let mut sql = "SELECT * FROM students WHERE 1=1".to_string();
        let mut count_sql = "SELECT COUNT(*) as count FROM students WHERE 1=1".to_string();

        if let Some(keyword) = &query.keyword {
            sql.push_str(&format!(" AND (name LIKE '%{}%' OR student_no LIKE '%{}%')", keyword, keyword));
            count_sql.push_str(&format!(" AND (name LIKE '%{}%' OR student_no LIKE '%{}%')", keyword, keyword));
        }

        if let Some(class_name) = &query.class_name {
            sql.push_str(&format!(" AND class_name = '{}'", class_name));
            count_sql.push_str(&format!(" AND class_name = '{}'", class_name));
        }

        sql.push_str(&format!(" ORDER BY created_at DESC LIMIT {} OFFSET {}", page_size, offset));

        // 查询总数
        let total: (u64,) = sqlx::query_as(&count_sql)
            .fetch_one(&*self.pool)
            .await?;

        // 查询数据
        let students = sqlx::query_as::<_, Student>(&sql)
            .fetch_all(&*self.pool)
            .await?;

        Ok((students, total.0))
    }

    /// 更新学生
    pub async fn update(&self, id: &Uuid, req: UpdateStudentRequest) -> Result<Option<Student>> {
        let now = chrono::Utc::now();

        let mut updates = Vec::new();
        let mut params: Vec<String> = Vec::new();

        if let Some(name) = &req.name {
            updates.push("name = ?");
            params.push(name.clone());
        }
        if let Some(gender) = &req.gender {
            updates.push("gender = ?");
            params.push(gender.clone());
        }
        if let Some(age) = req.age {
            updates.push("age = ?");
            params.push(age.to_string());
        }
        if let Some(class_name) = &req.class_name {
            updates.push("class_name = ?");
            params.push(class_name.clone());
        }
        if let Some(phone) = &req.phone {
            updates.push("phone = ?");
            params.push(phone.clone());
        }
        if let Some(email) = &req.email {
            updates.push("email = ?");
            params.push(email.clone());
        }
        if let Some(address) = &req.address {
            updates.push("address = ?");
            params.push(address.clone());
        }
        if let Some(parent_name) = &req.parent_name {
            updates.push("parent_name = ?");
            params.push(parent_name.clone());
        }
        if let Some(parent_phone) = &req.parent_phone {
            updates.push("parent_phone = ?");
            params.push(parent_phone.clone());
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        updates.push("updated_at = ?");
        params.push(now.format("%Y-%m-%d %H:%M:%S").to_string());

        let sql = format!(
            "UPDATE students SET {} WHERE id = ?",
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

    /// 删除学生
    pub async fn delete(&self, id: &Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM students WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 统计学生总数
    pub async fn count(&self) -> Result<u64> {
        let result: (u64,) = sqlx::query_as("SELECT COUNT(*) FROM students")
            .fetch_one(&*self.pool)
            .await?;

        Ok(result.0)
    }
}