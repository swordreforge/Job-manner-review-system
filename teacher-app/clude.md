# 教师端 API 项目规范 (clude.md)

## 项目概述

教师端 API 基于 Rust + Actix-web 框架开发，为高中职业规划系统提供数据管理和运维功能。

### 技术栈
- 语言: Rust 2024 Edition
- Web 框架: Actix-web 4.9
- 数据库: MySQL (sqlx)
- 异步运行时: Tokio

---

## 功能状态分析

### 已实现功能 ✅

| 模块 | 功能 | 状态 | 说明 |
|------|------|------|------|
| 基础架构 | 应用构建器 | ✅ 完成 | `app.rs` 实现链式配置 |
| 基础架构 | 路由系统 | ✅ 完成 | `routes.rs` 模块化路由 |
| 基础架构 | 应用状态 | ✅ 完成 | `state.rs` 统一状态管理 |
| 基础架构 | 数据库连接池 | ✅ 完成 | `db/pool.rs` |
| 认证 | 登录接口 | ⚠️ 占位 | `auth.rs` 仅返回 mock 数据 |
| 学生 | CRUD 接口 | ⚠️ 占位 | `student.rs` 仅返回空数据 |
| 测试 | 查询接口 | ⚠️ 占位 | `test.rs` 仅返回空数据 |
| 运维 | 状态监控 | ⚠️ 占位 | `ops.rs` 返回 mock 数据 |
| 运维 | 备份接口 | ⚠️ 占位 | 仅返回 mock 数据 |
| API 规范 | Traits 定义 | ✅ 完成 | `traits.rs` 接口抽象 |
| API 规范 | 统一响应 | ✅ 完成 | `utils/response.rs` |

### 未实现功能 ❌

| 模块 | 功能 | 优先级 | 依赖 |
|------|------|--------|------|
| 认证 | JWT Token 验证 | P0 | middleware |
| 认证 | Token 刷新 | P1 | - |
| 认证 | 登出接口 | P1 | - |
| 学生 | 数据库 CRUD | P0 | models, services |
| 学生 | 搜索/筛选 | P1 | - |
| 学生 | 数据导出 (CSV) | P2 | - |
| 学生 | 统计分析 | P2 | - |
| 测试 | 数据库 CRUD | P1 | models, services |
| 测试 | 结果统计分析 | P2 | - |
| 报告 | 报告查询 | P1 | models |
| 报告 | 批量生成 | P2 | - |
| 报告 | 模板管理 | P3 | - |
| 运维 | 真实状态监控 | P1 | - |
| 运维 | 数据库备份 | P1 | - |
| 运维 | 数据恢复 | P2 | - |
| 运维 | 系统配置 | P2 | - |
| 中间件 | 认证中间件 | P0 | JWT |
| 中间件 | 日志中间件 | P1 | - |
| 中间件 | 限流中间件 | P3 | - |
| 前端 | Vue 3 界面 | P1 | API 完成后 |
| 前端 | 嵌入式部署 | P2 | - |

---

## 项目规范

### 代码组织规范

```
src/
├── main.rs              # 入口点，仅负责启动
├── app.rs               # 应用构建器
├── config.rs            # 配置管理
├── state.rs             # 应用状态
├── routes.rs            # 路由配置
├── traits.rs            # 服务接口定义
├── embedded.rs          # 嵌入式静态文件
├── handlers/            # 请求处理层
│   ├── mod.rs
│   ├── auth.rs          # 认证处理
│   ├── student.rs       # 学生处理
│   ├── test.rs          # 测试处理
│   ├── report.rs        # 报告处理 (待创建)
│   └── ops.rs           # 运维处理
├── services/            # 业务逻辑层
│   ├── mod.rs
│   ├── auth_service.rs  # (待创建)
│   ├── student_service.rs # (待创建)
│   ├── test_service.rs  # (待创建)
│   └── report_service.rs # (待创建)
├── models/              # 数据模型层
│   ├── mod.rs
│   ├── student.rs       # (待创建)
│   ├── test.rs          # (待创建)
│   └── report.rs        # (待创建)
├── middleware/          # 中间件层
│   ├── mod.rs
│   ├── auth.rs          # (待创建)
│   └── logging.rs       # (待创建)
├── db/                  # 数据库层
│   ├── mod.rs
│   └── pool.rs
└── utils/               # 工具函数
    ├── mod.rs
    └── response.rs
```

### 接口规范

#### RESTful 规范
- 标准 HTTP 方法: GET (查询), POST (创建), PUT (更新), DELETE (删除)
- JSON 数据格式
- 分页参数: `page`, `page_size`
- 统一响应结构

#### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "错误信息",
  "error": "详细描述"
}
```

### 开发规范

1. **错误处理**: 使用 `anyhow` 进行统一错误处理
2. **异步编程**: 所有 IO 操作使用 `async/await`
3. **类型安全**: 充分利用 Rust 编译期检查
4. **代码格式化**: `cargo fmt`
5. **代码检查**: `cargo clippy`
6. **测试覆盖**: 核心功能必须有单元测试

---

## 开发阶段规划

### 阶段一: 核心功能实现 (P0)

**目标**: 完成认证和学生数据管理核心功能

| 任务 | 文件 | 工作量 | 验收标准 |
|------|------|--------|----------|
| 实现学生 Model | `models/student.rs` | 2h | 定义完整的学生数据结构 |
| 实现学生 Repository | `db/student.rs` | 3h | 完成 CRUD 数据库操作 |
| 实现学生 Service | `services/student_service.rs` | 2h | 业务逻辑与数据库解耦 |
| 实现学生 Handler | `handlers/student.rs` | 2h | 调用 Service 返回真实数据 |
| 实现认证中间件 | `middleware/auth.rs` | 3h | JWT Token 验证 |
| 实现登录 Service | `services/auth_service.rs` | 2h | 用户认证逻辑 |
| 更新登录 Handler | `handlers/auth.rs` | 1h | 调用认证 Service |
| 集成测试 | - | 2h | API 功能验证 |

**交付物**: 可用的学生管理和认证系统

### 阶段二: 扩展功能实现 (P1)

**目标**: 完成测试管理和运维功能

| 任务 | 文件 | 工作量 | 验收标准 |
|------|------|--------|----------|
| 实现测试 Model | `models/test.rs` | 2h | 测试记录数据结构 |
| 实现测试 Repository | `db/test.rs` | 3h | 测试数据 CRUD |
| 实现测试 Service | `services/test_service.rs` | 2h | 测试业务逻辑 |
| 实现测试 Handler | `handlers/test.rs` | 2h | 真实数据接口 |
| 实现报告 Model | `models/report.rs` | 2h | 报告数据结构 |
| 实现报告查询 | `services/report_service.rs` | 3h | 报告查询逻辑 |
| 实现系统监控 | `services/ops_service.rs` | 2h | 真实系统状态 |
| 实现备份功能 | `services/backup_service.rs` | 3h | 数据库备份 |

**交付物**: 完整的测试管理和运维系统

### 阶段三: 高级功能实现 (P2)

**目标**: 实现数据分析和导出功能

| 任务 | 文件 | 工作量 | 验收标准 |
|------|------|--------|----------|
| 学生搜索功能 | services/student_service.rs | 2h | 支持多条件搜索 |
| 数据导出 | handlers/student.rs | 3h | CSV/Excel 导出 |
| 统计分析 | services/statistics_service.rs | 4h | 数据图表统计 |
| 批量操作 | services/student_service.rs | 2h | 批量编辑/删除 |
| 日志中间件 | middleware/logging.rs | 2h | 请求日志记录 |
| 缓存管理 | services/cache_service.rs | 3h | Redis 缓存 |

**交付物**: 完善的数据分析和导出功能

### 阶段四: 前端集成 (P3)

**目标**: 完成 Vue 3 前端界面

| 任务 | 文件 | 工作量 | 验收标准 |
|------|------|--------|----------|
| 项目初始化 | `template/teacher-frontend/` | 2h | Vue 3 + Vite 项目 |
| 登录页面 | `views/Login.vue` | 2h | 用户登录 |
| 学生列表 | `views/Student/List.vue` | 3h | 列表、分页、搜索 |
| 学生详情 | `views/Student/Detail.vue` | 2h | 详细信息查看 |
| 测试管理 | `views/Test/List.vue` | 3h | 测试记录管理 |
| 报告查看 | `views/Report/List.vue` | 2h | 报告列表 |
| 运维面板 | `views/Ops/Dashboard.vue` | 3h | 系统状态监控 |
| 嵌入式构建 | `embedded.rs` | 2h | 静态文件嵌入 |

**交付物**: 可独立部署的前后端一体应用

---

## 功能缺失清单 (Checklist)

### 认证模块
- [ ] JWT Token 生成和验证
- [ ] Token 过期自动刷新
- [ ] 登出时 Token 黑名单
- [ ] 密码加密存储
- [ ] 登录失败次数限制

### 学生管理模块
- [ ] 学生数据 Model 定义
- [ ] 数据库 CRUD 操作
- [ ] 分页查询
- [ ] 关键字搜索
- [ ] 批量导入
- [ ] CSV 导出
- [ ] Excel 导出
- [ ] 数据统计图表

### 测试管理模块
- [ ] 测试记录 Model 定义
- [ ] 测试结果数据库操作
- [ ] 测试类型筛选
- [ ] 测试时间范围查询
- [ ] 测试统计图表

### 报告管理模块
- [ ] 报告 Model 定义
- [ ] 报告查询接口
- [ ] 批量生成报告
- [ ] 报告模板管理
- [ ] 报告 PDF 导出

### 运维模块
- [ ] 真实系统状态获取
- [ ] 数据库备份命令执行
- [ ] 备份历史管理
- [ ] 数据恢复功能
- [ ] 系统配置管理
- [ ] 缓存清理

### 中间件
- [ ] JWT 认证中间件
- [ ] 请求日志中间件
- [ ] 错误处理中间件
- [ ] CORS 配置
- [ ] 限流中间件

### 前端
- [ ] Vue 3 项目搭建
- [ ] 登录页面
- [ ] 学生列表页面
- [ ] 学生详情页面
- [ ] 测试列表页面
- [ ] 报告查看页面
- [ ] 运维状态页面
- [ ] 深色主题
- [ ] 大屏适配
- [ ] 响应式布局

---

## 当前开发优先级

1. **最高优先级**: 完成学生 CRUD + 认证中间件
2. **高优先级**: 测试管理 + 报告查询
3. **中优先级**: 数据导出 + 统计分析
4. **低优先级**: 前端界面 + 高级运维

---

## 验收标准

### 阶段一验收
- [ ] POST /api/v1/auth/login 返回真实 JWT Token
- [ ] GET /api/v1/students 返回数据库学生列表
- [ ] 未经认证的请求返回 401

### 阶段二验收
- [ ] GET /api/v1/tests 返回测试记录
- [ ] GET /api/v1/ops/status 返回真实系统状态
- [ ] POST /api/v1/ops/backup 执行数据库备份

### 阶段三验收
- [ ] 支持学生数据导出 CSV
- [ ] 提供统计数据接口
- [ ] 日志正确记录请求

### 阶段四验收
- [ ] 前端可通过嵌入式静态文件访问
- [ ] 所有 API 与前端正常交互

---

## 文档更新记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-04-11 | v0.1 | 初始版本，创建项目规范 |
