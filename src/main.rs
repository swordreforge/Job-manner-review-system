mod config;
mod models;
mod services;
mod handlers;
mod static_assets;
mod templates;

use axum::{
    routing::{get, Router},
    http::Method,
};
use clap::Parser;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;
use services::create_pool;
use handlers::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 解析命令行参数
    let config = Config::parse();

    // 初始化日志
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(&config.log_level)),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("🚀 教师端应用启动中...");
    info!("📡 服务器地址: {}", config.server_address());
    info!("💾 数据库: {}@{}:{}/{}",
        config.db_user,
        config.db_host,
        config.db_port,
        config.db_name
    );

    // 创建数据库连接池
    let pool = create_pool(&config.database_url()).await?;
    info!("✅ 数据库连接成功");

    // 创建路由
    let app = create_router(pool, config.clone());

    // 启动服务器
    let listener = tokio::net::TcpListener::bind(&config.server_address()).await?;
    info!("🎉 服务器启动成功，访问地址: http://{}", config.server_address());

    axum::serve(listener, app).await?;

    Ok(())
}

fn create_router(pool: services::DbPool, _config: Config) -> Router {
    // 配置 CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    Router::new()
        // 页面路由
        .route("/", get(dashboard_index))
        .route("/students", get(students_index))
        .route("/jobs", get(jobs_index))
        .route("/interviews", get(interviews_index))
        .route("/interviews/view/:id", get(interview_view))
        // API 路由
        .route("/api/metrics", get(api_system_metrics))
        // 中间件
        .layer(cors)
        .with_state(pool)
}