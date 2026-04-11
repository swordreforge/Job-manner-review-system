# 测试指南

## 测试概述

本项目包含完整的单元测试和集成测试，覆盖了以下模块：

- 认证服务
- 学生服务
- 认证处理器
- 学生处理器

## 测试环境设置

### 1. 创建测试数据库

```bash
mysql -u root -p < sql/init_test.sql
```

### 2. 配置环境变量

创建 `.env` 文件并添加测试数据库配置：

```bash
TEST_DATABASE_URL=mysql://root:password@localhost:3306/career_db_test
```

或者复制示例文件：

```bash
cp .env.test.example .env
```

## 运行测试

### 运行所有测试

```bash
./test.sh
```

或者使用 cargo：

```bash
cargo test
```

### 运行特定测试模块

```bash
# 运行认证服务测试
cargo test --test '*' auth_service

# 运行学生服务测试
cargo test --test '*' student_service

# 运行认证处理器测试
cargo test --test '*' auth_handler

# 运行学生处理器测试
cargo test --test '*' student_handler
```

### 运行特定测试用例

```bash
# 运行特定测试
cargo test test_login_success

# 显示测试输出
cargo test test_login_success -- --nocapture

# 显示详细输出
cargo test -- --test-threads=1 --nocapture
```

## 测试结构

```
tests/
├── common/
│   └── mod.rs              # 测试公共工具函数
├── services/
│   ├── mod.rs
│   ├── auth_service_test.rs    # 认证服务测试
│   └── student_service_test.rs # 学生服务测试
├── handlers/
│   ├── mod.rs
│   ├── auth_handler_test.rs    # 认证处理器测试
│   └── student_handler_test.rs # 学生处理器测试
└── mod.rs
```

## 测试覆盖率

### 生成覆盖率报告

```bash
# 安装 tarpaulin
cargo install cargo-tarpaulin

# 生成覆盖率报告
cargo tarpaulin --out Html --output-dir coverage/
```

覆盖率报告将生成在 `coverage/` 目录中。

## 测试最佳实践

### 1. 数据隔离

所有测试使用串行执行 (`serial_test`)，确保测试之间不会相互影响。

### 2. 数据清理

每个测试开始前会自动清理测试数据：

- 删除所有学号以 `TEST_` 开头的学生
- 删除所有用户名以 `TEST_` 开头的用户

### 3. 测试命名规范

测试用例使用描述性名称：

```
test_<功能>_<场景>_<预期结果>
```

示例：

- `test_login_success` - 测试登录成功
- `test_login_user_not_found` - 测试用户不存在
- `test_create_student_success` - 测试创建学生成功

## 测试用例说明

### 认证服务测试

- `test_login_success` - 登录成功
- `test_login_user_not_found` - 用户不存在
- `test_login_wrong_password` - 密码错误
- `test_token_generation` - Token 生成
- `test_token_verification` - Token 验证
- `test_token_verification_invalid` - 无效 Token 验证
- `test_token_refresh` - Token 刷新

### 学生服务测试

- `test_create_student` - 创建学生
- `test_create_duplicate_student_no` - 创建重复学号学生
- `test_get_student` - 查询学生
- `test_get_student_not_found` - 查询不存在的学生
- `test_list_students` - 查询学生列表
- `test_list_students_with_keyword` - 关键字搜索
- `test_update_student` - 更新学生
- `test_update_student_not_found` - 更新不存在的学生
- `test_delete_student` - 删除学生
- `test_delete_student_not_found` - 删除不存在的学生
- `test_count_students` - 统计学生数量

### 认证处理器测试

- `test_login_success` - 登录接口成功
- `test_login_invalid_credentials` - 无效凭据
- `test_login_missing_fields` - 缺少字段
- `test_refresh_token_success` - 刷新 Token 成功
- `test_refresh_token_invalid` - 无效 Token 刷新
- `test_unauthorized_access` - 未认证访问
- `test_invalid_token_format` - 无效 Token 格式
- `test_missing_authorization_header` - 缺少 Authorization header

### 学生处理器测试

- `test_create_student_success` - 创建学生成功
- `test_create_student_without_auth` - 未认证创建学生
- `test_list_students_success` - 查询学生列表成功
- `test_get_student_success` - 查询学生成功
- `test_get_student_not_found` - 查询不存在的学生
- `test_update_student_success` - 更新学生成功
- `test_delete_student_success` - 删除学生成功
- `test_delete_student_not_found` - 删除不存在的学生
- `test_list_students_with_pagination` - 分页查询
- `test_list_students_with_keyword` - 关键字搜索

## 持续集成

测试配置为在 CI/CD 管道中自动运行：

```yaml
# 示例 GitHub Actions 配置
- name: Run tests
  run: |
    mysql -u root -proot < sql/init_test.sql
    export TEST_DATABASE_URL="mysql://root:proot@localhost:3306/career_db_test"
    cargo test -- --test-threads=1
```

## 故障排除

### 测试失败

1. 检查数据库连接是否正常
2. 确认测试数据库已创建
3. 验证环境变量配置正确
4. 查看详细错误信息：`cargo test -- --nocapture`

### 数据库连接错误

```bash
# 检查 MySQL 服务是否运行
systemctl status mysql

# 测试数据库连接
mysql -u root -p -e "USE career_db_test; SHOW TABLES;"
```

### 测试端口冲突

如果测试端口被占用，可以指定不同的端口：

```bash
cargo test -- --test-threads=1
```

## 贡献指南

添加新功能时，请确保：

1. 为新功能编写单元测试
2. 为新 API 端点编写集成测试
3. 确保所有测试通过
4. 保持测试覆盖率不低于 80%