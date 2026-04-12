use actix_web::{HttpResponse, Responder};
use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{System, Disks};
use once_cell::sync::Lazy;

static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| Mutex::new(System::new_all()));

#[derive(Serialize)]
pub struct SystemStatus {
    server: String,
    database: String,
    memory_used: u64,
    memory_total: u64,
    memory_usage: f32,
    cpu_usage: f32,
    uptime: u64,
    server_time: i64,
    disk_total: u64,
    disk_used: u64,
    disk_usage: f32,
}

pub async fn status() -> impl Responder {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let memory_used = sys.used_memory();
    let memory_total = sys.total_memory();
    let memory_usage = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    let cpu_usage = sys.global_cpu_usage();

    let disks = Disks::new_with_refreshed_list();
    let disk_list = disks.list();
    let disk_total: u64 = disk_list.iter().map(|d| d.total_space()).sum();
    let disk_used: u64 = disk_list.iter().map(|d| d.total_space() - d.available_space()).sum();
    let disk_usage = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    let uptime = System::uptime();
    let server_time = chrono::Utc::now().timestamp();

    let status = SystemStatus {
        server: "running".to_string(),
        database: "connected".to_string(),
        memory_used,
        memory_total,
        memory_usage,
        cpu_usage,
        uptime,
        server_time,
        disk_total,
        disk_used,
        disk_usage,
    };

    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": status
    }))
}

pub async fn backup() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": {
            "backup_id": "placeholder_backup_id",
            "filename": "backup.sql",
            "created_at": chrono::Utc::now()
        }
    }))
}

pub async fn list_backups() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": {
            "items": []
        }
    }))
}
