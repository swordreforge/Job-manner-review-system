use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Student {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub education: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub internship: Option<String>,
    pub projects: Option<String>,
    pub completeness_score: f64,
    pub competitiveness_score: f64,
    pub resume_url: Option<String>,
    pub suggestions: Option<String>,
    pub resume_content: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentCreateInfo {
    pub user_id: i64,
    pub name: String,
    pub education: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentUpdateInfo {
    pub education: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub internship: Option<String>,
    pub projects: Option<String>,
    pub resume_url: Option<String>,
}