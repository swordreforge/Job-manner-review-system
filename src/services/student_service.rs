use crate::db::StudentRepository;
use crate::models::{CreateStudentRequest, UpdateStudentRequest, StudentQuery, StudentResponse};
use crate::state::AppState;
use anyhow::Result;

pub struct StudentService {
    student_repo: StudentRepository,
}

impl StudentService {
    pub fn new(state: &AppState) -> Self {
        Self {
            student_repo: StudentRepository::new(state.mysql_pool.clone()),
        }
    }

    pub async fn create_student(&self, user_id: i64, req: CreateStudentRequest) -> Result<StudentResponse> {
        let student = self.student_repo.create(user_id, req).await?;
        Ok(student.into())
    }

    pub async fn get_student(&self, id: i64) -> Result<StudentResponse> {
        let student = self.student_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("学生不存在"))?;
        Ok(student.into())
    }

    pub async fn list_students(&self, query: StudentQuery) -> Result<(Vec<StudentResponse>, u64)> {
        let (students, total) = self.student_repo.find_all(&query).await?;
        let responses: Vec<StudentResponse> = students.into_iter().map(|s| s.into()).collect();
        Ok((responses, total as u64))
    }

    pub async fn update_student(&self, id: i64, req: UpdateStudentRequest) -> Result<StudentResponse> {
        let _ = self.student_repo.find_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("学生不存在"))?;

        let student = self.student_repo.update(id, req).await?
            .ok_or_else(|| anyhow::anyhow!("更新失败"))?;

        Ok(student.into())
    }

    pub async fn delete_student(&self, id: i64) -> Result<()> {
        let _ = self.student_repo.find_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("学生不存在"))?;

        self.student_repo.delete(id).await?;
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn count_students(&self) -> Result<u64> {
        Ok(self.student_repo.count().await? as u64)
    }
}
