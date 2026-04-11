use crate::services::{get_all_students, DbPool};
use crate::templates::StudentsTemplate;
use axum::extract::State;

/// 学生管理页面
pub async fn students_index(State(pool): State<DbPool>) -> StudentsTemplate {
    let students = get_all_students(&pool).await.unwrap_or_default();
    StudentsTemplate::new(students)
}