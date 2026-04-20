# 职业规划系统 - Docker 快速部署指南

## 概述

基于构建产物的一键 Docker 部署方案，**无需编译源码**，直接使用预构建的二进制文件和项目数据集启动全部服务。

## 架构概览

```
                    ┌──────────────────────────────────┐
                    │         Nginx (8080)             │
                    │   反向代理 / 统一入口            │
                    └──────┬──────┬──────┬─────────────┘
                           │      │      │
              /api/v1/*    │      │      │  /voice/*
                      │      │      │
               ┌─────▼──┐ ┌▼──────▼┐ ┌▼──────────┐
               │career- │ │teacher-│ │  voice-api  │
               │ api    │ │ api    │ │  (8000)     │
               │(8088)  │ │(8081)  │ │  讯飞ASR    │
               └───┬────┘ └┬───────┘ └─────────────┘
                   │       │
              ┌────▼───────▼────┐
              │   MySQL (3307)   │
              │   Redis (6379)   │
              └─────────────────┘

         ┌──────────────┐
         │  Frontend    │
         │  Nginx (3000)│
         │  前端静态页面│
         └──────────────┘
```

## 服务清单

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| 前端 | career-frontend | 3000 | React 前端静态页面 |
| Nginx | career-nginx | 8080 | 反向代理统一入口 |
| 主服务后端 | career-api | 8088 | Go API 服务 |
| 管理端 | career-teacher-api | 8081 | Rust 管理端服务 |
| 语音服务 | career-voice-api | 8000 | 讯飞语音识别 |
| MySQL | career-mysql | 3307 | 数据库（自动初始化数据集） |
| Redis | career-redis | 6379 | 缓存 |

## 文件结构

```
快捷运维脚本/
├── quick-start.sh              # 一键部署脚本（核心入口）
├── stop.sh                     # 停止服务脚本
├── backup-db.sh                # 数据库备份脚本
└── docker/
    ├── .env.example            # 环境变量模板
    ├── career-api.Dockerfile    # 主服务后端镜像
    ├── teacher-api.Dockerfile  # 管理端镜像
    ├── voice-api.Dockerfile    # 语音服务镜像
    ├── docker-compose.yml      # 服务编排
    ├── nginx.conf              # 反向代理配置
    └── frontend.conf           # 前端 Nginx 配置
```

部署后生成的目录：

```
部署/
├── .env                        # 环境变量（交互式生成）
├── docker-compose.yml          # 服务编排
├── config/
│   └── career-api.yaml         # 主服务配置（自动从构建产物注入）
├── mysql-init/
│   └── 01-init.sql             # 项目数据集（自动注入）
├── nginx/
│   ├── nginx.conf              # 反向代理配置
│   └── frontend.conf           # 前端配置
└── frontend/                   # 前端构建产物
```

## 快速开始

### 前置条件

- **操作系统**: Linux（已验证 x86_64 架构）
- **Docker** >= 20.10
- **Docker Compose**（插件版或独立版均可）

### 一键部署

```bash
cd 快捷运维脚本
chmod +x quick-start.sh stop.sh
./quick-start.sh
```

脚本按顺序执行以下步骤：

1. **检查环境** — 验证 Docker 和 Docker Compose
2. **检查构建产物** — 确认所有二进制文件存在
3. **自动提取配置** — 从构建产物读取数据库、AI、端口等配置
4. **交互式配置** — 逐项确认或修改（MySQL 密码、AI Key、端口等）
5. **准备部署目录** — 复制数据集、前端、配置文件
6. **构建 Docker 镜像** — 基于预编译二进制（约 30 秒）
7. **启动服务** — docker compose up -d
8. **验证就绪** — 等待 MySQL 初始化完成

### 停止服务

```bash
./stop.sh
```

可选择是否删除数据卷。

### 重新部署

```bash
./quick-start.sh   # 自动停止旧服务后重新部署
```

### 查看服务状态

```bash
cd 部署 && docker compose -p career ps
```

### 查看日志

```bash
cd 部署 && docker compose -p career logs -f          # 全部日志
cd 部署 && docker compose -p career logs -f career-api  # 主服务日志
cd 部署 && docker compose -p career logs -f teacher-api  # 管理端日志
```

### 连接数据库

```bash
docker exec -it career-mysql mysql -uroot -pcareer2026 career_db
```

## 端口与路由

| 路径 | 上游服务 | 说明 |
|------|----------|------|
| `http://localhost:3000` | 前端 Nginx | 前端页面（直接访问） |
| `http://localhost:8080/api/v1/` | career-api:8088 | 主服务 API |
| `http://localhost:8080/health` | career-api:8088 | 健康检查 |
| `http://localhost:8080/admin/` | teacher-api:8081 | 管理后台 |
| `http://localhost:8080/voice/` | voice-api:8000 | 语音服务 |

各服务也可通过独立端口直接访问（8088、8081、8000）。

## 数据集自动注入

项目数据集（`项目数据集.sql`）通过 MySQL 的 `docker-entrypoint-initdb.d` 机制自动注入：

1. 脚本将 `项目数据集.sql` 复制到 `部署/mysql-init/01-init.sql`
2. MySQL 首次启动时自动执行该文件
3. 脚本从 SQL 文件中提取数据库名（`USE \`career_db\``），确保 `MYSQL_DATABASE` 环境变量匹配
4. 数据集包含建库、建表、INSERT 全套语句

**仅首次启动生效**。如需重新初始化，删除数据卷后重新部署：

```bash
cd 部署 && docker compose -p career down -v
./quick-start.sh
```

## 配置说明

### 环境变量

参见 `docker/.env.example`，关键配置：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | career2026 | MySQL root 密码 |
| `MYSQL_DATABASE` | career_db | 数据库名（自动从数据集提取） |
| `MYSQL_PORT` | 3307 | MySQL 宿主端口 |
| `CAREER_API_PORT` | 8088 | 主服务端口 |
| `TEACHER_API_PORT` | 8081 | 管理端端口 |
| `VOICE_API_PORT` | 8000 | 语音服务端口 |
| `FRONTEND_PORT` | 3000 | 前端端口 |
| `NGINX_PORT` | 8080 | Nginx 端口 |
| `JWT_SECRET` | career2026secret | JWT 签名密钥 |
| `AI_PROVIDER` | deepseek | AI 服务提供商 |
| `AI_API_KEY` | （从构建产物提取） | **务必配置正确的 API Key** |
| `AI_MODEL` | deepseek-chat | AI 模型名 |
| `AI_BASE_URL` | https://api.deepseek.com/v1 | AI API 地址 |
| `XUNFEI_APP_ID` | 140c88e2 | 讯飞应用 ID |
| `XUNFEI_API_KEY` | 63101bc8... | 讯飞 API Key |
| `XUNFEI_API_SECRET` | ZGRiNWVj... | 讯飞 API Secret |

### 配置自动注入

`部署/config/career-api.yaml` 由脚本根据用户输入动态生成，自动从构建产物提取：

- **数据库连接** — 使用用户输入密码 + Docker 内部网络 `mysql:3306`
- **Redis** — 指向 Docker 内部 `redis:6379`
- **AI 配置** — 从原始 `career-api.yaml.docker` 提取 Provider/Model/BaseURL
- **CORS** — 设为 `*` 允许所有来源

## 前端更新

如需更新前端，重新构建后重新部署：

```bash
cd 项目源码/forend
npm run build:staging    # 或 npm run build
cd ../../快捷运维脚本
./quick-start.sh         # 自动复制 dist 到部署目录
```

## 数据持久化

所有数据通过 Docker Volume 持久化：

| 数据卷 | 用途 |
|--------|------|
| `career-mysql-data` | MySQL 数据 |
| `career-redis-data` | Redis 持久化 |
| `career-upload-data` | 用户上传文件 |
| `career-teacher-data` | 管理端 SQLite |

查看数据卷：

```bash
docker volume ls | grep career
```

## 常见问题

### 端口被占用

修改 `部署/.env` 中对应端口号，然后 `docker compose -p career up -d`。

### 服务启动后 crash-looping

```bash
docker compose -p career logs <服务名> --tail 50
```

常见原因：
- **GLIBC 版本不匹配** — 确认使用 `ubuntu:24.04` 基础镜像
- **MySQL 连接失败** — 确认配置中 MySQL 地址是 `mysql:3306`（不是 `localhost`）
- **career-api 交互阻塞** — 确认 CMD 中包含 `--skip-all` 参数

### MySQL 连接 SSL 报错

teacher-api 已配置 `?ssl-mode=disabled`，如仍有问题检查 `部署/.env` 中的密码是否正确。

### Redis 内存 overcommit 警告

```bash
sudo sysctl -w vm.overcommit_memory=1
```

脚本启动时已自动尝试设置。

### 重新初始化数据库

```bash
cd 部署
docker compose -p career down -v   # 删除数据卷
cd ../快捷运维脚本
./quick-start.sh                    # 重新部署
```