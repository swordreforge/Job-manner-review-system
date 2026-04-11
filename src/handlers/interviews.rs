use crate::services::{get_all_sessions, get_session_by_id, get_session_messages, DbPool};
use crate::templates::{InterviewsTemplate, InterviewViewTemplate};
use axum::extract::{Path, State};

/// 面试管理页面
pub async fn interviews_index(State(pool): State<DbPool>) -> InterviewsTemplate {
    let sessions = get_all_sessions(&pool).await.unwrap_or_default();
    InterviewsTemplate::new(sessions)
}

/// 面试详情页面
pub async fn interview_view(Path(id): Path<i64>, State(pool): State<DbPool>) -> InterviewViewTemplate {
    let session = get_session_by_id(&pool, id).await.ok().flatten();
    let messages = if let Some(ref session) = session {
        get_session_messages(&pool, session.id).await.unwrap_or_default()
    } else {
        vec![]
    };

    InterviewViewTemplate::new(session, messages, id)
}