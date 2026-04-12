use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub sqlite_database_url: String,
    pub mysql_database_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenv::dotenv().ok();

        let sqlite_database_url = env::var("SQLITE_DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:auth.db".to_string());

        let mysql_database_url = env::var("MYSQL_DATABASE_URL")
            .map_err(|_| anyhow::anyhow!("MYSQL_DATABASE_URL 环境变量未设置，请在 .env 文件中配置或通过环境变量传递"))?;

        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

        let server_port = env::var("SERVER_PORT")
            .unwrap_or_else(|_| "8081".to_string())
            .parse()
            .map_err(|e| anyhow::anyhow!("Invalid SERVER_PORT: {}", e))?;

        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string());

        Ok(Config {
            sqlite_database_url,
            mysql_database_url,
            server_host,
            server_port,
            jwt_secret,
        })
    }

    pub fn server_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}