use sqlx::MySqlPool;
use std::sync::Arc;
use uuid::Uuid;

/// 测试数据库配置
pub async fn setup_test_database() -> MySqlPool {
    // 从环境变量获取测试数据库 URL
    dotenv::dotenv().ok();

    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "mysql://root:password@localhost:3306/career_db_test".to_string());

    // 创建连接池
    let pool = MySqlPool::connect(&database_url)
        .await
        .expect("Failed to connect to test database");

    // 清理测试数据
    cleanup_test_data(&pool).await;

    pool
}

/// 清理测试数据
async fn cleanup_test_data(pool: &MySqlPool) {
    sqlx::query("DELETE FROM students WHERE student_no LIKE 'TEST_%'")
        .execute(pool)
        .await
        .ok();

    sqlx::query("DELETE FROM users WHERE username LIKE 'TEST_%'")
        .execute(pool)
        .await
        .ok();
}

/// 创建测试应用状态
pub fn create_test_state(pool: MySqlPool) -> teacher_api::state::AppState {
    let config = teacher_api::config::Config {
        database_url: "test".to_string(),
        server_host: "127.0.0.1".to_string(),
        server_port: 8081,
        jwt_secret: "test-secret-key-for-testing".to_string(),
    };

    teacher_api::state::AppState::new(pool, config)
}

/// 生成测试学生数据
pub fn create_test_student() -> teacher_api::models::CreateStudentRequest {
    teacher_api::models::CreateStudentRequest {
        student_no: format!("TEST_{}", Uuid::new_v4()),
        name: "测试学生".to_string(),
        gender: Some("男".to_string()),
        age: Some(17),
        class_name: "高三(1)班".to_string(),
        phone: Some("13800138000".to_string()),
        email: Some("test@example.com".to_string()),
        address: Some("北京市朝阳区".to_string()),
        parent_name: Some("测试家长".to_string()),
        parent_phone: Some("13900139000".to_string()),
    }
}

/// 生成测试用户数据
pub fn create_test_user() -> teacher_api::models::CreateUserRequest {
    teacher_api::models::CreateUserRequest {
        username: format!("TEST_{}", Uuid::new_v4()),
        password: "test123456".to_string(),
        name: "测试用户".to_string(),
        role: Some("teacher".to_string()),
    }
}