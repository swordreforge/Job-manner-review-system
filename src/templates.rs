// 学生视图数据结构（用于模板显示）
pub struct StudentView {
    pub id: i64,
    pub name: String,
    pub education: String,
    pub major: String,
    pub graduation_year: String,
    pub completeness_formatted: String,
    pub competitiveness_formatted: String,
}

impl From<crate::models::Student> for StudentView {
    fn from(student: crate::models::Student) -> Self {
        Self {
            id: student.id,
            name: student.name,
            education: student.education.unwrap_or_else(|| "-".to_string()),
            major: student.major.unwrap_or_else(|| "-".to_string()),
            graduation_year: student.graduation_year.map(|y| y.to_string()).unwrap_or_else(|| "-".to_string()),
            completeness_formatted: format!("{:.1}", student.completeness_score),
            competitiveness_formatted: format!("{:.1}", student.competitiveness_score),
        }
    }
}

// 职位视图数据结构
pub struct JobView {
    pub id: i64,
    pub name: String,
    pub company: String,
    pub industry: String,
    pub location: String,
    pub salary_range: String,
}

impl From<crate::models::Job> for JobView {
    fn from(job: crate::models::Job) -> Self {
        Self {
            id: job.id,
            name: job.name,
            company: job.company.unwrap_or_else(|| "-".to_string()),
            industry: job.industry.unwrap_or_else(|| "-".to_string()),
            location: job.location.unwrap_or_else(|| "-".to_string()),
            salary_range: job.salary_range.unwrap_or_else(|| "-".to_string()),
        }
    }
}

// 面试会话视图数据结构
pub struct InterviewSessionView {
    pub id: i64,
    pub user_id: i64,
    pub student_id: String,
    pub status: String,
    pub mode: String,
    pub average_score: String,
}

impl From<crate::models::InterviewSession> for InterviewSessionView {
    fn from(session: crate::models::InterviewSession) -> Self {
        Self {
            id: session.id,
            user_id: session.user_id,
            student_id: session.student_id.map(|id| id.to_string()).unwrap_or_else(|| "-".to_string()),
            status: session.status,
            mode: session.mode,
            average_score: session.average_score.map(|s| format!("{:.2}", s)).unwrap_or_else(|| "0.00".to_string()),
        }
    }
}

// 面试会话详情视图数据结构
pub struct InterviewSessionDetailView {
    pub id: i64,
    pub user_id: i64,
    pub student_id: String,
    pub mode: String,
    pub status: String,
    pub average_score: String,
    pub max_score: String,
    pub min_score: String,
}

impl From<crate::models::InterviewSession> for InterviewSessionDetailView {
    fn from(session: crate::models::InterviewSession) -> Self {
        Self {
            id: session.id,
            user_id: session.user_id,
            student_id: session.student_id.map(|id| id.to_string()).unwrap_or_else(|| "-".to_string()),
            mode: session.mode,
            status: session.status,
            average_score: session.average_score.map(|s| format!("{:.2}", s)).unwrap_or_else(|| "0.00".to_string()),
            max_score: session.max_score.map(|s| format!("{:.2}", s)).unwrap_or_else(|| "0.00".to_string()),
            min_score: session.min_score.map(|s| format!("{:.2}", s)).unwrap_or_else(|| "0.00".to_string()),
        }
    }
}

// 面试消息视图数据结构
pub struct InterviewMessageView {
    pub role: String,
    pub role_display: String,
    pub content: String,
    pub created_at: String,
    pub score: String,
    pub show_score: bool,
}

impl From<crate::models::InterviewMessage> for InterviewMessageView {
    fn from(message: crate::models::InterviewMessage) -> Self {
        let role_display = match message.role.as_str() {
            "user" => "用户",
            "student" => "学生",
            "ai" => "AI",
            _ => &message.role,
        }.to_string();

        let created_at = chrono::DateTime::from_timestamp(message.created_at, 0)
            .map(|dt| dt.format("%H:%M:%S").to_string())
            .unwrap_or_else(|| "未知".to_string());

        let score = message.score.map(|s| format!("{:.2}", s)).unwrap_or_else(|| String::new());
        let show_score = message.score.is_some();

        Self {
            role: message.role,
            role_display,
            content: message.content,
            created_at,
            score,
            show_score,
        }
    }
}

use askama::Template;
use crate::services::DatabaseStats;

#[derive(Template)]
#[template(path = "pages/dashboard.html")]
pub struct DashboardTemplate {
    pub database_connected: bool,
    pub user_count: i64,
    pub student_count: i64,
    pub job_count: i64,
    pub interview_count: i64,
    pub report_count: i64,
    pub cpu_cores: usize,
    pub memory_usage_mb: u64,
    pub uptime_seconds: u64,
    pub update_time: String,
}

impl DashboardTemplate {
    pub fn from_metrics(
        db_connected: bool,
        db_stats: DatabaseStats,
        cpu_cores: usize,
        memory_usage_mb: u64,
        uptime_seconds: u64,
    ) -> Self {
        let update_time = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        Self {
            database_connected: db_connected,
            user_count: db_stats.user_count,
            student_count: db_stats.student_count,
            job_count: db_stats.job_count,
            interview_count: db_stats.interview_count,
            report_count: db_stats.report_count,
            cpu_cores,
            memory_usage_mb,
            uptime_seconds,
            update_time,
        }
    }
}

#[derive(Template)]
#[template(path = "pages/students.html")]
pub struct StudentsTemplate {
    pub students: Vec<StudentView>,
    pub total_count: usize,
    pub avg_completeness_formatted: String,
    pub avg_competitiveness_formatted: String,
}

impl StudentsTemplate {
    pub fn new(students: Vec<crate::models::Student>) -> Self {
        let total_count = students.len();
        let avg_completeness = if students.is_empty() {
            0.0
        } else {
            students.iter().map(|s| s.completeness_score).sum::<f64>() / total_count as f64
        };
        let avg_competitiveness = if students.is_empty() {
            0.0
        } else {
            students.iter().map(|s| s.competitiveness_score).sum::<f64>() / total_count as f64
        };

        Self {
            students: students.into_iter().map(StudentView::from).collect(),
            total_count,
            avg_completeness_formatted: format!("{:.1}", avg_completeness),
            avg_competitiveness_formatted: format!("{:.1}", avg_competitiveness),
        }
    }
}

#[derive(Template)]
#[template(path = "pages/jobs.html")]
pub struct JobsTemplate {
    pub jobs: Vec<JobView>,
    pub total_count: usize,
}

impl JobsTemplate {
    pub fn new(jobs: Vec<crate::models::Job>) -> Self {
        let total_count = jobs.len();
        Self {
            jobs: jobs.into_iter().map(JobView::from).collect(),
            total_count,
        }
    }
}

#[derive(Template)]
#[template(path = "pages/interviews.html")]
pub struct InterviewsTemplate {
    pub sessions: Vec<InterviewSessionView>,
    pub total_count: usize,
    pub avg_score_formatted: String,
}

impl InterviewsTemplate {
    pub fn new(sessions: Vec<crate::models::InterviewSession>) -> Self {
        let total_count = sessions.len();
        let avg_score = if sessions.is_empty() {
            0.0
        } else {
            let sum: f64 = sessions.iter().filter_map(|s| s.average_score).sum();
            let count = sessions.iter().filter(|s| s.average_score.is_some()).count();
            if count > 0 { sum / count as f64 } else { 0.0 }
        };

        Self {
            sessions: sessions.into_iter().map(InterviewSessionView::from).collect(),
            total_count,
            avg_score_formatted: format!("{:.2}", avg_score),
        }
    }
}

#[derive(Template)]
#[template(path = "pages/interview_view.html")]
pub struct InterviewViewTemplate {
    pub session: Option<InterviewSessionDetailView>,
    pub messages: Vec<InterviewMessageView>,
    pub id: i64,
}

impl InterviewViewTemplate {
    pub fn new(
        session: Option<crate::models::InterviewSession>,
        messages: Vec<crate::models::InterviewMessage>,
        id: i64,
    ) -> Self {
        Self {
            session: session.map(InterviewSessionDetailView::from),
            messages: messages.into_iter().map(InterviewMessageView::from).collect(),
            id,
        }
    }
}

// 自定义过滤器：格式化时间戳
mod filters {
    pub fn timestamp_format(timestamp: i64) -> ::askama::Result<String> {
        Ok(chrono::DateTime::from_timestamp(timestamp, 0)
            .map(|dt| dt.format("%H:%M:%S").to_string())
            .unwrap_or_else(|| "未知".to_string()))
    }
}