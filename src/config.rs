use clap::Parser;
use serde::Deserialize;

#[derive(Debug, Clone, Parser, Deserialize)]
#[command(name = "teacher-api")]
#[command(about = "教师端 API 服务", long_about = None)]
pub struct Config {
    /// SQLite 数据库连接字符串（用于登录功能）
    #[arg(long, default_value = "sqlite:auth.db")]
    pub sqlite_database_url: String,

    /// MySQL 数据库主机地址
    #[arg(long, default_value = "localhost")]
    pub mysql_host: String,

    /// MySQL 数据库端口
    #[arg(long, default_value = "3306")]
    pub mysql_port: u16,

    /// MySQL 数据库用户名
    #[arg(long, default_value = "root")]
    pub mysql_username: String,

    /// MySQL 数据库密码
    #[arg(long, default_value = "")]
    pub mysql_password: String,

    /// MySQL 数据库名称
    #[arg(long, default_value = "career_db")]
    pub mysql_database: String,

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

    /// 获取 MySQL 数据库连接字符串
    pub fn mysql_database_url(&self) -> String {
        format!(
            "mysql://{}:{}@{}:{}/{}",
            self.mysql_username,
            self.mysql_password,
            self.mysql_host,
            self.mysql_port,
            self.mysql_database
        )
    }

    pub fn server_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}