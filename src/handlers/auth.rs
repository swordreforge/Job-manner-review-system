use actix_web::{web, HttpResponse, Responder};
use crate::models::{LoginRequest, ChangePasswordRequest, ChangeUsernameRequest};
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
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
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

/// 修改密码
pub async fn change_password(
    req: actix_web::HttpRequest,
    body: web::Json<ChangePasswordRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            let auth_service = AuthService::new(&state);

            // 验证 Token 并获取用户信息
            match auth_service.verify_token(token) {
                Ok(user_info) => {
                    let user_repo = crate::db::SqliteUserRepository::new(state.sqlite_pool.clone());

                    // 验证旧密码
                    match user_repo.find_by_id(&user_info.user_id).await {
                        Ok(Some(user)) => {
                            match user.verify_password(&body.old_password) {
                                Ok(true) => {
                                    // 更新密码
                                    match user_repo.update_password(&user_info.user_id, &body.new_password).await {
                                        Ok(true) => {
                                            log::info!("用户 {} 修改密码成功", user_info.username);
                                            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                                                "message": "密码修改成功"
                                            })))
                                        }
                                        Ok(false) => {
                                            HttpResponse::InternalServerError()
                                                .json(ErrorResponse::error("密码修改失败", None))
                                        }
                                        Err(e) => {
                                            log::error!("修改密码失败: {}", e);
                                            HttpResponse::InternalServerError()
                                                .json(ErrorResponse::error("修改密码失败", Some(e.to_string())))
                                        }
                                    }
                                }
                                Ok(false) => {
                                    HttpResponse::BadRequest()
                                        .json(ErrorResponse::error("旧密码错误", None))
                                }
                                Err(e) => {
                                    log::error!("验证密码失败: {}", e);
                                    HttpResponse::InternalServerError()
                                        .json(ErrorResponse::error("验证密码失败", Some(e.to_string())))
                                }
                            }
                        }
                        Ok(None) => {
                            HttpResponse::NotFound()
                                .json(ErrorResponse::error("用户不存在", None))
                        }
                        Err(e) => {
                            log::error!("查询用户失败: {}", e);
                            HttpResponse::InternalServerError()
                                .json(ErrorResponse::error("查询用户失败", Some(e.to_string())))
                        }
                    }
                }
                Err(e) => {
                    log::error!("Token 验证失败: {}", e);
                    HttpResponse::Unauthorized()
                        .json(ErrorResponse::error("Token 无效", Some(e.to_string())))
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

/// 修改用户名
pub async fn change_username(
    req: actix_web::HttpRequest,
    body: web::Json<ChangeUsernameRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            let auth_service = AuthService::new(&state);

            // 验证 Token 并获取用户信息
            match auth_service.verify_token(token) {
                Ok(user_info) => {
                    let user_repo = crate::db::SqliteUserRepository::new(state.sqlite_pool.clone());

                    // 验证当前密码
                    match user_repo.find_by_id(&user_info.user_id).await {
                        Ok(Some(user)) => {
                            match user.verify_password(&body.password) {
                                Ok(true) => {
                                    // 更新用户名
                                    match user_repo.update_username(&user_info.user_id, &body.new_username).await {
                                        Ok(true) => {
                                            log::info!("用户 {} 修改用户名为 {} 成功", user_info.username, body.new_username);
                                            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                                                "message": "用户名修改成功",
                                                "new_username": body.new_username
                                            })))
                                        }
                                        Ok(false) => {
                                            HttpResponse::InternalServerError()
                                                .json(ErrorResponse::error("用户名修改失败", None))
                                        }
                                        Err(e) => {
                                            log::error!("修改用户名失败: {}", e);
                                            HttpResponse::BadRequest()
                                                .json(ErrorResponse::error("修改用户名失败", Some(e.to_string())))
                                        }
                                    }
                                }
                                Ok(false) => {
                                    HttpResponse::BadRequest()
                                        .json(ErrorResponse::error("密码错误", None))
                                }
                                Err(e) => {
                                    log::error!("验证密码失败: {}", e);
                                    HttpResponse::InternalServerError()
                                        .json(ErrorResponse::error("验证密码失败", Some(e.to_string())))
                                }
                            }
                        }
                        Ok(None) => {
                            HttpResponse::NotFound()
                                .json(ErrorResponse::error("用户不存在", None))
                        }
                        Err(e) => {
                            log::error!("查询用户失败: {}", e);
                            HttpResponse::InternalServerError()
                                .json(ErrorResponse::error("查询用户失败", Some(e.to_string())))
                        }
                    }
                }
                Err(e) => {
                    log::error!("Token 验证失败: {}", e);
                    HttpResponse::Unauthorized()
                        .json(ErrorResponse::error("Token 无效", Some(e.to_string())))
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