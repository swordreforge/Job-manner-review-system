use crate::db::JobRepository;
use crate::models::{CreateJobRequest, UpdateJobRequest, JobQuery, JobResponse};
use crate::state::AppState;
use anyhow::Result;

pub struct JobService {
    job_repo: JobRepository,
}

impl JobService {
    pub fn new(state: &AppState) -> Self {
        Self {
            job_repo: JobRepository::new(state.mysql_pool.clone()),
        }
    }

    pub async fn create_job(&self, req: CreateJobRequest) -> Result<JobResponse> {
        let job = self.job_repo.create(req).await?;
        Ok(job.into())
    }

    pub async fn get_job(&self, id: i64) -> Result<JobResponse> {
        let job = self.job_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("岗位不存在"))?;
        Ok(job.into())
    }

    pub async fn list_jobs(&self, query: JobQuery) -> Result<(Vec<JobResponse>, u64)> {
        let (jobs, total) = self.job_repo.find_all(&query).await?;
        let responses: Vec<JobResponse> = jobs.into_iter().map(|j| j.into()).collect();
        Ok((responses, total as u64))
    }

    pub async fn update_job(&self, id: i64, req: UpdateJobRequest) -> Result<JobResponse> {
        let _ = self.job_repo.find_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("岗位不存在"))?;

        let job = self.job_repo.update(id, req).await?
            .ok_or_else(|| anyhow::anyhow!("更新失败"))?;

        Ok(job.into())
    }

    pub async fn delete_job(&self, id: i64) -> Result<()> {
        let _ = self.job_repo.find_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("岗位不存在"))?;

        self.job_repo.delete(id).await?;
        Ok(())
    }

    pub async fn count_jobs(&self) -> Result<u64> {
        Ok(self.job_repo.count().await? as u64)
    }
}
