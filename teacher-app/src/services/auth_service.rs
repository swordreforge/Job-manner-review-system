use crate::db::UserRepository;
use crate::models::{LoginRequest, LoginResponse, Claims, TokenInfo};
use crate::state::AppState;
use anyhow::Result;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

/// 认证服务
pub struct AuthService {
    user_repo: UserRepository,
    jwt_secret: String,
}

impl AuthService {
    pub fn new(state: &AppState) -> Self {
        Self {
            user_repo: UserRepository::new(state.pool.clone()),
            jwt_secret: state.config.jwt_secret.clone(),
        }
    }

    /// 用户登录
    pub async fn login(&self, req: LoginRequest) -> Result<LoginResponse> {
        // 验证用户凭据
        let user = self
            .user_repo
            .verify_credentials(&req.username, &req.password)
            .await?
            .ok_or_else(|| anyhow::anyhow!("用户名或密码错误"))?;

        // 生成 JWT Token
        let token = self.generate_token(&user.id, &user.username, &user.role)?;

        Ok(LoginResponse {
            token,
            user,
        })
    }

    /// 生成 JWT Token
    fn generate_token(&self, user_id: &Uuid, username: &str, role: &str) -> Result<String> {
        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .expect("有效的时间戳")
            .timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            username: username.to_string(),
            role: role.to_string(),
            exp: expiration,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )?;

        Ok(token)
    }

    /// 验证 JWT Token
    pub fn verify_token(&self, token: &str) -> Result<TokenInfo> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::new(Algorithm::HS256),
        )?;

        let claims = token_data.claims;

        Ok(TokenInfo {
            user_id: Uuid::parse_str(&claims.sub)?,
            username: claims.username,
            role: claims.role,
        })
    }

    /// 刷新 Token
    pub fn refresh_token(&self, token: &str) -> Result<String> {
        let token_info = self.verify_token(token)?;
        self.generate_token(&token_info.user_id, &token_info.username, &token_info.role)
    }
}