use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// 用户数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub password_hash: String,
    pub name: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    /// 检查密码是否正确
    pub fn verify_password(&self, password: &str) -> Result<bool, bcrypt::BcryptError> {
        bcrypt::verify(password, &self.password_hash)
    }
}

/// 用户响应(不包含密码)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub name: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

/// 登录请求
#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1, max = 50))]
    pub username: String,
    #[validate(length(min = 6, max = 100))]
    pub password: String,
}

/// 登录响应
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

/// 创建用户请求
#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 1, max = 50))]
    pub username: String,
    #[validate(length(min = 6, max = 100))]
    pub password: String,
    #[validate(length(min = 1, max = 50))]
    pub name: String,
    pub role: Option<String>,
}

/// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // user_id
    pub username: String,
    pub role: String,
    pub exp: usize,   // 过期时间
}

/// Token 信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenInfo {
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
}