use crate::models::{InterviewReport, InterviewMessage, InterviewSession};
use crate::services::DbPool;

/// 获取所有面试会话
pub async fn get_all_sessions(pool: &DbPool) -> Result<Vec<InterviewSession>, sqlx::Error> {
    let sessions = sqlx::query_as::<_, InterviewSession>(
        "SELECT * FROM interview_sessions ORDER BY created_at DESC"
    )
    .fetch_all(pool.as_ref())
    .await?;
    Ok(sessions)
}

/// 根据ID获取面试会话
pub async fn get_session_by_id(
    pool: &DbPool,
    id: i64,
) -> Result<Option<InterviewSession>, sqlx::Error> {
    let session = sqlx::query_as::<_, InterviewSession>(
        "SELECT * FROM interview_sessions WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool.as_ref())
    .await?;
    Ok(session)
}

/// 获取面试会话的消息
pub async fn get_session_messages(
    pool: &DbPool,
    session_id: i64,
) -> Result<Vec<InterviewMessage>, sqlx::Error> {
    let messages = sqlx::query_as::<_, InterviewMessage>(
        "SELECT * FROM interview_messages WHERE session_id = ? ORDER BY created_at ASC"
    )
    .bind(session_id)
    .fetch_all(pool.as_ref())
    .await?;
    Ok(messages)
}

/// 获取面试报告
pub async fn get_report_by_session(
    pool: &DbPool,
    session_id: i64,
) -> Result<Option<InterviewReport>, sqlx::Error> {
    let report = sqlx::query_as::<_, InterviewReport>(
        "SELECT * FROM interview_reports WHERE session_id = ?"
    )
    .bind(session_id)
    .fetch_optional(pool.as_ref())
    .await?;
    Ok(report)
}