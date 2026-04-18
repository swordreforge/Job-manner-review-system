use actix_web::{web, HttpResponse, Responder};
use actix_multipart::Multipart;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use crate::models::{JobQuery, CreateJobRequest, UpdateJobRequest, BatchImportJobsRequest, ImportResult, ImportError};
use crate::services::JobService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use calamine::{Reader, Xlsx};
use base64::{Engine as _, engine::general_purpose};
use std::io::Cursor;

#[derive(serde::Deserialize)]
pub struct PathId {
    pub id: i64,
}

pub async fn list(
    query: web::Query<JobQuery>,
    state: web::Data<AppState>,
) -> impl Responder {
    let job_service = JobService::new(&state);
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);
    let job_query = query.into_inner();

    match job_service.list_jobs(job_query).await {
        Ok((jobs, total)) => {
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "total": total,
                "page": page,
                "page_size": page_size,
                "items": jobs
            })))
        }
        Err(e) => {
            log::error!("查询岗位列表失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("查询失败", Some(e.to_string())))
        }
    }
}

pub async fn get(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let job_service = JobService::new(&state);

    match job_service.get_job(id).await {
        Ok(job) => HttpResponse::Ok().json(ApiResponse::success(job)),
        Err(e) => {
            log::error!("查询岗位失败: {}", e);
            HttpResponse::NotFound()
                .json(ErrorResponse::error("岗位不存在", None))
        }
    }
}

pub async fn create(
    req: web::Json<CreateJobRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let job_service = JobService::new(&state);

    match job_service.create_job(req.into_inner()).await {
        Ok(job) => HttpResponse::Created().json(ApiResponse::success(job)),
        Err(e) => {
            log::error!("创建岗位失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("创建失败", Some(e.to_string())))
        }
    }
}

pub async fn update(
    path: web::Path<PathId>,
    req: web::Json<UpdateJobRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let job_service = JobService::new(&state);

    match job_service.update_job(id, req.into_inner()).await {
        Ok(job) => HttpResponse::Ok().json(ApiResponse::success(job)),
        Err(e) => {
            log::error!("更新岗位失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("更新失败", Some(e.to_string())))
        }
    }
}

pub async fn delete(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let job_service = JobService::new(&state);

    match job_service.delete_job(id).await {
        Ok(_) => HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
            "message": "删除成功"
        }))),
        Err(e) => {
            log::error!("删除岗位失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("删除失败", Some(e.to_string())))
        }
    }
}

pub async fn batch_import(
    req: web::Json<BatchImportJobsRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    log::info!("开始批量导入岗位");

    let file_data = match general_purpose::STANDARD.decode(&req.file) {
        Ok(data) => data,
        Err(e) => {
            log::error!("文件解码失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("文件解码失败", Some(e.to_string())));
        }
    };

    process_import(state.clone(), file_data).await
}

pub async fn batch_import_file(
    mut payload: Multipart,
    state: web::Data<AppState>,
) -> impl Responder {
    log::info!("开始通过文件上传批量导入岗位");

    let mut file_data: Option<Vec<u8>> = None;
    let mut filename = String::new();

    while let Some(item) = payload.next().await {
        match item {
            Ok(mut field) => {
                let content_disposition = field.content_disposition();
                if let Some(cd) = content_disposition {
                    if let Some(name) = cd.get_name() {
                        if name == "file" {
                            if let Some(fname) = cd.get_filename() {
                                filename = fname.to_string();
                            }
                            let mut data = Vec::new();
                            while let Some(chunk_result) = field.next().await {
                                match chunk_result {
                                    Ok(bytes) => data.extend_from_slice(&bytes),
                                    Err(e) => {
                                        log::error!("读取上传文件失败: {}", e);
                                        return HttpResponse::BadRequest()
                                            .json(ErrorResponse::error("读取上传文件失败", Some(e.to_string())));
                                    }
                                }
                            }
                            file_data = Some(data);
                        }
                    }
                }
            }
            Err(e) => {
                log::error!("读取上传文件失败: {}", e);
                return HttpResponse::BadRequest()
                    .json(ErrorResponse::error("读取上传文件失败", Some(e.to_string())));
            }
        }
    }

    let data = match file_data {
        Some(d) => d,
        None => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("未找到上传文件", None));
        }
    };

    log::info!("接收到文件: {}, 大小: {} bytes", filename, data.len());

    process_import(state.clone(), data).await
}

async fn process_import(state: web::Data<AppState>, file_data: Vec<u8>) -> HttpResponse {
    let cursor = Cursor::new(file_data);

    let mut workbook: Xlsx<Cursor<Vec<u8>>> = match Xlsx::new(cursor) {
        Ok(wb) => wb,
        Err(e) => {
            log::error!("打开 Excel 文件失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("打开 Excel 文件失败", Some(e.to_string())));
        }
    };

    let range = match workbook.worksheet_range_at(0) {
        Some(Ok(r)) => r,
        Some(Err(e)) => {
            log::error!("读取工作表失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("读取工作表失败", Some(e.to_string())));
        }
        None => {
            log::error!("工作表为空");
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("工作表为空", None));
        }
    };

    let mut total = 0u32;
    let mut errors = Vec::new();
    let job_service = JobService::new(&state);

    let mut col_mapping: Option<std::collections::HashMap<String, usize>> = None;
    let mut job_requests = Vec::new();

    for (row_idx, row) in range.rows().enumerate() {
        if row_idx == 0 {
            col_mapping = Some(build_column_mapping(row));
            continue;
        }

        total += 1;
        let row_num = (row_idx + 1) as u32;

        let mapping = match col_mapping.as_ref() {
            Some(m) => m,
            None => {
                errors.push(ImportError {
                    row: row_num,
                    message: "缺少列映射".to_string(),
                });
                continue;
            }
        };

        match parse_job_row_from_vec(row, mapping) {
            Ok(req) => job_requests.push(req),
            Err(e) => {
                errors.push(ImportError {
                    row: row_num,
                    message: e,
                });
            }
        }
    }

    let success = job_requests.len() as u32;
    let failed = total - success;

    if !job_requests.is_empty() {
        match job_service.import_jobs(job_requests).await {
            Ok((s, f)) => {
                log::info!("批量导入完成: 总数={}, 成功={}, 失败={}", total, s, f);
            }
            Err(e) => {
                log::error!("批量导入数据库失败: {}", e);
                errors.push(ImportError {
                    row: 0,
                    message: format!("批量导入数据库失败: {}", e),
                });
            }
        }
    }

    let result = ImportResult {
        total,
        success,
        failed,
        errors,
    };

    log::info!("批量导入完成: 总数={}, 成功={}, 失败={}", total, success, failed);
    HttpResponse::Ok().json(ApiResponse::success(result))
}

fn build_column_mapping(headers: &[calamine::Data]) -> std::collections::HashMap<String, usize> {
    let mut mapping = std::collections::HashMap::new();
    let field_names = vec![
        ("岗位名称", 0),
        ("岗位详情", 1),
        ("公司名称", 2),
        ("所属行业", 3),
        ("地址", 4),
        ("薪资范围", 5),
        ("公司详情", 6),
        ("岗位编码", 7),
        ("公司规模", 8),
        ("公司类型", 9),
        ("更新日期", 10),
        ("岗位来源地址", 11),
    ];

    for (idx, header) in headers.iter().enumerate() {
        if let calamine::Data::String(s) = header {
            for (field, _) in field_names.iter() {
                if s.contains(field) || field.contains(s) {
                    mapping.insert(field.to_string(), idx);
                    break;
                }
            }
        }
    }
    mapping
}

pub fn parse_job_row_from_vec(row: &[calamine::Data], col_mapping: &std::collections::HashMap<String, usize>) -> Result<CreateJobRequest, String> {
    let get_string = |idx: usize| -> Option<String> {
        row.get(idx)
            .and_then(|cell| match cell {
                calamine::Data::String(s) => Some(s.trim().to_string()),
                calamine::Data::Float(f) => Some(f.to_string()),
                calamine::Data::Int(i) => Some(i.to_string()),
                calamine::Data::Bool(b) => Some(b.to_string()),
                calamine::Data::Empty => None,
                _ => None,
            })
            .filter(|s| !s.is_empty())
    };

    let get_mapped_string = |field: &str| -> Option<String> {
        col_mapping.get(field).and_then(|&idx| get_string(idx))
    };

    let name = get_mapped_string("岗位名称").ok_or("岗位名称不能为空")?;
    let description = get_mapped_string("岗位详情");
    let company = get_mapped_string("公司名称");
    let industry = get_mapped_string("所属行业");
    let category = None;
    let location = get_mapped_string("地址");
    let salary_range = get_mapped_string("薪资范围");
    let skills = None;
    let certificates = None;
    let soft_skills = None;
    let requirements = None;
    let growth_potential = None;

    Ok(CreateJobRequest {
        name,
        description,
        company,
        industry,
        category,
        location,
        salary_range,
        skills,
        certificates,
        soft_skills,
        requirements,
        growth_potential,
    })
}

pub async fn download_template() -> impl Responder {
    use rust_xlsxwriter::*;

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let headers = vec![
        "岗位名称", "描述", "公司", "行业", "类别", "地点",
        "薪资范围", "技能要求", "证书要求", "软技能", "岗位要求", "成长潜力"
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string(0, col as u16, *header).unwrap();
    }

    let example = vec![
        "Golang后端开发工程师", "负责公司后端服务开发", "字节跳动", "技术", "开发",
        "北京", "15000-30000", "Golang,MySQL,Redis", "无", "团队协作", "3年经验", "极高"
    ];

    for (col, value) in example.iter().enumerate() {
        worksheet.write_string(1, col as u16, *value).unwrap();
    }

    let buffer = workbook.save_to_buffer().unwrap();

    HttpResponse::Ok()
        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .append_header(("Content-Disposition", "attachment; filename=job_import_template.xlsx"))
        .body(buffer)
}

// 分块上传请求结构
#[derive(Debug, Deserialize)]
pub struct ChunkUploadInitRequest {
    pub filename: String,
    pub total_size: u64,
    pub chunk_size: u64,
    pub total_chunks: u32,
}

#[derive(Debug, Serialize)]
pub struct ChunkUploadInitResponse {
    pub upload_id: String,
    pub chunk_size: u64,
    pub total_chunks: u32,
}

#[derive(Debug, Deserialize)]
pub struct ChunkUploadRequest {
    pub upload_id: String,
    pub chunk_index: u32,
}

#[derive(Debug, Deserialize)]
pub struct ChunkMergeRequest {
    pub upload_id: String,
}

static CHUNK_UPLOAD_STATE: once_cell::sync::Lazy<tokio::sync::RwLock<ChunkUploadState>> =
    once_cell::sync::Lazy::new(|| {
        tokio::sync::RwLock::new(ChunkUploadState::default())
    });

#[derive(Default)]
struct ChunkUploadState {
    uploads: std::collections::HashMap<String, ChunkUploadInfo>,
}

struct ChunkUploadInfo {
    filename: String,
    total_size: u64,
    chunk_size: u64,
    total_chunks: u32,
    received_chunks: std::collections::HashSet<u32>,
    chunks: Vec<Vec<u8>>,
    created_at: i64,
}

const CHUNK_UPLOAD_EXPIRE_SECONDS: i64 = 3600;

pub async fn chunk_upload_init(
    req: web::Json<ChunkUploadInitRequest>,
) -> impl Responder {
    let upload_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    let info = ChunkUploadInfo {
        filename: req.filename.clone(),
        total_size: req.total_size,
        chunk_size: req.chunk_size,
        total_chunks: req.total_chunks,
        received_chunks: std::collections::HashSet::new(),
        chunks: Vec::with_capacity(req.total_chunks as usize),
        created_at: now,
    };

    let mut state = CHUNK_UPLOAD_STATE.write().await;
    state.uploads.insert(upload_id.clone(), info);

    log::info!("分块上传初始化: upload_id={}, filename={}, chunks={}", 
        upload_id, req.filename, req.total_chunks);

    HttpResponse::Ok().json(ApiResponse::success(ChunkUploadInitResponse {
        upload_id,
        chunk_size: req.chunk_size,
        total_chunks: req.total_chunks,
    }))
}

pub async fn chunk_upload(
    mut payload: Multipart,
    req: web::Json<ChunkUploadRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let upload_id = req.upload_id.clone();
    let chunk_index = req.chunk_index;

    let mut file_data: Option<Vec<u8>> = None;

    while let Some(item) = payload.next().await {
        match item {
            Ok(mut field) => {
                let content_disposition = field.content_disposition();
                if let Some(cd) = content_disposition {
                    if let Some(name) = cd.get_name() {
                        if name == "chunk" {
                            let mut data = Vec::new();
                            while let Some(chunk_result) = field.next().await {
                                match chunk_result {
                                    Ok(bytes) => data.extend_from_slice(&bytes),
                                    Err(e) => {
                                        log::error!("读取分块失败: {}", e);
                                        return HttpResponse::BadRequest()
                                            .json(ErrorResponse::error("读取分块失败", Some(e.to_string())));
                                    }
                                }
                            }
                            file_data = Some(data);
                        }
                    }
                }
            }
            Err(e) => {
                log::error!("读取上传文件失败: {}", e);
                return HttpResponse::BadRequest()
                    .json(ErrorResponse::error("读取上传文件失败", Some(e.to_string())));
            }
        }
    }

    let data = match file_data {
        Some(d) => d,
        None => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("未找到分块数据", None));
        }
    };

    let mut state_lock = CHUNK_UPLOAD_STATE.write().await;

    let upload_info = match state_lock.uploads.get_mut(&upload_id) {
        Some(info) => {
            let now = chrono::Utc::now().timestamp();
            if now - info.created_at > CHUNK_UPLOAD_EXPIRE_SECONDS {
                state_lock.uploads.remove(&upload_id);
                return HttpResponse::BadRequest()
                    .json(ErrorResponse::error("上传会话已过期", None));
            }
            info
        }
        None => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("上传ID不存在", None));
        }
    };

    if chunk_index >= upload_info.total_chunks {
        return HttpResponse::BadRequest()
            .json(ErrorResponse::error("分块索引超出范围", None));
    }

    upload_info.received_chunks.insert(chunk_index);
    
    while upload_info.chunks.len() < upload_info.total_chunks as usize {
        upload_info.chunks.push(Vec::new());
    }
    upload_info.chunks[chunk_index as usize] = data;

    let progress = upload_info.received_chunks.len() as u32;
    log::info!("分块上传: upload_id={}, chunk={}/{}", upload_id, chunk_index + 1, upload_info.total_chunks);

    HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
        "chunk_index": chunk_index,
        "received_chunks": progress,
        "total_chunks": upload_info.total_chunks,
        "complete": progress == upload_info.total_chunks
    })))
}

pub async fn chunk_merge(
    req: web::Json<ChunkMergeRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let upload_id = req.upload_id.clone();

    let mut state_lock = CHUNK_UPLOAD_STATE.write().await;

    let upload_info = match state_lock.uploads.remove(&upload_id) {
        Some(info) => info,
        None => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("上传ID不存在", None));
        }
    };

    if upload_info.received_chunks.len() != upload_info.total_chunks as usize {
        return HttpResponse::BadRequest()
            .json(ErrorResponse::error(&format!("分块未全部上传，已收到 {}/{} 个分块", 
                upload_info.received_chunks.len(), upload_info.total_chunks), None));
    }

    let mut file_data = Vec::with_capacity(upload_info.total_size as usize);
    for chunk in upload_info.chunks {
        file_data.extend_from_slice(&chunk);
    }

    log::info!("分块合并完成: upload_id={}, filename={}, size={}", 
        upload_id, upload_info.filename, file_data.len());

    drop(state_lock);

    process_import(state, file_data).await
}

pub async fn bandwidth_test(
    mut payload: Multipart,
) -> impl Responder {
    let mut total_received = 0u64;

    while let Some(item) = payload.next().await {
        match item {
            Ok(mut field) => {
                while let Some(chunk_result) = field.next().await {
                    match chunk_result {
                        Ok(bytes) => {
                            total_received += bytes.len() as u64;
                        }
                        Err(e) => {
                            log::error!("读取带宽测试数据失败: {}", e);
                            return HttpResponse::BadRequest()
                                .json(ErrorResponse::error("读取测试数据失败", Some(e.to_string())));
                        }
                    }
                }
            }
            Err(e) => {
                log::error!("带宽测试失败: {}", e);
                return HttpResponse::BadRequest()
                    .json(ErrorResponse::error("带宽测试失败", Some(e.to_string())));
            }
        }
    }

    log::info!("带宽测试完成，收到 {} 字节", total_received);

    HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
        "received": total_received,
        "message": "带宽测试完成"
    })))
}
