use teacher_api::services::AuthService;
use teacher_api::models::{LoginRequest, CreateUserRequest};

#[tokio::test]
#[serial_test::serial]
async fn test_login_success() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool.clone());

    // 创建测试用户
    let user_repo = teacher_api::db::UserRepository::new(pool.clone());
    let create_req = CreateUserRequest {
        username: "TEST_login_user".to_string(),
        password: "test123456".to_string(),
        name: "测试登录用户".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    // 测试登录
    let auth_service = AuthService::new(&state);
    let login_req = LoginRequest {
        username: "TEST_login_user".to_string(),
        password: "test123456".to_string(),
    };

    let result = auth_service.login(login_req).await;
    assert!(result.is_ok(), "登录应该成功");

    let response = result.unwrap();
    assert!(!response.token.is_empty(), "Token 不应该为空");
    assert_eq!(response.user.username, "TEST_login_user");
}

#[tokio::test]
#[serial_test::serial]
async fn test_login_user_not_found() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    // 测试登录不存在的用户
    let auth_service = AuthService::new(&state);
    let login_req = LoginRequest {
        username: "nonexistent_user".to_string(),
        password: "test123456".to_string(),
    };

    let result = auth_service.login(login_req).await;
    assert!(result.is_err(), "登录不存在的用户应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_login_wrong_password() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool.clone());

    // 创建测试用户
    let user_repo = teacher_api::db::UserRepository::new(pool.clone());
    let create_req = CreateUserRequest {
        username: "TEST_wrong_password_user".to_string(),
        password: "correct_password".to_string(),
        name: "测试密码错误用户".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    // 测试使用错误密码登录
    let auth_service = AuthService::new(&state);
    let login_req = LoginRequest {
        username: "TEST_wrong_password_user".to_string(),
        password: "wrong_password".to_string(),
    };

    let result = auth_service.login(login_req).await;
    assert!(result.is_err(), "使用错误密码登录应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_token_generation() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool.clone());

    // 创建测试用户
    let user_repo = teacher_api::db::UserRepository::new(pool);
    let create_req = CreateUserRequest {
        username: "TEST_token_user".to_string(),
        password: "test123456".to_string(),
        name: "测试Token用户".to_string(),
        role: Some("teacher".to_string()),
    };

    let user = user_repo.create(create_req).await.unwrap();

    // 登录获取 Token
    let auth_service = AuthService::new(&state);
    let login_req = LoginRequest {
        username: "TEST_token_user".to_string(),
        password: "test123456".to_string(),
    };

    let result = auth_service.login(login_req).await.unwrap();
    assert!(!result.token.is_empty(), "Token 应该被生成");
}

#[tokio::test]
#[serial_test::serial]
async fn test_token_verification() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool.clone());

    // 创建测试用户并登录
    let user_repo = teacher_api::db::UserRepository::new(pool.clone());
    let create_req = CreateUserRequest {
        username: "TEST_verify_user".to_string(),
        password: "test123456".to_string(),
        name: "测试验证用户".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    let auth_service = AuthService::new(&state);
    let login_req = LoginRequest {
        username: "TEST_verify_user".to_string(),
        password: "test123456".to_string(),
    };

    let result = auth_service.login(login_req).await.unwrap();

    // 验证 Token
    let token_info = auth_service.verify_token(&result.token).unwrap();
    assert_eq!(token_info.username, "TEST_verify_user");
    assert_eq!(token_info.role, "teacher");
}

#[tokio::test]
#[serial_test::serial]
async fn test_token_verification_invalid() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let auth_service = AuthService::new(&state);

    // 验证无效 Token
    let result = auth_service.verify_token("invalid_token");
    assert!(result.is_err(), "验证无效 Token 应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_token_refresh() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool.clone());

    // 创建测试用户并登录
    let user_repo = teacher_api::db::UserRepository::new(pool);
    let create_req = CreateUserRequest {
        username: "TEST_refresh_user".to_string(),
        password: "test123456".to_string(),
        name: "测试刷新用户".to_string(),
        role: Some("teacher".to_string()),
    };

    user_repo.create(create_req).await.unwrap();

    let auth_service = AuthService::new(&state);
    let login_req = LoginRequest {
        username: "TEST_refresh_user".to_string(),
        password: "test123456".to_string(),
    };

    let result = auth_service.login(login_req).await.unwrap();

    // 刷新 Token
    let new_token = auth_service.refresh_token(&result.token).unwrap();
    assert!(!new_token.is_empty(), "新 Token 不应该为空");
    assert_ne!(new_token, result.token, "新 Token 应该与旧 Token 不同");
}