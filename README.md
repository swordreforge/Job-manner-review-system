# Teacher API

基于Rust + Actix-web框架开发的教师端API，主要提供数据管理和简单运维功能。

## 技术栈

- **语言**: Rust 2024 Edition
- **Web框架**: Actix-web 4.9
- **数据库**: MySQL (使用sqlx)
- **异步运行时**: Tokio

## 快速开始

### 前置要求

- Rust 1.96.0 或更高版本
- MySQL 数据库
- Git

### 安装

1. 克隆项目
```bash
cd teacher-app
```

2. 复制环境变量配置文件
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件，配置数据库连接信息
```env
DATABASE_URL=mysql://root:password@localhost/career_db
SERVER_HOST=127.0.0.1
SERVER_PORT=8081
JWT_SECRET=your-secret-key-change-in-production
```

4. 构建项目
```bash
cargo build
```

5. 运行服务器
```bash
cargo run
```

### 开发模式

运行开发服务器（支持热重载）：
```bash
cargo run
```

### 测试API

服务器启动后，可以通过以下API进行测试：

- 健康检查：`http://127.0.0.1:8081/health`
- 根路径：`http://127.0.0.1:8081/`

使用curl测试：
```bash
# 健康检查
curl http://127.0.0.1:8081/health

# 根路径
curl http://127.0.0.1:8081/
```

## 项目结构

```
teacher-app/
├── src/
│   ├── main.rs              # 应用入口
│   ├── config.rs            # 配置管理
│   ├── models/              # 数据模型
│   ├── handlers/            # 请求处理器
│   ├── services/            # 业务逻辑
│   ├── middleware/          # 中间件
│   ├── db/                  # 数据库
│   └── utils/               # 工具函数
├── .env                     # 环境变量
├── Cargo.toml               # 依赖配置
├── README.md                # 本文档
└── 开发计划.md              # 详细开发计划
```

## 开发计划

详细的开发计划请参考 [开发计划.md](./开发计划.md) 文档。

### 主要功能模块

1. **数据管理模块**
   - 学生数据管理
   - 测试数据管理
   - 职业规划报告管理

2. **运维功能模块**
   - 系统监控
   - 数据备份
   - 系统配置

## 代码规范

- 遵循Rust官方代码风格
- 使用 `cargo clippy` 进行代码检查
- 运行 `cargo fmt` 格式化代码

## 常用命令

```bash
# 检查代码
cargo check

# 运行测试
cargo test

# 代码检查
cargo clippy

# 格式化代码
cargo fmt

# 构建生产版本
cargo build --release
```

## 数据库

项目使用MySQL数据库，请确保数据库已创建并配置正确的连接信息。

## 安全

- 生产环境请务必修改 `JWT_SECRET`
- 使用强密码保护数据库
- 启用HTTPS

## 贡献

欢迎提交Issue和Pull Request。

## 许可证

待定