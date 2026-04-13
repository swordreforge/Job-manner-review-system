use actix_web::{web, HttpRequest, HttpResponse, Responder};
use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{System, Disks, ProcessesToUpdate};
use once_cell::sync::Lazy;
use futures_util::StreamExt;

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
    process_count: usize,
}

/// 备份请求参数
#[derive(serde::Deserialize)]
pub struct BackupRequest {
    /// 备份文件输出目录（可选，默认为当前目录）
    pub output_dir: Option<String>,
}

/// 恢复请求参数
#[derive(serde::Deserialize)]
pub struct RestoreRequest {
    /// 备份文件名
    pub filename: String,
    /// 备份文件目录（可选，默认为当前目录）
    pub backup_dir: Option<String>,
}

/// 列出备份文件请求参数
#[derive(serde::Deserialize)]
pub struct ListBackupsRequest {
    /// 备份文件目录（可选，默认为当前目录）
    pub backup_dir: Option<String>,
}

pub async fn status() -> impl Responder {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    sys.refresh_processes(ProcessesToUpdate::All, true);

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
    let process_count = sys.processes().len();

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
        process_count,
    };

    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": status
    }))
}

/// 数据库备份接口
pub async fn backup(
    state: web::Data<crate::state::AppState>,
    req: web::Json<BackupRequest>,
) -> impl Responder {
    let output_dir = req.output_dir.as_deref().unwrap_or(".");

    match state.backup_database(output_dir).await {
        Ok(backup_path) => {
            let path = std::path::Path::new(&backup_path);
            let filename = path.file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("backup.sql")
                .to_string();
            
            let metadata = std::fs::metadata(&backup_path);
            let file_size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            let created_at = metadata
                .ok()
                .and_then(|m| m.created().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64);

            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Database backup completed successfully",
                "data": {
                    "backup_id": uuid::Uuid::new_v4().to_string(),
                    "filename": filename,
                    "file_path": backup_path,
                    "file_size": file_size,
                    "created_at": created_at
                }
            }))
        }
        Err(e) => {
            log::error!("Backup failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Backup failed: {}", e),
                "data": null
            }))
        }
    }
}

/// 数据库恢复接口
pub async fn restore(
    state: web::Data<crate::state::AppState>,
    req: web::Json<RestoreRequest>,
) -> impl Responder {
    let backup_dir = req.backup_dir.as_deref().unwrap_or(".");
    let backup_file = format!("{}/{}", backup_dir, req.filename);

    match state.restore_database(&backup_file).await {
        Ok(_) => {
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Database restored successfully",
                "data": {
                    "filename": req.filename,
                    "restored_at": chrono::Utc::now().timestamp()
                }
            }))
        }
        Err(e) => {
            log::error!("Restore failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Restore failed: {}", e),
                "data": null
            }))
        }
    }
}

/// 列出备份文件接口
pub async fn list_backups(
    state: web::Data<crate::state::AppState>,
    query: web::Query<ListBackupsRequest>,
) -> impl Responder {
    let backup_dir = query.backup_dir.as_deref().unwrap_or(".");

    match state.list_backups(backup_dir) {
        Ok(backups) => {
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "success",
                "data": {
                    "items": backups,
                    "total": backups.len()
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to list backups: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to list backups: {}", e),
                "data": null
            }))
        }
    }
}

/// 下载备份文件接口
pub async fn download_backup(
    req: HttpRequest,
    query: web::Query<ListBackupsRequest>,
    filename: web::Path<String>,
) -> impl Responder {
    let backup_dir = query.backup_dir.as_deref().unwrap_or(".");
    let backup_file = format!("{}/{}", backup_dir, filename.into_inner());

    let path = std::path::Path::new(&backup_file);
    
    if !path.exists() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "code": 404,
            "message": "Backup file not found",
            "data": null
        }));
    }

    match actix_files::NamedFile::open(path) {
        Ok(file) => {
            file.set_content_type(mime_guess::mime::APPLICATION_OCTET_STREAM)
                .disable_content_disposition()
                .into_response(&req)
        }
        Err(e) => {
            log::error!("Failed to open backup file: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": "Failed to open backup file",
                "data": null
            }))
        }
    }
}

/// 删除备份文件接口
pub async fn delete_backup(
    query: web::Query<ListBackupsRequest>,
    filename: web::Path<String>,
) -> impl Responder {
    let backup_dir = query.backup_dir.as_deref().unwrap_or(".");
    let filename_value = filename.into_inner();
    let backup_file = format!("{}/{}", backup_dir, filename_value);

    let path = std::path::Path::new(&backup_file);
    
    // 检查文件是否存在
    if !path.exists() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "code": 404,
            "message": "Backup file not found",
            "data": null
        }));
    }

    // 删除文件
    match std::fs::remove_file(path) {
        Ok(_) => {
            log::info!("Backup file deleted successfully: {}", backup_file);
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Backup file deleted successfully",
                "data": {
                    "filename": filename_value,
                    "deleted_at": chrono::Utc::now().timestamp()
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to delete backup file: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to delete backup file: {}", e),
                "data": null
            }))
        }
    }
}

/// 上传备份文件接口
pub async fn upload_backup(
    mut payload: actix_multipart::Multipart,
    query: web::Query<ListBackupsRequest>,
) -> impl Responder {
    let backup_dir = query.backup_dir.as_deref().unwrap_or(".");
    
    // 创建备份目录
    if let Err(e) = std::fs::create_dir_all(backup_dir) {
        log::error!("Failed to create backup directory: {}", e);
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "code": 500,
            "message": format!("Failed to create backup directory: {}", e),
            "data": null
        }));
    }

    let mut uploaded_filename = String::new();
    let mut file_size: u64 = 0;

    // 处理multipart上传
    while let Some(field_result) = payload.next().await {
        match field_result {
            Ok(mut field) => {
                let content_disposition = field.content_disposition();
                let filename = match content_disposition {
                    Some(cd) => cd.get_filename()
                        .map(|f| f.to_string())
                        .unwrap_or_else(|| {
                            // 如果没有文件名，生成一个
                            let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
                            format!("uploaded_backup_{}.sql", timestamp)
                        }),
                    None => {
                        // 如果没有content disposition，生成一个文件名
                        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
                        format!("uploaded_backup_{}.sql", timestamp)
                    }
                };

                // 验证文件扩展名
                if !filename.to_lowercase().ends_with(".sql") {
                    return HttpResponse::BadRequest().json(serde_json::json!({
                        "code": 400,
                        "message": "Only .sql files are allowed",
                        "data": null
                    }));
                }

                uploaded_filename = filename.clone();
                let filepath = format!("{}/{}", backup_dir, filename);

                // 创建文件
                let mut file = match std::fs::File::create(&filepath) {
                    Ok(f) => f,
                    Err(e) => {
                        log::error!("Failed to create file: {}", e);
                        return HttpResponse::InternalServerError().json(serde_json::json!({
                            "code": 500,
                            "message": format!("Failed to create file: {}", e),
                            "data": null
                        }));
                    }
                };

                // 写入文件内容
                file_size = 0;
                while let Some(chunk_result) = field.next().await {
                    match chunk_result {
                        Ok(bytes) => {
                            file_size += bytes.len() as u64;
                            if let Err(e) = std::io::Write::write_all(&mut file, &bytes) {
                                log::error!("Failed to write to file: {}", e);
                                return HttpResponse::InternalServerError().json(serde_json::json!({
                                    "code": 500,
                                    "message": format!("Failed to write to file: {}", e),
                                    "data": null
                                }));
                            }
                        }
                        Err(e) => {
                            log::error!("Error reading chunk: {}", e);
                            return HttpResponse::InternalServerError().json(serde_json::json!({
                                "code": 500,
                                "message": format!("Error reading chunk: {}", e),
                                "data": null
                            }));
                        }
                    }
                }
            }
            Err(e) => {
                log::error!("Error reading multipart field: {}", e);
                return HttpResponse::BadRequest().json(serde_json::json!({
                    "code": 400,
                    "message": format!("Error reading multipart field: {}", e),
                    "data": null
                }));
            }
        }
    }

    if uploaded_filename.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "No file uploaded",
            "data": null
        }));
    }

    log::info!("Backup file uploaded successfully: {}", uploaded_filename);

    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "Backup file uploaded successfully",
        "data": {
            "filename": uploaded_filename,
            "file_size": file_size,
            "uploaded_at": chrono::Utc::now().timestamp()
        }
    }))
}
