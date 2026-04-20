use actix_web::{web, HttpResponse, Responder};
use crate::db::MySqlUserRepository;
use crate::models::{MySqlUserResponse, CreateMySqlUserRequest, UpdateMySqlUserRequest};
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use base64::Engine;
use calamine::Reader;

#[derive(serde::Deserialize)]
pub struct PathId {
    pub id: i64,
}

#[derive(serde::Deserialize)]
pub struct UserQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

pub async fn list(
    query: web::Query<UserQuery>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_repo = MySqlUserRepository::new(state.mysql_pool.clone());
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);

    match user_repo.find_all(page, page_size).await {
        Ok((users, total)) => {
            let responses: Vec<MySqlUserResponse> = users.into_iter().map(|u| u.into()).collect();
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "total": total,
                "page": page,
                "page_size": page_size,
                "items": responses
            })))
        }
        Err(e) => {
            log::error!("查询用户列表失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("查询失败", Some(e.to_string())))
        }
    }
}

pub async fn get(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_repo = MySqlUserRepository::new(state.mysql_pool.clone());
    let id = path.id;

    match user_repo.find_by_id(id).await {
        Ok(Some(user)) => HttpResponse::Ok().json(ApiResponse::success(MySqlUserResponse::from(user))),
        Ok(None) => HttpResponse::NotFound().json(ErrorResponse::error("用户不存在", None)),
        Err(e) => {
            log::error!("查询用户失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("查询失败", Some(e.to_string())))
        }
    }
}

pub async fn create(
    req: web::Json<CreateMySqlUserRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_repo = MySqlUserRepository::new(state.mysql_pool.clone());
    let role = req.role.clone().unwrap_or_else(|| "user".to_string());

    match user_repo.create(&req.username, &req.password, req.email.as_deref(), req.phone.as_deref(), &role).await {
        Ok(user) => HttpResponse::Created().json(ApiResponse::success(MySqlUserResponse::from(user))),
        Err(e) => {
            log::error!("创建用户失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("创建失败", Some(e.to_string())))
        }
    }
}

pub async fn update(
    path: web::Path<PathId>,
    req: web::Json<UpdateMySqlUserRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_repo = MySqlUserRepository::new(state.mysql_pool.clone());
    let id = path.id;

    if let Some(password) = &req.password {
        let _ = user_repo.update_password(id, password).await;
    }

    match user_repo.update(id, req.email.as_deref(), req.phone.as_deref(), req.role.as_deref()).await {
        Ok(Some(user)) => HttpResponse::Ok().json(ApiResponse::success(MySqlUserResponse::from(user))),
        Ok(None) => HttpResponse::NotFound().json(ErrorResponse::error("用户不存在", None)),
        Err(e) => {
            log::error!("更新用户失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("更新失败", Some(e.to_string())))
        }
    }
}

pub async fn delete(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_repo = MySqlUserRepository::new(state.mysql_pool.clone());
    let id = path.id;

    match user_repo.delete(id).await {
        Ok(true) => HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({"message": "删除成功"}))),
        Ok(false) => HttpResponse::NotFound().json(ErrorResponse::error("用户不存在", None)),
        Err(e) => {
            log::error!("删除用户失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("删除失败", Some(e.to_string())))
        }
    }
}

/// 批量导入用户
pub async fn batch_import(
    req: web::Json<crate::models::BatchImportUsersRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    log::info!("开始批量导入用户");

    let pool = &state.mysql_pool;

    // 解码 Base64 文件
    let file_data = match base64::engine::general_purpose::STANDARD.decode(&req.file) {
        Ok(data) => data,
        Err(e) => {
            log::error!("文件解码失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("文件解码失败", Some(e.to_string())));
        }
    };

    // 解析 Excel 文件
    let cursor = std::io::Cursor::new(file_data);
    let mut workbook: calamine::Xlsx<_> = match calamine::Xlsx::new(cursor) {
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

    // 跳过标题行，从第二行开始
    for (row_idx, row) in rows.rows().skip(1).enumerate() {
        total += 1;
        let row_num = (row_idx + 2) as u32;

        // 解析行数据
        let user_request = match parse_user_row(row) {
            Ok(u) => u,
            Err(e) => {
                failed += 1;
                errors.push(crate::models::UserImportError {
                    row: row_num,
                    message: e,
                });
                continue;
            }
        };

        // 插入数据库
        let result = sqlx::query(
            "INSERT INTO users (username, password, email, phone, avatar, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&user_request.username)
        .bind(&user_request.password)
        .bind(&user_request.email)
        .bind(&user_request.phone)
        .bind(&user_request.avatar)
        .bind(&user_request.role)
        .bind(now)
        .bind(now)
        .execute(pool.as_ref())
        .await;

        match result {
            Ok(_) => success += 1,
            Err(e) => {
                failed += 1;
                errors.push(crate::models::UserImportError {
                    row: row_num,
                    message: format!("插入数据库失败: {}", e),
                });
            }
        }
    }

    let result = crate::models::UserImportResult {
        total,
        success,
        failed,
        errors,
    };

    HttpResponse::Ok().json(ApiResponse::success(result))
}

/// 下载用户导入模板
pub async fn download_user_template() -> impl Responder {
    use rust_xlsxwriter::*;

    // 生成 Excel 模板
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // 添加标题行
    let headers = vec![
        "用户名", "密码", "邮箱", "电话", "头像", "角色"
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string(0, col as u16, *header).unwrap();
    }

    // 添加示例数据
    let example = vec![
        "user001", "password123", "user001@example.com", "13800138000", "", "teacher"
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
        .append_header(("Content-Disposition", "attachment; filename=user_import_template.xlsx"))
        .body(buffer)
}

/// 解析单行数据
fn parse_user_row(row: &[calamine::Data]) -> Result<crate::models::CreateMySqlUserRequest, String> {
    if row.len() < 6 {
        return Err("列数不足，需要6列".to_string());
    }

    let get_string = |idx: usize| -> Option<String> {
        match row.get(idx) {
            Some(calamine::Data::String(s)) => Some(s.trim().to_string()),
            Some(calamine::Data::Int(i)) => Some(i.to_string()),
            Some(calamine::Data::Float(f)) => Some(f.to_string()),
            Some(calamine::Data::Bool(b)) => Some(b.to_string()),
            Some(calamine::Data::Empty) | None => None,
            _ => None,
        }
    };

    let username = get_string(0).ok_or("用户名不能为空")?;
    let password = get_string(1).ok_or("密码不能为空")?;
    let email = get_string(2);
    let phone = get_string(3);
    let avatar = get_string(4);
    let role = get_string(5);

    Ok(crate::models::CreateMySqlUserRequest {
        username,
        password,
        email,
        phone,
        avatar,
        role,
    })
}
