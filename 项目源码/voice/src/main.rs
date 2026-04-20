mod xunfei;
mod audio;
mod server;
mod html;
mod config;

use anyhow::Result;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<()> {
    // 加载 .env 文件
    dotenv::dotenv().ok();

    // 解析命令行参数
    let config = config::Config::from_args_and_env()?;

    // 初始化日志
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "xunfei_asr_server=info,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("启动讯飞星火语音识别服务...");

    // 获取配置参数
    let app_id = config.get_app_id()?;
    let api_key = config.get_api_key()?;
    let api_secret = config.get_api_secret()?;

    info!("配置加载成功: APP ID = {}", app_id);
    info!("服务器地址: {}:{}", config.server_host, config.server_port);

    // 创建讯飞星火客户端
    let xunfei_client = xunfei::XunfeiClient::new(
        app_id,
        api_key,
        api_secret,
    );

    // 启动 Web 服务器
    server::run_server(xunfei_client, config).await
        .map_err(|e| {
            error!("服务器启动失败: {}", e);
            e
        })?;

    Ok(())
}