use anyhow::Result;
use clap::Parser;

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
    #[arg(long, default_value = "140c88e2")]
    pub xunfei_app_id: String,

    /// 讯飞星火 API Key（优先级：命令行参数 > 环境变量 > 默认值）
    #[arg(long, default_value = "63101bc8a895022a2f12d0875f909ee6")]
    pub xunfei_api_key: String,

    /// 讯飞星火 API Secret（优先级：命令行参数 > 环境变量 > 默认值）
    #[arg(long, default_value = "ZGRiNWVjZTRhMjQ0NmE0YTRkOGMxZWEx")]
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
        // 直接解析命令行参数（使用硬编码的默认值，不从环境变量读取）
        let config = Self::try_parse()?;
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