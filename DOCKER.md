# Docker 一键部署指南

本文档说明如何使用 Docker Compose 一键部署面试系统的所有服务。

## 📦 服务架构

系统包含以下服务：

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| MySQL | career-mysql | 3306 | 数据库 |
| Redis | career-redis | 6379 | 缓存 |
| Whisper | career-whisper | 8000 | 语音识别服务 |
| Backend | career-backend | 8088, 9091 | 后端 API |
| Frontend | career-frontend | 80 | 前端服务 |

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 安装 Docker

**Ubuntu/Debian**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS**:
```bash
brew install --cask docker
```

**Windows**:
下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 启动服务

```bash
# 克隆仓库（如果还没有）
git clone git@github.com:swordreforge/Job-manner-review-system.git
cd Job-manner-review-system

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 访问服务

- **前端界面**: http://localhost
- **后端 API**: http://localhost:8088
- **Whisper 服务**: http://localhost:8000
- **Prometheus 监控**: http://localhost:9091

## 🛠️ 常用命令

### 启动和停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend

# 实时跟踪日志
docker-compose logs -f backend

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入 MySQL 容器
docker-compose exec mysql mysql -uroot -p123456zj

# 进入 Redis 容器
docker-compose exec redis redis-cli
```

### 构建镜像

```bash
# 重新构建所有镜像
docker-compose build

# 重新构建特定服务
docker-compose build backend

# 强制重新构建（无缓存）
docker-compose build --no-cache backend
```

## 📊 数据持久化

所有数据都存储在 Docker 卷中：

```bash
# 查看所有卷
docker volume ls

# 备份 MySQL 数据
docker-compose exec mysql mysqldump -uroot -p123456zj career_db > backup.sql

# 恢复 MySQL 数据
docker-compose exec -T mysql mysql -uroot -p123456zj career_db < backup.sql

# 备份 Redis 数据
docker-compose exec redis redis-cli BGSAVE
```

## 🔧 配置说明

### 环境变量

主要配置文件位于 `etc/career-api.yaml`，包含：

- 数据库连接
- Redis 连接
- AI 服务配置
- CORS 配置

### 修改配置

```bash
# 编辑配置文件
vim etc/career-api.yaml

# 重启后端服务应用配置
docker-compose restart backend
```

### Whisper 模型选择

修改 `docker-compose.yml` 中的环境变量：

```yaml
whisper:
  environment:
    - MODEL_NAME=small  # base, small, medium, large
```

重启服务：
```bash
docker-compose restart whisper
```

## 🐛 故障排查

### 服务无法启动

```bash
# 查看服务状态
docker-compose ps

# 查看详细日志
docker-compose logs <service-name>

# 检查端口占用
netstat -tulpn | grep <port>
```

### 数据库连接失败

```bash
# 检查 MySQL 是否正常运行
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 手动测试连接
docker-compose exec backend mysql -h mysql -uroot -p123456zj
```

### Whisper 服务不可用

```bash
# 检查 Whisper 服务状态
docker-compose ps whisper

# 查看 Whisper 日志
docker-compose logs whisper

# 测试健康检查
curl http://localhost:8000/health
```

### 前端无法访问后端

检查网络配置：
```bash
# 查看网络
docker network ls

# 检查服务是否在同一网络
docker network inspect <network-name>
```

## 📈 性能优化

### 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 缓存优化

Whisper 模型会自动缓存到卷中，首次识别后速度会显著提升。

## 🔒 安全建议

1. **修改默认密码**：更改 MySQL root 密码
2. **使用环境变量**：敏感信息使用环境变量
3. **限制网络访问**：生产环境不要暴露所有端口
4. **定期备份**：定期备份数据库数据
5. **更新镜像**：定期更新 Docker 镜像

## 📚 更多信息

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目 README](README.md)
- [集成方案文档](docs/Whisper语音功能集成方案.md)

## 💡 提示

- 首次启动需要下载和构建镜像，可能需要 10-20 分钟
- Whisper 模型首次加载需要 2-5 秒
- 可以使用 `docker-compose up` 前台运行查看实时日志
- 生产环境建议使用 `docker-compose -f docker-compose.prod.yml` 配置

## 🆘 获取帮助

如果遇到问题：

1. 查看日志：`docker-compose logs`
2. 检查配置：`docker-compose config`
3. 查看文档：`docs/Whisper语音功能集成方案.md`
4. 提交 Issue：GitHub Issues