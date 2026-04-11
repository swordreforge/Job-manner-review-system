use actix_web::{test, web, App};
use actix_web::http::StatusCode;
use teacher_api::{state::AppState, config::Config, routes::configure_routes};
use std::sync::Arc;
use sqlx::MySqlPool;

async fn setup_test_app() -> (Arc<sqlx::MySqlPool>, actix_web::test::TestServer) {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);

    let config = Config {
        database_url: "test".to_string(),
        server_host: "127.0.0.1".to_string(),
        server_port: 8081,
        jwt_secret: "test-secret-key-for-testing".to_string(),
    };

    let state = AppState::new(pool.clone(), config);

    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(state))
            .configure(configure_routes)
    ).await;

    (pool, app)
}

#[tokio::test]
#[serial_test::serial]
async fn test_login_success() {
    let (pool, app) = setup_test_app().await;

    // 创建测试用户
    let user_repo = teacher_api::db::UserRepository::new(pool);
    let create_req = teacher_api::models::CreateUserRequest {
        username: "TEST_handler_login".to_string(),
        password: "test123456".to_string(),
        name: "测试Handler登录".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    // 测试登录
    let req = test::TestRequest::post()
        .uri("/api/v1/auth/login")
        .set_json(serde_json::json!({
            "username": "TEST_handler_login",
            "password": "test123456"
        }))
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), StatusCode::OK, "登录应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert_eq!(body["message"], "success");
    assert!(body["data"]["token"].is_string());
    assert_eq!(body["data"]["user"]["username"], "TEST_handler_login");
}

#[tokio::test]
#[serial_test::serial]
async fn test_login_invalid_credentials() {
    let (pool, app) = setup_test_app().await;

    // 创建测试用户
    let user_repo = teacher_api::db::UserRepository::new(pool);
    let create_req = teacher_api::models::CreateUserRequest {
        username: "TEST_handler_invalid".to_string(),
        password: "correct_password".to_string(),
        name: "测试无效凭据".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    // 使用错误的密码登录
    let req = test::TestRequest::post()
        .uri("/api/v1/auth/login")
        .set_json(serde_json::json!({
            "username": "TEST_handler_invalid",
            "password": "wrong_password"
        }))
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), StatusCode::BAD_REQUEST, "使用错误密码登录应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_login_missing_fields() {
    let (_, app) = setup_test_app().await;

    // 缺少用户名
    let req = test::TestRequest::post()
        .uri("/api/v1/auth/login")
        .set_json(serde_json::json!({
            "password": "test123456"
        }))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error(), "缺少字段应该返回客户端错误");
}

#[tokio::test]
#[serial_test::serial]
async fn test_refresh_token_success() {
    let (pool, app) = setup_test_app().await;

    // 创建测试用户
    let user_repo = teacher_api::db::UserRepository::new(pool);
    let create_req = teacher_api::models::CreateUserRequest {
        username: "TEST_handler_refresh".to_string(),
        password: "test123456".to_string(),
        name: "测试刷新Token".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    // 登录获取 Token
    let login_req = test::TestRequest::post()
        .uri("/api/v1/auth/login")
        .set_json(serde_json::json!({
            "username": "TEST_handler_refresh",
            "password": "test123456"
        }))
        .to_request();

    let login_resp = test::call_service(&app, login_req).await;
    let login_body: serde_json::Value = test::read_body_json(login_resp).await;
    let token = login_body["data"]["token"].as_str().unwrap();

    // 刷新 Token
    let refresh_req = test::TestRequest::post()
        .uri("/api/v1/auth/refresh")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let refresh_resp = test::call_service(&app, refresh_req).await;

    assert_eq!(refresh_resp.status(), StatusCode::OK, "刷新 Token 应该成功");

    let refresh_body: serde_json::Value = test::read_body_json(refresh_resp).await;
    assert_eq!(refresh_body["code"], 200);
    assert!(refresh_body["data"]["token"].is_string());
}

#[tokio::test]
#[serial_test::serial]
async fn test_refresh_token_invalid() {
    let (_, app) = setup_test_app().await;

    // 使用无效 Token 刷新
    let req = test::TestRequest::post()
        .uri("/api/v1/auth/refresh")
        .insert_header(("Authorization", "Bearer invalid_token"))
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "使用无效 Token 刷新应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_unauthorized_access() {
    let (_, app) = setup_test_app().await;

    // 不带 Token 访问需要认证的接口
    let req = test::TestRequest::get()
        .uri("/api/v1/students")
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "未认证访问应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_invalid_token_format() {
    let (_, app) = setup_test_app().await;

    // 使用无效格式的 Token
    let req = test::TestRequest::get()
        .uri("/api/v1/students")
        .insert_header(("Authorization", "InvalidFormat token123"))
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "无效格式的 Token 应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_missing_authorization_header() {
    let (_, app) = setup_test_app().await;

    // 不带 Authorization header
    let req = test::TestRequest::get()
        .uri("/api/v1/students")
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "缺少 Authorization header 应该失败");
}