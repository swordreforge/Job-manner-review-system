use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures_util::future::LocalBoxFuture;
use std::rc::Rc;

/// 认证中间件
pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = LocalBoxFuture<'static, Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        Box::pin(async move {
            Ok(AuthMiddlewareService {
                service: Rc::new(service),
            })
        })
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            // 检查是否是登录接口,登录接口不需要认证
            let path = req.path();
            if path == "/api/v1/auth/login" {
                return service.call(req).await;
            }

            // 获取 Authorization header
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok());

            if let Some(auth_header) = auth_header {
                // 验证 Bearer Token 格式
                if auth_header.starts_with("Bearer ") {
                    let token = &auth_header[7..];

                    // 从应用状态获取 JWT 密钥
                    if let Some(app_state) = req.app_data::<crate::state::AppState>() {
                        use crate::services::AuthService;
                        let auth_service = AuthService::new(app_state);

                        // 验证 Token
                        match auth_service.verify_token(token) {
                            Ok(token_info) => {
                                // 将用户信息添加到请求扩展中
                                req.extensions_mut().insert(token_info);
                                return service.call(req).await;
                            }
                            Err(_) => {
                                // Token 无效,返回 401
                                let error = actix_web::error::ErrorUnauthorized("Token 无效或已过期");
                                return Err(error);
                            }
                        }
                    }
                }
            }

            // 没有 Token 或 Token 格式错误,返回 401
            let error = actix_web::error::ErrorUnauthorized("未提供认证 Token");
            Err(error)
        })
    }
}