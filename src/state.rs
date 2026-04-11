use sqlx::MySqlPool;
use std::sync::Arc;

/// 应用状态，统一管理所有共享依赖
#[derive(Clone)]
pub struct AppState {
    pub pool: Arc<MySqlPool>,
    pub config: Arc<crate::config::Config>,
}

impl AppState {
    pub fn new(pool: MySqlPool, config: crate::config::Config) -> Self {
        AppState {
            pool: Arc::new(pool),
            config: Arc::new(config),
        }
    }

    /// 获取数据库连接池
    pub fn db(&self) -> &MySqlPool {
        &self.pool
    }

    /// 获取配置
    pub fn config(&self) -> &crate::config::Config {
        &self.config
    }
}