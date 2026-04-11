use serde::Deserialize;
use std::env;
use std::io::{self, Write};

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenv::dotenv().ok();

        let database_url = match env::var("DATABASE_URL") {
            Ok(url) => url,
            Err(_) => {
                // 环境变量不存在时，交互式询问数据库配置
                Self::prompt_database_config()?
            }
        };

        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

        let server_port = env::var("SERVER_PORT")
            .unwrap_or_else(|_| "8081".to_string())
            .parse()
            .map_err(|e| anyhow::anyhow!("Invalid SERVER_PORT: {}", e))?;

        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string());

        Ok(Config {
            database_url,
            server_host,
            server_port,
            jwt_secret,
        })
    }

    /// 交互式询问数据库配置
    fn prompt_database_config() -> anyhow::Result<String> {
        println!("DATABASE_URL 环境变量未设置");
        println!("请输入数据库配置信息：\n");

        let host = Self::prompt_input("数据库主机", "localhost");
        let port = Self::prompt_input("数据库端口", "3306");
        let username = Self::prompt_input("数据库用户名", "root");
        let password = Self::prompt_password("数据库密码");
        let database = Self::prompt_input("数据库名称", "career_db");

        let database_url = format!(
            "mysql://{}:{}@{}:{}/{}",
            username, password, host, port, database
        );

        println!("\n数据库连接信息已设置");
        Ok(database_url)
    }

    /// 询问普通输入
    fn prompt_input(prompt: &str, default: &str) -> String {
        print!("{} [默认: {}]: ", prompt, default);
        io::stdout().flush().unwrap();

        let mut input = String::new();
        io::stdin().read_line(&mut input).expect("读取输入失败");

        let input = input.trim();
        if input.is_empty() {
            default.to_string()
        } else {
            input.to_string()
        }
    }

    /// 询问密码输入（隐藏显示）
    fn prompt_password(prompt: &str) -> String {
        print!("{}: ", prompt);
        io::stdout().flush().unwrap();

        let password = rpassword::read_password().expect("读取密码失败");
        password.trim().to_string()
    }

    pub fn server_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}