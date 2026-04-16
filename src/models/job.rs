use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Job {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub category: Option<String>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct JobResponse {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub category: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub created_at: i64,
}

impl From<Job> for JobResponse {
    fn from(j: Job) -> Self {
        JobResponse {
            id: j.id,
            name: j.name,
            description: j.description,
            company: j.company,
            industry: j.industry,
            category: j.category,
            location: j.location,
            salary_range: j.salary_range,
            created_at: j.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateJobRequest {
    pub name: String,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub category: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub requirements: Option<String>,
    pub growth_potential: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateJobRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub company: Option<String>,
    pub industry: Option<String>,
    pub category: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub skills: Option<String>,
    pub certificates: Option<String>,
    pub soft_skills: Option<String>,
    pub requirements: Option<String>,
    pub growth_potential: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct JobQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
    pub industry: Option<String>,
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BatchImportJobsRequest {
    pub file: String,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub total: u32,
    pub success: u32,
    pub failed: u32,
    pub errors: Vec<ImportError>,
}

#[derive(Debug, Serialize)]
pub struct ImportError {
    pub row: u32,
    pub message: String,
}
