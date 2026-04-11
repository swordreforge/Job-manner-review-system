use clap::Parser;

/// 教师端应用 - 系统监控和数据管理
#[derive(Parser, Debug, Clone, serde::Serialize)]
#[command(author, version, about, long_about = None)]
pub struct Config {
    /// 服务器监听地址
    #[arg(long, default_value = "127.0.0.1")]
    pub host: String,

    /// 服务器监听端口
    #[arg(long, default_value = "8848")]
    pub port: u16,

    /// 数据库主机地址
    #[arg(long, default_value = "127.0.0.1")]
    pub db_host: String,

    /// 数据库端口
    #[arg(long, default_value = "3306")]
    pub db_port: u16,

    /// 数据库名称
    #[arg(long, default_value = "career_db")]
    pub db_name: String,

    /// 数据库用户名
    #[arg(long, default_value = "root")]
    pub db_user: String,

    /// 数据库密码
    #[arg(long)]
    pub db_password: String,

    /// 日志级别
    #[arg(long, default_value = "info")]
    pub log_level: String,
}

impl Config {
    /// 获取数据库连接字符串
    pub fn database_url(&self) -> String {
        format!(
            "mysql://{}:{}@{}:{}/{}",
            self.db_user, self.db_password, self.db_host, self.db_port, self.db_name
        )
    }

    /// 获取服务器监听地址
    pub fn server_address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}