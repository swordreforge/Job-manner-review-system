mod app;
mod config;
mod db;
mod embedded;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod state;
mod traits;
mod utils;

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志，默认级别 INFO
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp_millis()
        .init();

    log::info!("==========================================");
    log::info!("教师端管理系统 v1.0.0");
    log::info!("正在初始化系统...");
    log::info!("==========================================");

    // 使用应用构建器启动应用
    app::run_app().await
}
