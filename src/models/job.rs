use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Job {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub requirements: Option<String>,
    pub growth_potential: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobCreateInfo {
    pub name: String,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub skills: Option<String>,
    pub requirements: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobUpdateInfo {
    pub name: Option<String>,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub requirements: Option<String>,
    pub growth_potential: Option<String>,
}