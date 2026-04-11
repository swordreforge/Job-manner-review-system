use teacher_api::services::StudentService;
use teacher_api::models::{StudentQuery, UpdateStudentRequest};

#[tokio::test]
#[serial_test::serial]
async fn test_create_student() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);
    let create_req = common::create_test_student();

    let result = student_service.create_student(create_req).await;
    assert!(result.is_ok(), "创建学生应该成功");

    let student = result.unwrap();
    assert!(!student.id.to_string().is_empty(), "学生 ID 不应该为空");
    assert!(student.student_no.starts_with("TEST_"), "学号应该以 TEST_ 开头");
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_duplicate_student_no() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建第一个学生
    let mut create_req = common::create_test_student();
    create_req.student_no = "TEST_DUPLICATE_001".to_string();
    student_service.create_student(create_req.clone()).await.unwrap();

    // 尝试创建学号相同的学生
    let result = student_service.create_student(create_req).await;
    assert!(result.is_err(), "创建学号相同的学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_student() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建学生
    let create_req = common::create_test_student();
    let created = student_service.create_student(create_req).await.unwrap();

    // 查询学生
    let result = student_service.get_student(&created.id).await;
    assert!(result.is_ok(), "查询学生应该成功");

    let student = result.unwrap();
    assert_eq!(student.id, created.id);
    assert_eq!(student.name, "测试学生");
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_student_not_found() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 查询不存在的学生
    let result = student_service.get_student(&uuid::Uuid::new_v4()).await;
    assert!(result.is_err(), "查询不存在的学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_list_students() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建多个学生
    for i in 0..3 {
        let mut create_req = common::create_test_student();
        create_req.student_no = format!("TEST_LIST_{}", i);
        student_service.create_student(create_req).await.unwrap();
    }

    // 查询学生列表
    let query = StudentQuery {
        page: Some(1),
        page_size: Some(10),
        keyword: None,
        class_name: None,
    };

    let result = student_service.list_students(query).await;
    assert!(result.is_ok(), "查询学生列表应该成功");

    let (students, total) = result.unwrap();
    assert!(students.len() >= 3, "应该至少有 3 个学生");
    assert!(total >= 3, "总数应该至少为 3");
}

#[tokio::test]
#[serial_test::serial]
async fn test_list_students_with_keyword() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建特定学生
    let mut create_req = common::create_test_student();
    create_req.name = "特殊学生".to_string();
    create_req.student_no = "TEST_SPECIAL".to_string();
    student_service.create_student(create_req).await.unwrap();

    // 使用关键字搜索
    let query = StudentQuery {
        page: Some(1),
        page_size: Some(10),
        keyword: Some("特殊".to_string()),
        class_name: None,
    };

    let result = student_service.list_students(query).await;
    assert!(result.is_ok(), "使用关键字搜索应该成功");

    let (students, _) = result.unwrap();
    assert!(students.len() >= 1, "应该找到至少 1 个学生");
    assert!(students.iter().any(|s| s.name.contains("特殊")), "应该包含特殊学生");
}

#[tokio::test]
#[serial_test::serial]
async fn test_update_student() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建学生
    let create_req = common::create_test_student();
    let created = student_service.create_student(create_req).await.unwrap();

    // 更新学生
    let update_req = UpdateStudentRequest {
        name: Some("更新后的学生".to_string()),
        age: Some(18),
        phone: Some("13900139999".to_string()),
        ..Default::default()
    };

    let result = student_service.update_student(&created.id, update_req).await;
    assert!(result.is_ok(), "更新学生应该成功");

    let updated = result.unwrap();
    assert_eq!(updated.name, "更新后的学生");
    assert_eq!(updated.age, Some(18));
}

#[tokio::test]
#[serial_test::serial]
async fn test_update_student_not_found() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 更新不存在的学生
    let update_req = UpdateStudentRequest {
        name: Some("不存在的学生".to_string()),
        ..Default::default()
    };

    let result = student_service.update_student(&uuid::Uuid::new_v4(), update_req).await;
    assert!(result.is_err(), "更新不存在的学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_student() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建学生
    let create_req = common::create_test_student();
    let created = student_service.create_student(create_req).await.unwrap();

    // 删除学生
    let result = student_service.delete_student(&created.id).await;
    assert!(result.is_ok(), "删除学生应该成功");

    // 验证学生已被删除
    let get_result = student_service.get_student(&created.id).await;
    assert!(get_result.is_err(), "删除后查询学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_student_not_found() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 删除不存在的学生
    let result = student_service.delete_student(&uuid::Uuid::new_v4()).await;
    assert!(result.is_err(), "删除不存在的学生应该失败");
}

#[tokio::test]
#[serial_test::serial]
async fn test_count_students() {
    let pool = common::setup_test_database().await;
    let pool = Arc::new(pool);
    let state = common::create_test_state(pool);

    let student_service = StudentService::new(&state);

    // 创建学生
    for i in 0..3 {
        let mut create_req = common::create_test_student();
        create_req.student_no = format!("TEST_COUNT_{}", i);
        student_service.create_student(create_req).await.unwrap();
    }

    // 统计学生数量
    let result = student_service.count_students().await;
    assert!(result.is_ok(), "统计学生数量应该成功");

    let count = result.unwrap();
    assert!(count >= 3, "应该至少有 3 个学生");
}