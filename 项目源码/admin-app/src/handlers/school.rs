use actix_web::{web, HttpResponse, Responder};
use crate::models::{SchoolQuery, CreateSchoolRequest, UpdateSchoolRequest, BatchImportSchoolsRequest, SchoolImportResult, SchoolImportError};
use crate::services::SchoolService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use validator::Validate;
use calamine::{Reader, Xlsx, Data};
use base64::{Engine as _, engine::general_purpose};
use std::io::Cursor;

#[derive(serde::Deserialize)]
pub struct PathId {
    pub id: i64,
}

/// 创建学校
pub async fn create(
    req: web::Json<CreateSchoolRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    // 验证请求参数
    if let Err(errors) = req.validate() {
        return HttpResponse::BadRequest()
            .json(ErrorResponse::error("参数验证失败", Some(errors.to_string())));
    }

    let school_service = SchoolService::new(&state);

    match school_service.create_school(req.into_inner()).await {
        Ok((school, code)) => {
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "school": school,
                "code": code
            })))
        }
        Err(e) => {
            log::error!("创建学校失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("创建学校失败", Some(e.to_string())))
        }
    }
}

/// 获取学校详情
pub async fn get(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let school_service = SchoolService::new(&state);

    match school_service.get_school(id).await {
        Ok(school) => HttpResponse::Ok().json(ApiResponse::success(school)),
        Err(e) => {
            log::error!("查询学校失败: {}", e);
            HttpResponse::NotFound()
                .json(ErrorResponse::error("学校不存在", None))
        }
    }
}

/// 查询学校列表
pub async fn list(
    query: web::Query<SchoolQuery>,
    state: web::Data<AppState>,
) -> impl Responder {
    let school_service = SchoolService::new(&state);
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);
    let school_query = query.into_inner();

    match school_service.list_schools(school_query).await {
        Ok((schools, total)) => {
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "total": total,
                "page": page,
                "page_size": page_size,
                "items": schools
            })))
        }
        Err(e) => {
            log::error!("查询学校列表失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("查询失败", Some(e.to_string())))
        }
    }
}

/// 更新学校信息
pub async fn update(
    path: web::Path<PathId>,
    req: web::Json<UpdateSchoolRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;

    // 验证请求参数
    if let Err(errors) = req.validate() {
        return HttpResponse::BadRequest()
            .json(ErrorResponse::error("参数验证失败", Some(errors.to_string())));
    }

    let school_service = SchoolService::new(&state);

    match school_service.update_school(id, req.into_inner()).await {
        Ok(school) => HttpResponse::Ok().json(ApiResponse::success(school)),
        Err(e) => {
            log::error!("更新学校失败: {}", e);
            let mut status = if e.to_string().contains("学校不存在") {
                HttpResponse::NotFound()
            } else {
                HttpResponse::InternalServerError()
            };
            status.json(ErrorResponse::error("更新失败", Some(e.to_string())))
        }
    }
}

/// 删除学校
pub async fn delete(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let school_service = SchoolService::new(&state);

    match school_service.delete_school(id).await {
        Ok(_) => HttpResponse::Ok().json(ApiResponse::success(true)),
        Err(e) => {
            log::error!("删除学校失败: {}", e);
            let mut status = if e.to_string().contains("学校不存在") {
                HttpResponse::NotFound()
            } else {
                HttpResponse::InternalServerError()
            };
            status.json(ErrorResponse::error("删除失败", Some(e.to_string())))
        }
    }
}

/// 批量导入学校
pub async fn batch_import(
    req: web::Json<BatchImportSchoolsRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    log::info!("开始批量导入学校");

    let pool = &state.mysql_pool;

    // 解码 Base64 文件
    let file_data = match general_purpose::STANDARD.decode(&req.file) {
        Ok(data) => data,
        Err(e) => {
            log::error!("文件解码失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("文件解码失败", Some(e.to_string())));
        }
    };

    // 解析 Excel 文件
    let cursor = Cursor::new(file_data);
    let mut workbook: Xlsx<_> = match Xlsx::new(cursor) {
        Ok(wb) => wb,
        Err(e) => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("打开 Excel 文件失败", Some(e.to_string())));
        }
    };

    // 读取第一个工作表
    let range = match workbook.worksheet_range_at(0) {
        Some(r) => r,
        None => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("工作表为空", None));
        }
    };

    let rows = match range {
        Ok(r) => r,
        Err(e) => {
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("读取工作表失败", Some(e.to_string())));
        }
    };

    // 解析数据
    let mut total = 0u32;
    let mut success = 0u32;
    let mut failed = 0u32;
    let mut errors = Vec::new();
    let now = chrono::Utc::now().timestamp();

    // Pre-parse all rows to get count
    let parsed_rows: Vec<(u32, Result<CreateSchoolRequest, String>)> = rows.rows().skip(1).enumerate()
        .map(|(idx, row)| {
            let row_num = (idx + 2) as u32;
            match parse_school_row(row) {
                Ok(s) => (row_num, Ok(s)),
                Err(e) => (row_num, Err(e)),
            }
        })
        .collect();

    let valid_count = parsed_rows.iter().filter(|(_, r)| r.is_ok()).count();

    // Pre-generate school codes in batch
    let school_codes = match generate_school_codes_batch(pool.as_ref(), valid_count).await {
        Ok(codes) => codes,
        Err(e) => {
            return HttpResponse::InternalServerError().json(ErrorResponse::error(&format!("生成学校代码失败: {}", e), None));
        }
    };
    let mut code_index = 0usize;

    for (row_num, school_result) in parsed_rows {
        total += 1;

        let school = match school_result {
            Ok(s) => s,
            Err(e) => {
                failed += 1;
                errors.push(SchoolImportError {
                    row: row_num,
                    message: e,
                });
                continue;
            }
        };

        let school_code = school_codes[code_index].clone();
        code_index += 1;

        // 插入数据库
        let result = sqlx::query(
            "INSERT INTO schools (name, code, address, contact_person, contact_phone, contact_email, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)"
        )
        .bind(&school.name)
        .bind(&school_code)
        .bind(&school.address)
        .bind(&school.contact_person)
        .bind(&school.contact_phone)
        .bind(&school.contact_email)
        .bind(now)
        .bind(now)
        .execute(pool.as_ref())
        .await;

        match result {
            Ok(_) => success += 1,
            Err(e) => {
                failed += 1;
                errors.push(SchoolImportError {
                    row: row_num,
                    message: format!("插入数据库失败: {}", e),
                });
            }
        }
    }

    let result = SchoolImportResult {
        total,
        success,
        failed,
        errors,
    };

    HttpResponse::Ok().json(ApiResponse::success(result))
}

/// 下载学校导入模板
pub async fn download_school_template() -> impl Responder {
    use rust_xlsxwriter::*;

    // 生成 Excel 模板
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // 添加标题行
    let headers = vec![
        "学校名称", "地址", "联系人", "联系电话", "联系邮箱"
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string(0, col as u16, *header).unwrap();
    }

    // 添加示例数据
    let example = vec![
        "北京市第一中学", "北京市东城区", "张老师", "010-12345678", "contact@school1.edu.cn"
    ];

    for (col, value) in example.iter().enumerate() {
        worksheet.write_string(1, col as u16, *value).unwrap();
    }

    // 生成文件
    let buffer = match workbook.save_to_buffer() {
        Ok(buf) => buf,
        Err(e) => {
            log::error!("生成 Excel 文件失败: {}", e);
            return HttpResponse::InternalServerError()
                .json(ErrorResponse::error("生成模板失败", None));
        }
    };

    // 返回文件
    HttpResponse::Ok()
        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .append_header(("Content-Disposition", "attachment; filename=school_import_template.xlsx"))
        .body(buffer)
}

pub async fn export(state: web::Data<AppState>) -> impl Responder {
    use rust_xlsxwriter::*;

    let school_repo = crate::db::SchoolRepository::new(state.mysql_pool.clone());
    let schools = match school_repo.list_all().await {
        Ok(schools) => schools,
        Err(e) => {
            log::error!("导出学校数据失败: {}", e);
            return HttpResponse::InternalServerError()
                .json(ErrorResponse::error("获取学校数据失败", None));
        }
    };

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let headers = vec![
        "学校名称", "地址", "联系人", "联系电话", "联系邮箱"
    ];

    for (col, header) in headers.iter().enumerate() {
        if let Err(e) = worksheet.write_string(0, col as u16, *header) {
            log::warn!("写入表头失败: {}", e);
        }
    }

    for (row_idx, school) in schools.iter().enumerate() {
        let row = (row_idx + 1) as u32;
        let values: Vec<Option<&str>> = vec![
            Some(&school.name),
            school.address.as_deref(),
            school.contact_person.as_deref(),
            school.contact_phone.as_deref(),
            school.contact_email.as_deref(),
        ];
        for (col, value) in values.into_iter().enumerate() {
            if let Some(v) = value {
                if let Err(e) = worksheet.write_string(row, col as u16, v) {
                    log::warn!("写入单元格({},{})失败: {}", row, col, e);
                }
            }
        }
    }

    let buffer = match workbook.save_to_buffer() {
        Ok(buf) => buf,
        Err(e) => {
            log::error!("生成导出文件失败: {}", e);
            return HttpResponse::InternalServerError()
                .json(ErrorResponse::error("生成导出文件失败", None));
        }
    };

    HttpResponse::Ok()
        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .append_header(("Content-Disposition", "attachment; filename=schools_export.xlsx"))
        .body(buffer)
}

/// 解析单行数据
fn parse_school_row(row: &[Data]) -> Result<CreateSchoolRequest, String> {
    if row.len() < 5 {
        return Err("列数不足，需要5列".to_string());
    }

    let get_string = |idx: usize| -> Option<String> {
        match row.get(idx) {
            Some(Data::String(s)) => Some(s.trim().to_string()),
            Some(Data::Int(i)) => Some(i.to_string()),
            Some(Data::Float(f)) => Some(f.to_string()),
            Some(Data::Bool(b)) => Some(b.to_string()),
            Some(Data::Empty) | None => None,
            _ => None,
        }
    };

    let name = get_string(0).ok_or("学校名称不能为空")?;
    let address = get_string(1);
    let contact_person = get_string(2);
    let contact_phone = get_string(3);
    let contact_email = get_string(4);

    Ok(CreateSchoolRequest {
        name,
        address,
        contact_person,
        contact_phone,
        contact_email,
    })
}

async fn generate_school_codes_batch(pool: &sqlx::MySqlPool, count: usize) -> Result<Vec<String>, String> {
    const CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let mut codes = Vec::with_capacity(count);

    if count == 0 {
        return Ok(codes);
    }

    let mut attempts = 0;
    while codes.len() < count && attempts < count * 3 {
        attempts += 1;

        let mut code_part = Vec::with_capacity(6);
        for _ in 0..6 {
            let idx = (rand::random::<u32>() % CHARSET.len() as u32) as usize;
            code_part.push(CHARSET[idx]);
        }
        let check_digit = calculate_check_digit(&code_part, CHARSET);
        code_part.push(check_digit);
        let code = format!("SCH{}", String::from_utf8_lossy(&code_part));

        let exists = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM schools WHERE code = ?"
        )
        .bind(&code)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("检查学校代码失败: {}", e))?;

        if exists == 0 {
            codes.push(code);
        }
    }

    if codes.len() < count {
        return Err(format!("无法生成足够的学校代码，需要 {} 个，仅生成 {} 个", count, codes.len()));
    }

    Ok(codes)
}

/// 生成学校代码 (SCH + 6位随机 + 校验位)
async fn generate_school_code(pool: &sqlx::MySqlPool) -> Result<String, String> {
    const CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTUVWXYZ";

    loop {
        // 生成6位随机字符
        let mut code_part = Vec::with_capacity(6);
        for _ in 0..6 {
            let idx = (rand::random::<u32>() % CHARSET.len() as u32) as usize;
            code_part.push(CHARSET[idx]);
        }

        // 计算校验位 (简单加权校验)
        let check_digit = calculate_check_digit(&code_part, CHARSET);
        code_part.push(check_digit);

        let code = format!("SCH{}", String::from_utf8_lossy(&code_part));

        // 检查代码是否已存在
        let exists = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM schools WHERE code = ?"
        )
        .bind(&code)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("检查学校代码失败: {}", e))?;

        if exists == 0 {
            return Ok(code);
        }
    }
}

/// 计算校验位
fn calculate_check_digit(data: &[u8], charset: &[u8]) -> u8 {
    let mut sum = 0;
    for (i, &b) in data.iter().enumerate() {
        if let Some(pos) = charset.iter().position(|&c| c == b) {
            sum += pos * (i + 1);
        }
    }
    let idx = sum % charset.len();
    charset[idx]
}