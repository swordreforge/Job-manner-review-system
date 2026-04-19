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

    pub async fn import_jobs(&self, reqs: Vec<CreateJobRequest>) -> Result<(u32, u32)> {
        let codes_to_check: Vec<String> = reqs.iter()
            .filter_map(|r| r.job_code.as_ref().filter(|c| !c.is_empty()).cloned())
            .collect();

        let existing_codes = self.job_repo.exists_by_job_codes(&codes_to_check).await?;

        let mut duplicate_count = 0u32;
        let filtered: Vec<CreateJobRequest> = reqs.into_iter().filter(|req| {
            if let Some(ref code) = req.job_code {
                if !code.is_empty() && existing_codes.contains(code) {
                    log::info!("岗位编码 {} 已存在，跳过", code);
                    duplicate_count += 1;
                    return false;
                }
            }
            true
        }).collect();

        if duplicate_count > 0 {
            log::info!("跳过已存在的岗位编码: {} 条", duplicate_count);
        }

        let (success, failed) = self.job_repo.create_many(filtered).await?;
        Ok((success, failed + duplicate_count))
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
        let job = self.job_repo.update(id, req).await?
            .ok_or_else(|| anyhow::anyhow!("岗位不存在或更新失败"))?;
        Ok(job.into())
    }

    pub async fn delete_job(&self, id: i64) -> Result<()> {
        let deleted = self.job_repo.delete(id).await?;
        if !deleted {
            return Err(anyhow::anyhow!("岗位不存在"));
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn count_jobs(&self) -> Result<u64> {
        Ok(self.job_repo.count().await? as u64)
    }
}
