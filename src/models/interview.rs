use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InterviewSession {
    pub id: i64,
    pub user_id: i64,
    pub student_id: Option<i64>,
    pub mode: String,
    pub status: String,
    pub total_questions: Option<i32>,
    pub current_question: Option<i32>,
    pub average_score: Option<f64>,
    pub max_score: Option<f64>,
    pub min_score: Option<f64>,
    pub duration_seconds: Option<i32>,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InterviewMessage {
    pub id: i64,
    pub session_id: i64,
    pub role: String,
    pub content: String,
    pub question_type: Option<String>,
    pub score: Option<f64>,
    pub feedback: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InterviewReport {
    pub id: i64,
    pub session_id: i64,
    pub user_id: i64,
    pub overall_score: f64,
    pub skill_score: Option<f64>,
    pub communication_score: Option<f64>,
    pub logic_score: Option<f64>,
    pub confidence_score: Option<f64>,
    pub strengths: Option<String>,
    pub weaknesses: Option<String>,
    pub improvement_suggestions: Option<String>,
    pub summary: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}