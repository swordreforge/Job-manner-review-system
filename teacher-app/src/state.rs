use sqlx::MySqlPool;
use std::sync::Arc;

/// 应用状态，统一管理所有共享依赖
#[derive(Clone)]
pub struct AppState {
    pub db_pool: Arc<MySqlPool>,
    pub config: Arc<crate::config::Config>,
}

impl AppState {
    pub fn new(db_pool: MySqlPool, config: crate::config::Config) -> Self {
        AppState {
            db_pool: Arc::new(db_pool),
            config: Arc::new(config),
        }
    }

    /// 获取数据库连接池
    pub fn db(&self) -> &MySqlPool {
        &self.db_pool
    }

    /// 获取配置
    pub fn config(&self) -> &crate::config::Config {
        &self.config
    }
}

/// 应用状态扩展trait，为其他模块提供便捷访问
pub trait AppStateExt {
    fn db(&self) -> &MySqlPool;
    fn config(&self) -> &crate::config::Config;
}

impl AppStateExt for AppState {
    fn db(&self) -> &MySqlPool {
        &self.db_pool
    }

    fn config(&self) -> &crate::config::Config {
        &self.config
    }
}