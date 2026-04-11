use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CareerReport {
    pub id: i64,
    pub student_id: i64,
    pub target_job_id: Option<i64>,
    pub title: String,
    pub content: Option<String>,
    pub overview: Option<String>,
    pub match_analysis: Option<String>,
    pub career_path: Option<String>,
    pub action_plan: Option<String>,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}