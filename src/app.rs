use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger};

use crate::config::Config;
use crate::db::create_pool;
use crate::state::AppState;
use crate::routes::configure_routes;

/// 应用构建器，提供链式配置接口
pub struct AppBuilder {
    config: Option<Config>,
}

impl Default for AppBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl AppBuilder {
    /// 创建新的应用构建器
    pub fn new() -> Self {
        AppBuilder {
            config: None,
        }
    }

    /// 设置配置
    pub fn with_config(mut self, config: Config) -> Self {
        self.config = Some(config);
        self
    }

    /// 从环境变量加载配置
    pub fn load_config_from_env(mut self) -> anyhow::Result<Self> {
        let config = Config::from_env()?;
        self.config = Some(config);
        Ok(self)
    }

    /// 构建并启动应用
    pub async fn build_and_run(self) -> anyhow::Result<()> {
        let config = self.config.ok_or_else(|| anyhow::anyhow!("Config not set"))?;
        
        // 创建数据库连接池
        let db_pool = create_pool(&config.database_url).await?;
        
        // 创建应用状态
        let state = AppState::new(db_pool, config.clone());

        // 启动HTTP服务器
        let server = HttpServer::new(move || {
            // 配置CORS（每次创建新实例）
            let cors = Cors::permissive();

            App::new()
                // 添加应用状态
                .app_data(web::Data::new(state.clone()))
                // 添加中间件
                .wrap(cors)
                .wrap(Logger::default())
                // 配置路由
                .configure(configure_routes)
        })
        .bind(&config.server_address())?
        .run();

        log::info!("Teacher API server started on {}", config.server_address());
        
        server.await?;
        
        Ok(())
    }
}

/// 快捷启动函数
pub async fn run_app() -> anyhow::Result<()> {
    AppBuilder::new()
        .load_config_from_env()?
        .build_and_run()
        .await
}