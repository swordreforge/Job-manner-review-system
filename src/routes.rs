use actix_web::{web, Scope};

/// 路由配置函数
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // 根路径路由 - 返回嵌入的 index.html
        .route("/", web::get().to(crate::embedded::serve_index))
        // 静态文件路由 - 处理 CSS、JS 等文件
        .route(
            "/static/{path:.*}",
            web::get().to(crate::embedded::serve_static),
        )
        // 健康检查路由
        .service(web::scope("/health").route("", web::get().to(crate::handlers::health_check)))
        // API v1路由组
        .service(configure_api_v1());
}

/// API v1路由配置
fn configure_api_v1() -> Scope {
    web::scope("/api/v1")
        // 认证路由
        .service(
            web::scope("/auth")
                // 登录接口（不需要认证）
                .route("/login", web::post().to(crate::handlers::auth::login))
                // 刷新 Token 接口（不需要认证）
                .route("/refresh", web::post().to(crate::handlers::auth::refresh_token))
                // 修改密码接口（需要认证）
                .route("/change-password", web::post().to(
                    crate::handlers::auth::change_password
                ).wrap(crate::middleware::AuthMiddleware))
                // 修改用户名接口（需要认证）
                .route("/change-username", web::post().to(
                    crate::handlers::auth::change_username
                ).wrap(crate::middleware::AuthMiddleware)),
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
                .route("/{id}", web::delete().to(crate::handlers::student::delete)),
        )
        // 测试数据路由(需要认证)
        .service(
            web::scope("/tests")
                .wrap(crate::middleware::AuthMiddleware)
                // 测试列表
                .route("", web::get().to(crate::handlers::test::list))
                // 测试详情
                .route("/{id}", web::get().to(crate::handlers::test::get)),
        )
        // 运维路由(需要认证)
        .service(
            web::scope("/ops")
                .wrap(crate::middleware::AuthMiddleware)
                // 系统状态
                .route("/status", web::get().to(crate::handlers::ops::status))
                // 数据库备份
                .route("/backup", web::post().to(crate::handlers::ops::backup))
                // 数据库恢复
                .route("/restore", web::post().to(crate::handlers::ops::restore))
                // 备份列表
                .route(
                    "/backups",
                    web::get().to(crate::handlers::ops::list_backups),
                )
                // 上传备份文件
                .route(
                    "/backups/upload",
                    web::post().to(crate::handlers::ops::upload_backup),
                )
                // 下载备份文件
                .route(
                    "/backups/{filename}",
                    web::get().to(crate::handlers::ops::download_backup),
                )
                // 删除备份文件
                .route(
                    "/backups/{filename}",
                    web::delete().to(crate::handlers::ops::delete_backup),
                ),
        )
        // 岗位路由(需要认证)
        .service(
            web::scope("/jobs")
                .wrap(crate::middleware::AuthMiddleware)
                // 创建岗位
                .route("", web::post().to(crate::handlers::job::create))
                // 岗位列表
                .route("", web::get().to(crate::handlers::job::list))
                // 岗位详情
                .route("/{id}", web::get().to(crate::handlers::job::get))
                // 更新岗位
                .route("/{id}", web::put().to(crate::handlers::job::update))
                // 删除岗位
                .route("/{id}", web::delete().to(crate::handlers::job::delete)),
        )
        // 用户路由(需要认证)
        .service(
            web::scope("/users")
                .wrap(crate::middleware::AuthMiddleware)
                // 创建用户
                .route("", web::post().to(crate::handlers::user::create))
                // 用户列表
                .route("", web::get().to(crate::handlers::user::list))
                // 用户详情
                .route("/{id}", web::get().to(crate::handlers::user::get))
                // 更新用户
                .route("/{id}", web::put().to(crate::handlers::user::update))
                // 删除用户
                .route("/{id}", web::delete().to(crate::handlers::user::delete)),
        )
        // 数据管理路由(需要认证)
        .service(
            web::scope("/schema")
                .wrap(crate::middleware::AuthMiddleware)
                // 获取所有表
                .route("/tables", web::get().to(crate::handlers::schema::list_tables))
                // 获取表结构
                .route("/tables/{table_name}", web::get().to(crate::handlers::schema::get_table_schema))
                // 添加字段
                .route("/columns", web::post().to(crate::handlers::schema::add_column))
                // 修改字段
                .route("/columns", web::put().to(crate::handlers::schema::modify_column))
                // 删除字段
                .route("/columns", web::delete().to(crate::handlers::schema::delete_column))
                // 执行自定义SQL
                .route("/execute", web::post().to(crate::handlers::schema::execute_sql)),
        )
}
