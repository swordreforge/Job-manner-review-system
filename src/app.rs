use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger};

use crate::config::Config;
use crate::db::{create_sqlite_pool, create_mysql_pool, ensure_database_initialized};
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
    #[allow(dead_code)]
    pub fn with_config(mut self, config: Config) -> Self {
        self.config = Some(config);
        self
    }

    /// 从命令行参数加载配置
    pub fn load_config_from_args(mut self) -> anyhow::Result<Self> {
        let config = Config::from_args()?;
        self.config = Some(config);
        Ok(self)
    }

    /// 构建并启动应用
    pub async fn build_and_run(self) -> anyhow::Result<()> {
        let config = self.config.ok_or_else(|| anyhow::anyhow!("Config not set"))?;

        // 打印启动信息
        log::info!("==========================================");
        log::info!("启动教师端管理系统...");
        log::info!("==========================================");
        log::info!("服务器配置:");
        log::info!("  主机: {}", config.host);
        log::info!("  端口: {}", config.port);
        log::info!("  地址: {}", config.server_address());
        log::info!("数据库配置:");
        log::info!("  MySQL 主机: {}:{}", config.mysql_host, config.mysql_port);
        log::info!("  MySQL 数据库: {}", config.mysql_database);
        log::info!("  MySQL 用户: {}", config.mysql_username);
        log::info!("==========================================");

        // 获取当前可执行文件的路径
        let exe_path = std::env::current_exe()?;
        let exe_dir = exe_path.parent().unwrap_or_else(|| std::path::Path::new("."));

        // 在可执行文件同级目录创建数据库文件
        let db_path = exe_dir.join("auth.db");

        // 如果数据库文件不存在，先创建一个空文件
        if !db_path.exists() {
            std::fs::File::create(&db_path)?;
            log::info!("创建数据库文件: {}", db_path.display());
        }

        let db_url = format!("sqlite:{}", db_path.display());
        log::info!("数据库文件路径: {}", db_path.display());

        // 创建 SQLite 连接池（用于登录）
        let sqlite_pool = create_sqlite_pool(&db_url).await?;
        log::info!("SQLite database connected for authentication");

        // 自动初始化数据库（如果需要）
        ensure_database_initialized(&sqlite_pool).await?;

        // 创建 MySQL 连接池（用于管理功能）
        let mysql_pool = create_mysql_pool(&config.mysql_database_url()).await?;
        log::info!("MySQL database connected for management");

        // 创建应用状态
        let state = AppState::new(sqlite_pool, mysql_pool, config.clone());

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

        log::info!("==========================================");
        log::info!("服务器已成功启动!");
        log::info!("==========================================");
        log::info!("访问地址:");
        log::info!("  本地访问: http://{}", config.server_address());
        log::info!("==========================================");

        server.await?;

        Ok(())
    }
}

/// 快捷启动函数
pub async fn run_app() -> anyhow::Result<()> {
    AppBuilder::new()
        .load_config_from_args()?
        .build_and_run()
        .await
}