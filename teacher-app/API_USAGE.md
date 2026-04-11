# 教师端 API 使用指南

## 快速开始

### 1. 数据库配置

首先创建数据库并执行初始化脚本:

```bash
mysql -u root -p
CREATE DATABASE career_db;
USE career_db;
SOURCE sql/init.sql;
```

### 2. 环境变量配置

创建 `.env` 文件:

```bash
DATABASE_URL=mysql://username:password@localhost:3306/career_db
SERVER_HOST=127.0.0.1
SERVER_PORT=8081
JWT_SECRET=your-secret-key-change-in-production
```

### 3. 运行应用

```bash
cargo run
```

或者使用开发脚本:

```bash
./dev.sh
```

## API 接口

### 认证接口

#### 登录

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

响应:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "username": "admin",
      "name": "管理员",
      "role": "admin",
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

#### 刷新 Token

```
POST /api/v1/auth/refresh
Authorization: Bearer <token>
```

### 学生管理接口 (需要认证)

所有学生管理接口都需要在请求头中包含有效的 JWT Token:

```
Authorization: Bearer <token>
```

#### 创建学生

```
POST /api/v1/students
Content-Type: application/json
Authorization: Bearer <token>

{
  "student_no": "2024001",
  "name": "张三",
  "gender": "男",
  "age": 17,
  "class_name": "高三(1)班",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "address": "北京市朝阳区",
  "parent_name": "张父",
  "parent_phone": "13900139000"
}
```

#### 查询学生列表

```
GET /api/v1/students?page=1&page_size=20&keyword=张&class_name=高三(1)班
Authorization: Bearer <token>
```

查询参数:
- `page`: 页码(默认1)
- `page_size`: 每页数量(默认20)
- `keyword`: 搜索关键字(匹配姓名或学号)
- `class_name`: 班级名称

响应:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": "...",
        "student_no": "2024001",
        "name": "张三",
        "gender": "男",
        "age": 17,
        "class_name": "高三(1)班",
        "phone": "13800138000",
        "email": "zhangsan@example.com",
        "address": "北京市朝阳区",
        "parent_name": "张父",
        "parent_phone": "13900139000",
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
}
```

#### 查询单个学生

```
GET /api/v1/students/{id}
Authorization: Bearer <token>
```

#### 更新学生

```
PUT /api/v1/students/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "张三(修改)",
  "age": 18,
  "phone": "13800138001"
}
```

#### 删除学生

```
DELETE /api/v1/students/{id}
Authorization: Bearer <token>
```

## 默认用户

系统预置了以下用户:

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| teacher | teacher123 | 教师 |

**重要**: 请在生产环境中修改默认密码!

## 错误响应

所有错误响应遵循统一格式:

```json
{
  "code": 401,
  "message": "未提供认证 Token",
  "error": "Unauthorized"
}
```

常见错误代码:
- `400`: 请求参数错误
- `401`: 未认证或 Token 无效
- `404`: 资源不存在
- `500`: 服务器内部错误

## 开发说明

### 项目结构

```
src/
├── handlers/        # HTTP 请求处理层
├── services/        # 业务逻辑层
├── models/          # 数据模型层
├── db/              # 数据库访问层
├── middleware/      # 中间件
├── utils/           # 工具函数
└── routes.rs        # 路由配置
```

### 添加新功能

1. 在 `models/` 中定义数据模型
2. 在 `db/` 中实现数据库操作
3. 在 `services/` 中实现业务逻辑
4. 在 `handlers/` 中实现 HTTP 处理器
5. 在 `routes.rs` 中配置路由

## 技术栈

- Rust 2024 Edition
- Actix-web 4.9
- MySQL (sqlx)
- JWT (jsonwebtoken)
- bcrypt (密码加密)
- Tokio (异步运行时)

## 注意事项

1. 生产环境请修改 `JWT_SECRET`
2. 建议使用 HTTPS 保护 API
3. 定期备份数据库
4. 监控服务器日志