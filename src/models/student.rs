use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// 学生数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Student {
    pub id: Uuid,
    pub student_no: String,
    pub name: String,
    pub gender: Option<String>,
    pub age: Option<i32>,
    pub class_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub parent_name: Option<String>,
    pub parent_phone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 创建学生请求
#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateStudentRequest {
    #[validate(length(min = 1, max = 50))]
    pub student_no: String,
    #[validate(length(min = 1, max = 50))]
    pub name: String,
    pub gender: Option<String>,
    pub age: Option<i32>,
    #[validate(length(min = 1, max = 50))]
    pub class_name: String,
    #[validate(length(max = 20))]
    pub phone: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
    pub address: Option<String>,
    pub parent_name: Option<String>,
    #[validate(length(max = 20))]
    pub parent_phone: Option<String>,
}

/// 更新学生请求
#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateStudentRequest {
    #[validate(length(min = 1, max = 50))]
    pub name: Option<String>,
    pub gender: Option<String>,
    pub age: Option<i32>,
    #[validate(length(min = 1, max = 50))]
    pub class_name: Option<String>,
    #[validate(length(max = 20))]
    pub phone: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
    pub address: Option<String>,
    pub parent_name: Option<String>,
    #[validate(length(max = 20))]
    pub parent_phone: Option<String>,
}

/// 学生查询参数
#[derive(Debug, Deserialize)]
pub struct StudentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
    pub class_name: Option<String>,
}