use actix_web::{web, Scope};

/// 路由配置函数
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // 根路径路由 - 返回嵌入的 index.html
        .route("/", web::get().to(crate::embedded::serve_index))
        // 健康检查路由
        .service(
            web::scope("/health")
                .route("", web::get().to(crate::handlers::health_check))
        )
        // API v1路由组
        .service(configure_api_v1());
}

/// API v1路由配置
fn configure_api_v1() -> Scope {
    web::scope("/api/v1")
        // 认证路由(不需要认证中间件)
        .service(
            web::scope("/auth")
                // 登录接口
                .route("/login", web::post().to(crate::handlers::auth::login))
                // 刷新 Token 接口
                .route("/refresh", web::post().to(crate::handlers::auth::refresh_token))
        )
        // 学生数据路由(需要认证)
        .service(
            web::scope("/students")
                .wrap(crate::middleware::AuthMiddleware)
                // 创建学生
                .route("", web::post().to(crate::handlers::student::create))
                // 学生列表
                .route("", web::get().to(crate::handlers::student::list))
                // 学生详情
                .route("/{id}", web::get().to(crate::handlers::student::get))
                // 更新学生信息
                .route("/{id}", web::put().to(crate::handlers::student::update))
                // 删除学生
                .route("/{id}", web::delete().to(crate::handlers::student::delete))
        )
        // 测试数据路由(需要认证)
        .service(
            web::scope("/tests")
                .wrap(crate::middleware::AuthMiddleware)
                // 测试列表
                .route("", web::get().to(crate::handlers::test::list))
                // 测试详情
                .route("/{id}", web::get().to(crate::handlers::test::get))
        )
        // 运维路由(需要认证)
        .service(
            web::scope("/ops")
                .wrap(crate::middleware::AuthMiddleware)
                // 系统状态
                .route("/status", web::get().to(crate::handlers::ops::status))
                // 数据库备份
                .route("/backup", web::post().to(crate::handlers::ops::backup))
                // 备份列表
                .route("/backups", web::get().to(crate::handlers::ops::list_backups))
        )
}