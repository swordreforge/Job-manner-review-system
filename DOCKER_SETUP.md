# Docker 配置文件说明

本目录包含用于一键部署面试系统的 Docker 配置文件。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `Dockerfile` | 后端服务镜像构建文件 |
| `whisper-20250625/Dockerfile` | Whisper 服务镜像构建文件 |
| `high-school-worker-design-forend/Dockerfile` | 前端服务镜像构建文件 |
| `docker-compose.yml` | 基础模式配置（默认） |
| `docker-compose.dev.yml` | 开发模式配置（带源码挂载） |
| `docker-compose.prod.yml` | 生产模式配置（优化配置） |
| `.dockerignore` | Docker 构建忽略文件 |
| `.env.example` | 环境变量模板 |
| `Makefile` | 快捷命令 |
| `start.sh` | 一键启动脚本 |
| `DOCKER.md` | 详细使用文档 |

## 🚀 快速启动

### 方式 1: 使用启动脚本（推荐）

```bash
./start.sh
```

### 方式 2: 使用 Makefile

```bash
make up
```

### 方式 3: 使用 Docker Compose

```bash
# 基础模式
docker-compose up -d

# 开发模式
docker-compose -f docker-compose.dev.yml up -d

# 生产模式
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 启动模式说明

### 基础模式 (docker-compose.yml)

- 适用场景：快速测试、演示
- 特点：
  - 使用默认配置
  - 所有服务在容器中运行
  - 适合初步体验

### 开发模式 (docker-compose.dev.yml)

- 适用场景：开发调试
- 特点：
  - 源码挂载到容器
  - 修改代码无需重新构建
  - 支持热重载
  - 适合开发环境

### 生产模式 (docker-compose.prod.yml)

- 适用场景：生产部署
- 特点：
  - 资源限制和优化
  - 健康检查
  - 自动重启
  - 环境变量配置
  - 适合生产环境

## 🔧 配置说明

### 环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
vim .env
```

主要配置项：

```bash
# 数据库密码
MYSQL_ROOT_PASSWORD=your_secure_password

# Whisper 模型
WHISPER_MODEL=small  # base, small, medium, large

# 端口配置
BACKEND_PORT=8088
FRONTEND_PORT=80
```

### 端口说明

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| Whisper | 8000 | 语音识别 |
| Backend | 8088 | 后端 API |
| Frontend | 80 | 前端服务 |
| Prometheus | 9091 | 监控 |

## 🛠️ 常用命令

### 服务管理

```bash
# 启动服务
make up

# 停止服务
make down

# 重启服务
make restart

# 查看状态
make ps

# 查看日志
make logs
```

### 特定服务操作

```bash
# 查看后端日志
make logs-backend

# 重启 Whisper 服务
make restart-whisper
```

### 数据备份

```bash
# 备份数据库
make backup

# 恢复数据库
make restore
```

## 📊 服务架构

```
┌─────────────────────────────────────────┐
│           Nginx (可选)                  │
│           Port: 80/443                  │
└────────┬────────────────────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
┌────────▼────────┐          ┌─────────▼─────────┐
│   Frontend      │          │   Backend        │
│   Port: 80      │◄─────────│   Port: 8088     │
└─────────────────┘          └────────┬─────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
┌────────▼────────┐      ┌──────────▼──────────┐      ┌────────▼────────┐
│   Whisper       │      │   MySQL            │      │   Redis         │
│   Port: 8000    │      │   Port: 3306       │      │   Port: 6379    │
└─────────────────┘      └─────────────────────┘      └─────────────────┘
```

## 🔍 健康检查

所有服务都配置了健康检查：

```bash
# 检查服务健康状态
docker-compose ps

# 手动测试健康检查
curl http://localhost:8000/health  # Whisper
curl http://localhost:8088/health  # Backend
```

## 📈 性能优化

### 资源限制

生产模式下配置了资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
    reservations:
      cpus: '2'
      memory: 2G
```

### 缓存优化

- Whisper 模型自动缓存到卷
- Redis 开启持久化
- Nginx 静态资源缓存

## 🐛 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs -f

# 检查端口占用
netstat -tulpn | grep <port>

# 重新构建镜像
docker-compose build --no-cache
```

### 数据库连接失败

```bash
# 检查 MySQL 状态
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 测试连接
docker-compose exec backend mysql -h mysql -uroot -p
```

### Whisper 服务不可用

```bash
# 检查 Whisper 状态
docker-compose ps whisper

# 查看 Whisper 日志
docker-compose logs whisper

# 测试健康检查
curl http://localhost:8000/health
```

## 🔒 安全建议

1. **修改默认密码**：更改 `.env` 中的密码
2. **使用环境变量**：敏感信息通过环境变量传递
3. **限制网络访问**：生产环境使用 Nginx 反向代理
4. **定期备份**：使用 `make backup` 定期备份数据
5. **更新镜像**：定期更新 Docker 镜像

## 📚 更多文档

- [Docker 完整指南](DOCKER.md)
- [Whisper 集成方案](docs/Whisper语音功能集成方案.md)
- [项目 README](README.md)

## 💡 提示

- 首次启动需要 10-20 分钟下载和构建镜像
- Whisper 模型首次加载需要 2-5 秒
- 开发模式支持源码热重载
- 生产模式使用优化配置
- 使用 `make` 命令可以简化操作

## 🆘 获取帮助

如遇问题，请查看：

1. 服务日志：`docker-compose logs`
2. 健康状态：`docker-compose ps`
3. 详细文档：`DOCKER.md`
4. GitHub Issues

---

**祝你使用愉快！** 🎉