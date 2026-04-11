use async_trait::async_trait;
use sqlx::MySqlPool;

/// 数据库访问trait
#[async_trait]
pub trait Database {
    async fn get_pool(&self) -> &MySqlPool;
    async fn health_check(&self) -> bool;
}

/// 学生服务trait
#[async_trait]
pub trait StudentService: Send + Sync {
    async fn list(&self, page: u32, page_size: u32) -> anyhow::Result<Vec<Student>>;
    async fn get(&self, id: &str) -> anyhow::Result<Option<Student>>;
    async fn update(&self, id: &str, data: UpdateStudent) -> anyhow::Result<Student>;
    async fn delete(&self, id: &str) -> anyhow::Result<()>;
}

/// 测试服务trait
#[async_trait]
pub trait TestService: Send + Sync {
    async fn list(&self, page: u32, page_size: u32) -> anyhow::Result<Vec<TestRecord>>;
    async fn get(&self, id: &str) -> anyhow::Result<Option<TestRecord>>;
}

/// 认证服务trait
#[async_trait]
pub trait AuthService: Send + Sync {
    async fn login(&self, username: &str, password: &str) -> anyhow::Result<AuthToken>;
    async fn verify_token(&self, token: &str) -> anyhow::Result<bool>;
}

/// 运维服务trait
#[async_trait]
pub trait OpsService: Send + Sync {
    async fn get_status(&self) -> anyhow::Result<SystemStatus>;
    async fn create_backup(&self) -> anyhow::Result<BackupInfo>;
    async fn list_backups(&self) -> anyhow::Result<Vec<BackupInfo>>;
}

// 数据结构定义

#[derive(Debug, Clone)]
pub struct Student {
    pub id: String,
    pub name: String,
    pub student_id: String,
    pub class_name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct UpdateStudent {
    pub name: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Clone)]
pub struct TestRecord {
    pub id: String,
    pub student_id: String,
    pub test_type: String,
    pub score: f32,
    pub completed_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct AuthToken {
    pub token: String,
    pub user_id: String,
    pub username: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct SystemStatus {
    pub server: String,
    pub database: String,
    pub memory_usage: u64,
    pub cpu_usage: f32,
    pub uptime: u64,
}

#[derive(Debug, Clone)]
pub struct BackupInfo {
    pub backup_id: String,
    pub filename: String,
    pub size: u64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}