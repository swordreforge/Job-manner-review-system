use clap::Parser;
use serde::Deserialize;

#[derive(Debug, Clone, Parser, Deserialize)]
#[command(name = "teacher-api")]
#[command(about = "教师端 API 服务", long_about = None)]
pub struct Config {
    /// SQLite 数据库连接字符串（用于登录功能）
    #[arg(long, default_value = "sqlite:auth.db")]
    pub sqlite_database_url: String,

    /// MySQL 数据库连接字符串（用于管理功能）
    #[arg(long)]
    pub mysql_database_url: String,

    /// 服务器监听地址
    #[arg(long, default_value = "127.0.0.1")]
    pub server_host: String,

    /// 服务器监听端口
    #[arg(long, default_value = "8081")]
    pub server_port: u16,

    /// JWT 密钥
    #[arg(long, default_value = "your-secret-key-change-in-production")]
    pub jwt_secret: String,
}

impl Config {
    pub fn from_args() -> anyhow::Result<Self> {
        Ok(Config::parse())
    }

    pub fn server_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}