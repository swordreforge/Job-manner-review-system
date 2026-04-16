use actix_web::{web, HttpResponse, Responder};
use crate::models::{SchoolQuery, CreateSchoolRequest, UpdateSchoolRequest};
use crate::services::SchoolService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use validator::Validate;

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