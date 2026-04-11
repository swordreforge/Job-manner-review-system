use actix_web::{web, HttpResponse, Responder};
use crate::models::{StudentQuery, CreateStudentRequest, UpdateStudentRequest};
use crate::services::StudentService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use uuid::Uuid;

/// 查询学生列表
pub async fn list(
    query: web::Query<StudentQuery>,
    state: web::Data<AppState>,
) -> impl Responder {
    let student_service = StudentService::new(&state);
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);
    let student_query = query.into_inner();

    match student_service.list_students(student_query).await {
        Ok((students, total)) => {
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "total": total,
                "page": page,
                "page_size": page_size,
                "items": students
            })))
        }
        Err(e) => {
            log::error!("查询学生列表失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("查询失败", Some(e.to_string())))
        }
    }
}

/// 根据 ID 查询学生
pub async fn get(
    path: web::Path<Uuid>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.into_inner();
    let student_service = StudentService::new(&state);

    match student_service.get_student(&id).await {
        Ok(student) => HttpResponse::Ok().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("查询学生失败: {}", e);
            HttpResponse::NotFound()
                .json(ErrorResponse::error("学生不存在", None))
        }
    }
}

/// 创建学生
pub async fn create(
    req: web::Json<CreateStudentRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let student_service = StudentService::new(&state);

    match student_service.create_student(req.into_inner()).await {
        Ok(student) => HttpResponse::Created().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("创建学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("创建失败", Some(e.to_string())))
        }
    }
}

/// 更新学生
pub async fn update(
    path: web::Path<Uuid>,
    req: web::Json<UpdateStudentRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.into_inner();
    let student_service = StudentService::new(&state);

    match student_service.update_student(&id, req.into_inner()).await {
        Ok(student) => HttpResponse::Ok().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("更新学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("更新失败", Some(e.to_string())))
        }
    }
}

/// 删除学生
pub async fn delete(
    path: web::Path<Uuid>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.into_inner();
    let student_service = StudentService::new(&state);

    match student_service.delete_student(&id).await {
        Ok(_) => HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
            "message": "删除成功"
        }))),
        Err(e) => {
            log::error!("删除学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("删除失败", Some(e.to_string())))
        }
    }
}