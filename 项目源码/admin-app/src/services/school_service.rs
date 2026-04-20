use crate::db::SchoolRepository;
use crate::models::{CreateSchoolRequest, UpdateSchoolRequest, SchoolQuery, SchoolResponse};
use crate::state::AppState;
use anyhow::Result;

pub struct SchoolService {
    school_repo: SchoolRepository,
}

impl SchoolService {
    pub fn new(state: &AppState) -> Self {
        Self {
            school_repo: SchoolRepository::new(state.mysql_pool.clone()),
        }
    }

    pub async fn create_school(&self, req: CreateSchoolRequest) -> Result<(SchoolResponse, String)> {
        // 生成学校代码
        let school_code = self.generate_school_code().await?;

        let school = self.school_repo.create(req, school_code.clone()).await?;
        Ok((school.into(), school_code))
    }

    pub async fn get_school(&self, id: i64) -> Result<SchoolResponse> {
        let school = self.school_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("学校不存在"))?;
        Ok(school.into())
    }

    pub async fn list_schools(&self, query: SchoolQuery) -> Result<(Vec<SchoolResponse>, u64)> {
        let (schools, total) = self.school_repo.find_all(&query).await?;
        let responses: Vec<SchoolResponse> = schools.into_iter().map(|s| s.into()).collect();
        Ok((responses, total as u64))
    }

    pub async fn update_school(&self, id: i64, req: UpdateSchoolRequest) -> Result<SchoolResponse> {
        let school = self.school_repo.update(id, req).await?
            .ok_or_else(|| anyhow::anyhow!("学校不存在或更新失败"))?;
        Ok(school.into())
    }

    pub async fn delete_school(&self, id: i64) -> Result<()> {
        let deleted = self.school_repo.delete(id).await?;
        if !deleted {
            return Err(anyhow::anyhow!("学校不存在"));
        }
        Ok(())
    }

    pub async fn count_schools(&self) -> Result<u64> {
        Ok(self.school_repo.count().await? as u64)
    }

    /// 生成唯一的学校代码
    async fn generate_school_code(&self) -> Result<String> {
        let year = chrono::Utc::now().format("%y").to_string();
        let mut random_num;

        // 最多尝试 100 次
        for _ in 0..100 {
            random_num = rand::random::<u32>() % 10000;
            let code = format!("SCH{}{:04}", year, random_num);

            // 检查代码是否已存在
            let exists = self.school_repo.code_exists(&code).await?;
            if !exists {
                return Ok(code);
            }
        }

        Err(anyhow::anyhow!("无法生成唯一的学校代码，请稍后重试"))
    }
}