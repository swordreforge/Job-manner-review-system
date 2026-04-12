use actix_web::{web, HttpResponse, Responder, HttpMessage, HttpRequest};
use crate::models::{StudentQuery, CreateStudentRequest, UpdateStudentRequest};
use crate::services::StudentService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use crate::models::TokenInfo;

#[derive(serde::Deserialize)]
pub struct PathId {
    pub id: i64,
}

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

pub async fn get(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let student_service = StudentService::new(&state);

    match student_service.get_student(id).await {
        Ok(student) => HttpResponse::Ok().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("查询学生失败: {}", e);
            HttpResponse::NotFound()
                .json(ErrorResponse::error("学生不存在", None))
        }
    }
}

pub async fn create(
    req: HttpRequest,
    body: web::Json<CreateStudentRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_id = match req.extensions().get::<TokenInfo>() {
        Some(token_info) => token_info.user_id.to_string().parse().unwrap_or(1),
        None => 1,
    };
    
    let student_service = StudentService::new(&state);

    match student_service.create_student(user_id, body.into_inner()).await {
        Ok(student) => HttpResponse::Created().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("创建学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("创建失败", Some(e.to_string())))
        }
    }
}

pub async fn update(
    path: web::Path<PathId>,
    req: web::Json<UpdateStudentRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let student_service = StudentService::new(&state);

    match student_service.update_student(id, req.into_inner()).await {
        Ok(student) => HttpResponse::Ok().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("更新学生失败: {}", e);
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
    let student_service = StudentService::new(&state);

    match student_service.delete_student(id).await {
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
