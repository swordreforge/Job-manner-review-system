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

#[derive(Debug, Serialize, Deserialize)]
pub struct StudentResponse {
    pub id: i64,
    pub name: String,
    pub education: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
    pub skills: Option<serde_json::Value>,
    pub certificates: Option<serde_json::Value>,
    pub completeness_score: f64,
    pub competitiveness_score: f64,
    pub created_at: i64,
}

impl From<Student> for StudentResponse {
    fn from(s: Student) -> Self {
        let skills = s.skills.as_ref().and_then(|v| serde_json::from_str(v).ok());
        let certificates = s
            .certificates
            .as_ref()
            .and_then(|v| serde_json::from_str(v).ok());

        StudentResponse {
            id: s.id,
            name: s.name,
            education: s.education,
            major: s.major,
            graduation_year: s.graduation_year,
            skills,
            certificates,
            completeness_score: s.completeness_score,
            competitiveness_score: s.competitiveness_score,
            created_at: s.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateStudentRequest {
    pub name: String,
    pub education: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub internship: Option<String>,
    pub projects: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStudentRequest {
    pub name: Option<String>,
    pub education: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub internship: Option<String>,
    pub projects: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StudentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
}
