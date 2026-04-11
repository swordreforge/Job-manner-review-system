use crate::db::StudentRepository;
use crate::models::{Student, CreateStudentRequest, UpdateStudentRequest, StudentQuery};
use crate::state::AppState;
use anyhow::Result;
use uuid::Uuid;

/// 学生服务
pub struct StudentService {
    student_repo: StudentRepository,
}

impl StudentService {
    pub fn new(state: &AppState) -> Self {
        Self {
            student_repo: StudentRepository::new(state.pool.clone()),
        }
    }

    /// 创建学生
    pub async fn create_student(&self, req: CreateStudentRequest) -> Result<Student> {
        // 检查学号是否已存在
        if let Some(_) = self
            .student_repo
            .find_by_student_no(&req.student_no)
            .await?
        {
            return Err(anyhow::anyhow!("学号已存在"));
        }

        // 创建学生
        let student = self.student_repo.create(req).await?;
        Ok(student)
    }

    /// 根据 ID 查询学生
    pub async fn get_student(&self, id: &Uuid) -> Result<Student> {
        self.student_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("学生不存在"))
    }

    /// 查询学生列表
    pub async fn list_students(&self, query: StudentQuery) -> Result<(Vec<Student>, u64)> {
        self.student_repo.find_all(&query).await
    }

    /// 更新学生
    pub async fn update_student(
        &self,
        id: &Uuid,
        req: UpdateStudentRequest,
    ) -> Result<Student> {
        // 检查学生是否存在
        let _ = self
            .student_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("学生不存在"))?;

        // 更新学生
        let student = self
            .student_repo
            .update(id, req)
            .await?
            .ok_or_else(|| anyhow::anyhow!("更新失败"))?;

        Ok(student)
    }

    /// 删除学生
    pub async fn delete_student(&self, id: &Uuid) -> Result<()> {
        // 检查学生是否存在
        let _ = self
            .student_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("学生不存在"))?;

        // 删除学生
        self.student_repo.delete(id).await?;
        Ok(())
    }

    /// 统计学生总数
    pub async fn count_students(&self) -> Result<u64> {
        self.student_repo.count().await
    }
}