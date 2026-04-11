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
    // 初始化日志
    env_logger::init();
    
    // 使用应用构建器启动应用
    app::run_app().await
}
