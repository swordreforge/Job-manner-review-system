# 教师端管理系统

一个基于Rust开发的教师端管理系统，提供系统监控和数据管理功能。

## 功能特性

### 系统监控
- 实时监控数据库连接状态
- 查看系统资源使用情况
- 统计数据库中各类数据的数量
- 自动刷新数据（30秒间隔）

### 数据管理
- **学生管理**：查看、编辑、删除学生信息
- **职位管理**：管理职位信息，包括公司、行业、薪资等
- **面试管理**：查看面试会话和对话记录

## 技术栈

- **语言**：Rust 2024 Edition
- **Web框架**：Axum 0.7
- **数据库**：MySQL (使用SQLx)
- **模板引擎**：Askama
- **静态资源嵌入**：rust-embed
- **命令行解析**：Clap 4.5
- **日志**：Tracing

## 项目结构

```
teacher-app/
├── src/
│   ├── main.rs           # 应用入口
│   ├── config/           # 配置管理
│   │   └── mod.rs
│   ├── models/           # 数据模型
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── student.rs
│   │   ├── job.rs
│   │   ├── interview.rs
│   │   └── career_report.rs
│   ├── services/         # 业务逻辑层
│   │   ├── mod.rs
│   │   ├── database.rs
│   │   ├── student_service.rs
│   │   ├── job_service.rs
│   │   ├── interview_service.rs
│   │   └── monitor_service.rs
│   ├── handlers/         # HTTP处理器
│   │   ├── mod.rs
│   │   ├── dashboard.rs
│   │   ├── students.rs
│   │   ├── jobs.rs
│   │   ├── interviews.rs
│   │   └── api.rs
│   └── static_assets.rs  # 静态资源管理
├── template/             # 模板文件目录
├── static/               # 静态资源目录
├── Cargo.toml            # 项目配置
└── README.md             # 项目文档
```

## 数据库表结构

应用使用以下数据库表：

- `users` - 用户表
- `students` - 学生信息表
- `jobs` - 职位信息表
- `interview_sessions` - 面试会话表
- `interview_messages` - 面试消息表
- `interview_reports` - 面试报告表
- `career_reports` - 职业规划报告表

## 安装和运行

### 前置要求

- Rust 1.75 或更高版本
- MySQL 5.7 或更高版本
- Cargo（Rust包管理器）

### 安装依赖

```bash
cargo build
```

### 运行应用

```bash
# 使用默认配置运行
cargo run -- --db-password your_password

# 指定自定义配置
cargo run -- \
  --host 0.0.0.0 \
  --port 8848 \
  --db-host localhost \
  --db-port 3306 \
  --db-name career_db \
  --db-user root \
  --db-password your_password \
  --log-level info
```

### 命令行参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--host` | 127.0.0.1 | 服务器监听地址 |
| `--port` | 8848 | 服务器监听端口 |
| `--db-host` | 127.0.0.1 | 数据库主机地址 |
| `--db-port` | 3306 | 数据库端口 |
| `--db-name` | career_db | 数据库名称 |
| `--db-user` | root | 数据库用户名 |
| `--db-password` | (必需) | 数据库密码 |
| `--log-level` | info | 日志级别 |

## 单文件部署

使用rust-embed实现单文件部署，所有静态资源都会嵌入到二进制文件中。

### 构建发布版本

```bash
cargo build --release
```

生成的二进制文件位于 `target/release/teacher-app`

### 部署

```bash
# 复制二进制文件到目标服务器
scp target/release/teacher-app user@server:/path/to/deploy/

# 在目标服务器上运行
./teacher-app --db-password your_password
```

## API接口

### 获取系统指标

```
GET /api/metrics
```

响应示例：
```json
{
  "timestamp": 1712847600,
  "uptime_seconds": 3600,
  "memory_usage_mb": 512,
  "cpu_cores": 4,
  "database_stats": {
    "user_count": 10,
    "student_count": 5,
    "job_count": 20,
    "interview_count": 15,
    "report_count": 8
  },
  "database_connected": true
}
```

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 系统监控仪表板 |
| `/students` | 学生管理页面 |
| `/jobs` | 职位管理页面 |
| `/interviews` | 面试管理页面 |
| `/interviews/view/:id` | 面试详情页面 |

## 开发

### 运行开发服务器

```bash
cargo run
```

### 运行测试

```bash
cargo test
```

### 代码格式化

```bash
cargo fmt
```

### 代码检查

```bash
cargo clippy
```

## 配置说明

### 数据库配置

确保MySQL数据库已创建并配置了正确的用户权限：

```sql
CREATE DATABASE IF NOT EXISTS career_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON career_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 导入示例数据

项目包含SQL备份文件 `career_db_backup_20260410_222945.sql`，可用于导入示例数据：

```bash
mysql -u root -p career_db < career_db_backup_20260410_222945.sql
```

## 常见问题

### 无法连接到数据库

1. 检查MySQL服务是否运行
2. 确认数据库用户名和密码正确
3. 检查防火墙设置
4. 验证数据库权限

### 端口被占用

如果默认端口8848被占用，可以使用`--port`参数指定其他端口：

```bash
cargo run -- --port 9999 --db-password your_password
```

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请通过GitHub Issues联系。