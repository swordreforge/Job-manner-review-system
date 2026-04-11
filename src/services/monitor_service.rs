use crate::services::{DatabaseStats, DbPool};
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize)]
pub struct SystemMetrics {
    pub timestamp: i64,
    pub uptime_seconds: u64,
    pub memory_usage_mb: u64,
    pub cpu_cores: usize,
    pub database_stats: DatabaseStats,
    pub database_connected: bool,
}

/// 获取系统指标
pub async fn get_system_metrics(pool: &DbPool) -> SystemMetrics {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let uptime_seconds = get_uptime();
    let memory_usage_mb = get_memory_usage();
    let cpu_cores = num_cpus::get();
    let database_connected = crate::services::check_connection(pool).await.unwrap_or(false);
    let database_stats = crate::services::get_database_stats(pool).await.unwrap_or(DatabaseStats {
        user_count: 0,
        student_count: 0,
        job_count: 0,
        interview_count: 0,
        report_count: 0,
    });

    SystemMetrics {
        timestamp,
        uptime_seconds,
        memory_usage_mb,
        cpu_cores,
        database_stats,
        database_connected,
    }
}

/// 获取系统运行时间（秒）
fn get_uptime() -> u64 {
    // 简化版本，实际应该从系统获取
    // 可以使用 libc::sysinfo 或其他系统调用
    0
}

/// 获取内存使用情况（MB）
fn get_memory_usage() -> u64 {
    // 简化版本，实际应该从系统获取
    // 可以使用 psutil 或类似的库
    0
}