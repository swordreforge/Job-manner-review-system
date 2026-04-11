use actix_web::{test, web, App};
use actix_web::http::StatusCode;
use teacher_api::{state::AppState, config::Config, routes::configure_routes};
use std::sync::Arc;
use sqlx::MySqlPool;

async fn setup_test_app_with_token() -> (Arc<sqlx::MySqlPool>, actix_web::test::TestServer, String) {
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
            .app_data(web::Data::new(state.clone()))
            .configure(configure_routes)
    ).await;

    // 创建测试用户并登录获取 Token
    let user_repo = teacher_api::db::UserRepository::new(pool.clone());
    let create_req = teacher_api::models::CreateUserRequest {
        username: "TEST_student_handler".to_string(),
        password: "test123456".to_string(),
        name: "测试学生Handler".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    // 登录获取 Token
    let login_req = test::TestRequest::post()
        .uri("/api/v1/auth/login")
        .set_json(serde_json::json!({
            "username": "TEST_student_handler",
            "password": "test123456"
        }))
        .to_request();

    let login_resp = test::call_service(&app, login_req).await;
    let login_body: serde_json::Value = test::read_body_json(login_resp).await;
    let token = login_body["data"]["token"].as_str().unwrap().to_string();

    (pool, app, token)
}

fn auth_header(token: &str) -> [("actix-web::http::header::HeaderName", &str); 1] {
    [("Authorization", &format!("Bearer {}", token))]
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_student_success() {
    let (pool, app, token) = setup_test_app_with_token().await;

    let create_req = test::TestRequest::post()
        .uri("/api/v1/students")
        .insert_header(auth_header(&token))
        .set_json(serde_json::json!({
            "student_no": "TEST_HANDLER_CREATE_001",
            "name": "Handler测试学生",
            "gender": "男",
            "age": 17,
            "class_name": "高三(1)班",
            "phone": "13800138000",
            "email": "handler_test@example.com"
        }))
        .to_request();

    let resp = test::call_service(&app, create_req).await;

    assert_eq!(resp.status(), StatusCode::CREATED, "创建学生应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert_eq!(body["data"]["name"], "Handler测试学生");
    assert_eq!(body["data"]["student_no"], "TEST_HANDLER_CREATE_001");
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_student_without_auth() {
    let (_, app, _) = setup_test_app_with_token().await;

    let create_req = test::TestRequest::post()
        .uri("/api/v1/students")
        .set_json(serde_json::json!({
            "student_no": "TEST_NO_AUTH",
            "name": "无认证测试",
            "class_name": "高三(1)班"
        }))
        .to_request();

    let resp = test::call_service(&app, create_req).await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "未认证创建学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_list_students_success() {
    let (pool, app, token) = setup_test_app_with_token().await;

    // 创建测试学生
    let student_repo = teacher_api::db::StudentRepository::new(pool);
    let create_req = teacher_api::models::CreateStudentRequest {
        student_no: "TEST_HANDLER_LIST".to_string(),
        name: "Handler列表测试".to_string(),
        gender: Some("男".to_string()),
        age: Some(17),
        class_name: "高三(1)班".to_string(),
        phone: None,
        email: None,
        address: None,
        parent_name: None,
        parent_phone: None,
    };

    student_repo.create(create_req).await.unwrap();

    // 查询学生列表
    let list_req = test::TestRequest::get()
        .uri("/api/v1/students?page=1&page_size=10")
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, list_req).await;

    assert_eq!(resp.status(), StatusCode::OK, "查询学生列表应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert!(body["data"]["total"].as_u64().unwrap() >= 1);
    assert!(body["data"]["items"].as_array().unwrap().len() >= 1);
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_student_success() {
    let (pool, app, token) = setup_test_app_with_token().await;

    // 创建测试学生
    let student_repo = teacher_api::db::StudentRepository::new(pool);
    let create_req = teacher_api::models::CreateStudentRequest {
        student_no: "TEST_HANDLER_GET".to_string(),
        name: "Handler获取测试".to_string(),
        gender: Some("男".to_string()),
        age: Some(17),
        class_name: "高三(1)班".to_string(),
        phone: None,
        email: None,
        address: None,
        parent_name: None,
        parent_phone: None,
    };

    let created = student_repo.create(create_req).await.unwrap();

    // 查询学生
    let get_req = test::TestRequest::get()
        .uri(&format!("/api/v1/students/{}", created.id))
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, get_req).await;

    assert_eq!(resp.status(), StatusCode::OK, "查询学生应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert_eq!(body["data"]["id"], created.id.to_string());
    assert_eq!(body["data"]["name"], "Handler获取测试");
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_student_not_found() {
    let (_, app, token) = setup_test_app_with_token().await;

    // 查询不存在的学生
    let get_req = test::TestRequest::get()
        .uri(&format!("/api/v1/students/{}", uuid::Uuid::new_v4()))
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, get_req).await;

    assert_eq!(resp.status(), StatusCode::NOT_FOUND, "查询不存在的学生应该返回 404");
}

#[tokio::test]
#[serial_test::serial]
async fn test_update_student_success() {
    let (pool, app, token) = setup_test_app_with_token().await;

    // 创建测试学生
    let student_repo = teacher_api::db::StudentRepository::new(pool);
    let create_req = teacher_api::models::CreateStudentRequest {
        student_no: "TEST_HANDLER_UPDATE".to_string(),
        name: "Handler更新测试".to_string(),
        gender: Some("男".to_string()),
        age: Some(17),
        class_name: "高三(1)班".to_string(),
        phone: None,
        email: None,
        address: None,
        parent_name: None,
        parent_phone: None,
    };

    let created = student_repo.create(create_req).await.unwrap();

    // 更新学生
    let update_req = test::TestRequest::put()
        .uri(&format!("/api/v1/students/{}", created.id))
        .insert_header(auth_header(&token))
        .set_json(serde_json::json!({
            "name": "更新后的学生",
            "age": 18,
            "phone": "13900139999"
        }))
        .to_request();

    let resp = test::call_service(&app, update_req).await;

    assert_eq!(resp.status(), StatusCode::OK, "更新学生应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert_eq!(body["data"]["name"], "更新后的学生");
    assert_eq!(body["data"]["age"], 18);
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_student_success() {
    let (pool, app, token) = setup_test_app_with_token().await;

    // 创建测试学生
    let student_repo = teacher_api::db::StudentRepository::new(pool);
    let create_req = teacher_api::models::CreateStudentRequest {
        student_no: "TEST_HANDLER_DELETE".to_string(),
        name: "Handler删除测试".to_string(),
        gender: Some("男".to_string()),
        age: Some(17),
        class_name: "高三(1)班".to_string(),
        phone: None,
        email: None,
        address: None,
        parent_name: None,
        parent_phone: None,
    };

    let created = student_repo.create(create_req).await.unwrap();

    // 删除学生
    let delete_req = test::TestRequest::delete()
        .uri(&format!("/api/v1/students/{}", created.id))
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, delete_req).await;

    assert_eq!(resp.status(), StatusCode::OK, "删除学生应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_student_not_found() {
    let (_, app, token) = setup_test_app_with_token().await;

    // 删除不存在的学生
    let delete_req = test::TestRequest::delete()
        .uri(&format!("/api/v1/students/{}", uuid::Uuid::new_v4()))
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, delete_req).await;

    assert_eq!(resp.status(), StatusCode::BAD_REQUEST, "删除不存在的学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_list_students_with_pagination() {
    let (_, app, token) = setup_test_app_with_token().await;

    // 测试分页
    let list_req = test::TestRequest::get()
        .uri("/api/v1/students?page=2&page_size=5")
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, list_req).await;

    assert_eq!(resp.status(), StatusCode::OK, "分页查询应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert_eq!(body["data"]["page"], 2);
    assert_eq!(body["data"]["page_size"], 5);
}

#[tokio::test]
#[serial_test::serial]
async fn test_list_students_with_keyword() {
    let (pool, app, token) = setup_test_app_with_token().await;

    // 创建特定学生
    let student_repo = teacher_api::db::StudentRepository::new(pool);
    let create_req = teacher_api::models::CreateStudentRequest {
        student_no: "TEST_HANDLER_KEYWORD".to_string(),
        name: "关键字搜索测试".to_string(),
        gender: Some("男".to_string()),
        age: Some(17),
        class_name: "高三(1)班".to_string(),
        phone: None,
        email: None,
        address: None,
        parent_name: None,
        parent_phone: None,
    };

    student_repo.create(create_req).await.unwrap();

    // 使用关键字搜索
    let list_req = test::TestRequest::get()
        .uri("/api/v1/students?keyword=关键字")
        .insert_header(auth_header(&token))
        .to_request();

    let resp = test::call_service(&app, list_req).await;

    assert_eq!(resp.status(), StatusCode::OK, "关键字搜索应该成功");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], 200);
    assert!(body["data"]["items"].as_array().unwrap().len() >= 1);
}