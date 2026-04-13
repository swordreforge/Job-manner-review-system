use sqlx::{MySqlPool, SqlitePool};
use std::sync::Arc;

/// 应用状态，统一管理所有共享依赖
#[derive(Clone)]
pub struct AppState {
    pub sqlite_pool: Arc<SqlitePool>,
    pub mysql_pool: Arc<MySqlPool>,
    pub config: Arc<crate::config::Config>,
}

impl AppState {
    pub fn new(sqlite_pool: SqlitePool, mysql_pool: MySqlPool, config: crate::config::Config) -> Self {
        AppState {
            sqlite_pool: Arc::new(sqlite_pool),
            mysql_pool: Arc::new(mysql_pool),
            config: Arc::new(config),
        }
    }

    /// 获取 SQLite 连接池（用于登录功能）
    #[allow(dead_code)]
    pub fn sqlite_db(&self) -> &SqlitePool {
        &self.sqlite_pool
    }

    /// 获取 MySQL 连接池（用于管理功能）
    pub fn mysql_db(&self) -> &MySqlPool {
        &self.mysql_pool
    }

    /// 获取配置
    #[allow(dead_code)]
    pub fn config(&self) -> &crate::config::Config {
        &self.config
    }
}