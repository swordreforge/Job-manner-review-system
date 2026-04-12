use actix_web::{web, HttpResponse, Responder};
use crate::models::{JobQuery, CreateJobRequest, UpdateJobRequest};
use crate::services::JobService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};

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
