use actix_web::{web, HttpResponse, Responder};
use crate::db::MySqlUserRepository;
use crate::models::{MySqlUserResponse, CreateMySqlUserRequest, UpdateMySqlUserRequest};
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};

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
