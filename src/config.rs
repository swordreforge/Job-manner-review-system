use clap::Parser;
use rand::Rng;
use serde::Deserialize;

fn generate_random_secret() -> String {
    const CHARSET: &[u8] =
        b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let mut rng = rand::thread_rng();
    (0..16)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

#[derive(Debug, Clone, Parser, Deserialize)]
#[command(name = "teacher-api")]
#[command(about = "教师端 API 服务", long_about = None)]
pub struct Config {
    /// SQLite 数据库连接字符串（用于登录功能）
    /// 默认在可执行文件同级目录创建 auth.db 文件
    /// 如需自定义，请使用完整路径，例如：sqlite:/path/to/custom.db
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

    /// JWT 密钥（不指定时自动生成16位随机密钥）
    #[arg(long)]
    pub jwt_secret: Option<String>,
}

impl Config {
    pub fn jwt_secret(&self) -> String {
        self.jwt_secret.clone().unwrap()
    }
}

impl Config {
    pub fn from_args() -> anyhow::Result<Self> {
        let mut config = Config::parse();
        if config.jwt_secret.is_none() {
            let secret = generate_random_secret();
            log::info!("自动生成 JWT secret: {}", secret);
            config.jwt_secret = Some(secret);
        }
        Ok(config)
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
