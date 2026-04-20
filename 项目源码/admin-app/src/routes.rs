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
                .route(
                    "/refresh",
                    web::post().to(crate::handlers::auth::refresh_token),
                )
                // 修改密码接口（需要认证）
                .route(
                    "/change-password",
                    web::post()
                        .to(crate::handlers::auth::change_password)
                        .wrap(crate::middleware::AuthMiddleware),
                )
                // 修改用户名接口（需要认证）
                .route(
                    "/change-username",
                    web::post()
                        .to(crate::handlers::auth::change_username)
                        .wrap(crate::middleware::AuthMiddleware),
                ),
        )
        // 学生数据路由(需要认证)
        .service(
            web::scope("/students")
                .wrap(crate::middleware::AuthMiddleware)
                // 创建学生
                .route("", web::post().to(crate::handlers::student::create))
                // 学生列表
                .route("", web::get().to(crate::handlers::student::list))
                // 下载学生导入模板（需要在 /{id} 之前）
                .route(
                    "/import-template",
                    web::get().to(crate::handlers::student::download_student_template),
                )
                .route(
                    "/export",
                    web::get().to(crate::handlers::student::export),
                )
                // 批量导入学生（需要在 /{id} 之前）
                .route(
                    "/batch-import",
                    web::post().to(crate::handlers::student::batch_import_students),
                )
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
                )
                // 读取配置文件
                .route("/config", web::get().to(crate::handlers::ops::read_config))
                // 写入配置文件
                .route("/config", web::put().to(crate::handlers::ops::write_config))
                // 列出配置文件备份
                .route(
                    "/config/backups",
                    web::get().to(crate::handlers::ops::list_config_backups_handler),
                )
                // 回滚配置文件
                .route(
                    "/config/rollback",
                    web::post().to(crate::handlers::ops::rollback_config),
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
                // 下载导入模板（需要在 /{id} 之前）
                .route(
                    "/import-template",
                    web::get().to(crate::handlers::job::download_template),
                )
                .route(
                    "/export",
                    web::get().to(crate::handlers::job::export),
                )
                // 批量导入岗位（需要在 /{id} 之前）
                .route(
                    "/batch-import",
                    web::post().to(crate::handlers::job::batch_import),
                )
                // 批量导入岗位-文件上传（需要在 /{id} 之前）
                .route(
                    "/batch-import-file",
                    web::post().to(crate::handlers::job::batch_import_file),
                )
                // 分块上传初始化
                .route(
                    "/chunk-upload-init",
                    web::post().to(crate::handlers::job::chunk_upload_init),
                )
                // 分块上传
                .route(
                    "/chunk-upload",
                    web::post().to(crate::handlers::job::chunk_upload),
                )
                // 分块合并
                .route(
                    "/chunk-merge",
                    web::post().to(crate::handlers::job::chunk_merge),
                )
                // 带宽测试
                .route(
                    "/bandwidth-test",
                    web::post().to(crate::handlers::job::bandwidth_test),
                )
                // 岗位详情
                .route("/{id}", web::get().to(crate::handlers::job::get))
                // 更新岗位
                .route("/{id}", web::put().to(crate::handlers::job::update))
                // 删除岗位
                .route("/{id}", web::delete().to(crate::handlers::job::delete)),
        )
        // 学校路由(需要认证)
        .service(
            web::scope("/schools")
                .wrap(crate::middleware::AuthMiddleware)
                // 创建学校
                .route("", web::post().to(crate::handlers::school::create))
                // 学校列表
                .route("", web::get().to(crate::handlers::school::list))
                // 下载导入模板（需要在 /{id} 之前）
                .route(
                    "/import-template",
                    web::get().to(crate::handlers::school::download_school_template),
                )
                .route(
                    "/export",
                    web::get().to(crate::handlers::school::export),
                )
                // 批量导入（需要在 /{id} 之前）
                .route(
                    "/batch-import",
                    web::post().to(crate::handlers::school::batch_import),
                )
                // 学校详情
                .route("/{id}", web::get().to(crate::handlers::school::get))
                // 更新学校
                .route("/{id}", web::put().to(crate::handlers::school::update))
                // 删除学校
                .route("/{id}", web::delete().to(crate::handlers::school::delete)),
        )
        // 用户路由(需要认证)
        .service(
            web::scope("/users")
                .wrap(crate::middleware::AuthMiddleware)
                // 创建用户
                .route("", web::post().to(crate::handlers::user::create))
                // 用户列表
                .route("", web::get().to(crate::handlers::user::list))
                // 下载导入模板（需要在 /{id} 之前）
                .route(
                    "/import-template",
                    web::get().to(crate::handlers::user::download_user_template),
                )
                // 批量导入用户（需要在 /{id} 之前）
                .route(
                    "/batch-import",
                    web::post().to(crate::handlers::user::batch_import),
                )
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
                .route(
                    "/tables",
                    web::get().to(crate::handlers::schema::list_tables),
                )
                // 获取表结构
                .route(
                    "/tables/{table_name}",
                    web::get().to(crate::handlers::schema::get_table_schema),
                )
                // 添加字段
                .route(
                    "/columns",
                    web::post().to(crate::handlers::schema::add_column),
                )
                // 修改字段
                .route(
                    "/columns",
                    web::put().to(crate::handlers::schema::modify_column),
                )
                // 删除字段
                .route(
                    "/columns",
                    web::delete().to(crate::handlers::schema::delete_column),
                )
                // 执行自定义SQL
                .route(
                    "/execute",
                    web::post().to(crate::handlers::schema::execute_sql),
                )
                // 查询表数据
                .route(
                    "/tables/{table_name}/data",
                    web::get().to(crate::handlers::schema::query_table_data),
                )
                // 插入数据
                .route(
                    "/data",
                    web::post().to(crate::handlers::schema::insert_data),
                )
                // 更新数据
                .route("/data", web::put().to(crate::handlers::schema::update_data))
                // 删除数据
                .route(
                    "/data",
                    web::delete().to(crate::handlers::schema::delete_data),
                ),
        )
}
