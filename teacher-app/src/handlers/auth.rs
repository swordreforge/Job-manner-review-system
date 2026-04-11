use actix_web::{web, HttpResponse, Responder};
use crate::models::LoginRequest;
use crate::services::AuthService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};

/// 用户登录
pub async fn login(
    req: web::Json<LoginRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let auth_service = AuthService::new(&state);

    match auth_service.login(req.into_inner()).await {
        Ok(response) => HttpResponse::Ok().json(ApiResponse::success(response)),
        Err(e) => {
            log::error!("登录失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("登录失败", Some(e.to_string())))
        }
    }
}

/// 刷新 Token
pub async fn refresh_token(
    req: actix_web::HttpRequest,
    state: web::Data<AppState>,
) -> impl Responder {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if auth_header.starts_with("Bearer ") {
            let token = &auth_header[7..];
            let auth_service = AuthService::new(&state);

            match auth_service.refresh_token(token) {
                Ok(new_token) => {
                    HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                        "token": new_token
                    })))
                }
                Err(e) => {
                    log::error!("Token 刷新失败: {}", e);
                    HttpResponse::Unauthorized()
                        .json(ErrorResponse::error("Token 刷新失败", Some(e.to_string())))
                }
            }
        } else {
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("Token 格式错误", None))
        }
    } else {
        HttpResponse::BadRequest()
            .json(ErrorResponse::error("未提供 Token", None))
    }
}