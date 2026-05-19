use anyhow::Result;
use clap::Parser;
use std::env;

#[derive(Parser, Clone, Debug)]
#[command(
    name = "xunfei-asr-server",
    author = "iFlow CLI",
    version = "2.0.0",
    about = "讯飞星火语音识别服务 - Rust 单二进制版本",
    long_about = "基于讯飞星火语音识别 API 的中文语音识别服务，支持音频文件上传和实时录音识别"
)]
pub struct Config {
    /// 讯飞星火应用 ID（优先级：命令行参数 > 环境变量 > 默认值）
    #[arg(long, env = "XUNFEI_APP_ID", default_value = "")]
    pub xunfei_app_id: String,

    /// 讯飞星火 API Key（优先级：命令行参数 > 环境变量 > 默认值）
    #[arg(long, env = "XUNFEI_API_KEY", default_value = "")]
    pub xunfei_api_key: String,

    /// 讯飞星火 API Secret（优先级：命令行参数 > 环境变量 > 默认值）
    #[arg(long, env = "XUNFEI_API_SECRET", default_value = "")]
    pub xunfei_api_secret: String,

    /// 服务器监听地址
    #[arg(long, default_value = "0.0.0.0")]
    pub server_host: String,

    /// 服务器监听端口
    #[arg(long, default_value = "8000")]
    pub server_port: u16,
}

impl Config {
    pub fn from_args_and_env() -> Result<Self> {
        let mut config = Self::try_parse()?;

        if config.xunfei_app_id.is_empty() {
            if let Ok(v) = env::var("XUNFEI_APP_ID") {
                config.xunfei_app_id = v;
            }
        }
        if config.xunfei_api_key.is_empty() {
            if let Ok(v) = env::var("XUNFEI_API_KEY") {
                config.xunfei_api_key = v;
            }
        }
        if config.xunfei_api_secret.is_empty() {
            if let Ok(v) = env::var("XUNFEI_API_SECRET") {
                config.xunfei_api_secret = v;
            }
        }

        if config.xunfei_app_id.is_empty() || config.xunfei_api_key.is_empty() || config.xunfei_api_secret.is_empty() {
            anyhow::bail!("XUNFEI_APP_ID, XUNFEI_API_KEY, and XUNFEI_API_SECRET must be set via environment variables or command line flags");
        }

        Ok(config)
    }

    pub fn get_app_id(&self) -> Result<String> {
        Ok(self.xunfei_app_id.clone())
    }

    pub fn get_api_key(&self) -> Result<String> {
        Ok(self.xunfei_api_key.clone())
    }

    pub fn get_api_secret(&self) -> Result<String> {
        Ok(self.xunfei_api_secret.clone())
    }
}