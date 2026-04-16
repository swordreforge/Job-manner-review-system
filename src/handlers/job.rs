use actix_web::{web, HttpResponse, Responder};
use crate::models::{JobQuery, CreateJobRequest, UpdateJobRequest, BatchImportJobsRequest, ImportResult, ImportError};
use crate::services::JobService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use calamine::{Reader, Xlsx, Data};
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
    let mut success = 0u32;
    let mut failed = 0u32;
    let mut errors = Vec::new();
    let job_service = JobService::new(&state);

    for (row_idx, row) in range.rows().skip(1).enumerate() {
        total += 1;
        let row_num = (row_idx + 2) as u32;

        let job_request = match parse_job_row_from_vec(row) {
            Ok(j) => j,
            Err(e) => {
                failed += 1;
                errors.push(ImportError {
                    row: row_num,
                    message: e,
                });
                continue;
            }
        };

        match job_service.create_job(job_request).await {
            Ok(_) => success += 1,
            Err(e) => {
                failed += 1;
                errors.push(ImportError {
                    row: row_num,
                    message: format!("插入数据库失败: {}", e),
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

pub fn parse_job_row_from_vec(row: &[calamine::Data]) -> Result<CreateJobRequest, String> {
    if row.len() < 12 {
        return Err("列数不足，需要12列".to_string());
    }

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

    let name = get_string(0).ok_or("岗位名称不能为空")?;
    let description = get_string(1);
    let company = get_string(2);
    let industry = get_string(3);
    let category = get_string(4);
    let location = get_string(5);
    let salary_range = get_string(6);
    let skills = get_string(7);
    let certificates = get_string(8);
    let soft_skills = get_string(9);
    let requirements = get_string(10);
    let growth_potential = get_string(11);

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
