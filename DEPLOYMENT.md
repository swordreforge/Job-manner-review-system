# 部署指南

本文档介绍如何在不同环境中部署教师端管理系统。

## 目录

- [系统要求](#系统要求)
- [部署方式](#部署方式)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [Systemd服务配置](#systemd服务配置)
- [Nginx反向代理](#nginx反向代理)
- [安全建议](#安全建议)

## 系统要求

### 最低配置

- CPU: 1核
- 内存: 512MB
- 磁盘: 100MB
- 操作系统: Linux (Ubuntu 20.04+, CentOS 7+, Debian 10+)

### 推荐配置

- CPU: 2核+
- 内存: 2GB+
- 磁盘: 1GB+
- 操作系统: Linux (Ubuntu 22.04+)

### 软件依赖

- MySQL 5.7+ 或 MariaDB 10.2+
- OpenSSL (用于HTTPS)

## 部署方式

### 方式一：直接部署（推荐）

1. **编译项目**

```bash
# 在开发机上编译
cargo build --release
```

2. **上传到服务器**

```bash
scp target/release/teacher-app user@server:/opt/teacher-app/
```

3. **在服务器上运行**

```bash
cd /opt/teacher-app
chmod +x teacher-app
./teacher-app --db-password your_password
```

### 方式二：源码编译部署

1. **克隆项目**

```bash
git clone https://github.com/yourusername/teacher-app.git
cd teacher-app
```

2. **安装Rust**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

3. **编译项目**

```bash
cargo build --release
```

4. **运行**

```bash
./target/release/teacher-app --db-password your_password
```

## 生产环境部署

### 1. 创建专用用户

```bash
sudo useradd -r -s /bin/false teacherapp
sudo mkdir -p /opt/teacher-app
sudo chown teacherapp:teacherapp /opt/teacher-app
```

### 2. 部署二进制文件

```bash
sudo cp target/release/teacher-app /opt/teacher-app/
sudo chown teacherapp:teacherapp /opt/teacher-app/teacher-app
sudo chmod 750 /opt/teacher-app/teacher-app
```

### 3. 配置环境变量

创建配置文件 `/opt/teacher-app/.env`:

```bash
TEACHER_APP_HOST=0.0.0.0
TEACHER_APP_PORT=8848
TEACHER_APP_DB_HOST=localhost
TEACHER_APP_DB_PORT=3306
TEACHER_APP_DB_NAME=career_db
TEACHER_APP_DB_USER=teacherapp
TEACHER_APP_DB_PASSWORD=your_secure_password
TEACHER_APP_LOG_LEVEL=info
```

设置权限：

```bash
sudo chown teacherapp:teacherapp /opt/teacher-app/.env
sudo chmod 600 /opt/teacher-app/.env
```

### 4. 创建数据库用户

```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库用户
CREATE USER 'teacherapp'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON career_db.* TO 'teacherapp'@'localhost';
FLUSH PRIVILEGES;
```

## Docker部署

### 1. 创建Dockerfile

```dockerfile
FROM rust:1.75 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/teacher-app .

EXPOSE 8848

CMD ["./teacher-app", "--host", "0.0.0.0", "--port", "8848", "--db-password", "${DB_PASSWORD}"]
```

### 2. 构建Docker镜像

```bash
docker build -t teacher-app:latest .
```

### 3. 运行容器

```bash
docker run -d \
  --name teacher-app \
  -p 8848:8848 \
  -e DB_PASSWORD=your_password \
  -e DB_HOST=host.docker.internal \
  --restart unless-stopped \
  teacher-app:latest
```

### 4. 使用Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: career_db
      MYSQL_USER: teacherapp
      MYSQL_PASSWORD: teacherapp_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./career_db_backup_20260410_222945.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"

  teacher-app:
    build: .
    ports:
      - "8848:8848"
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: career_db
      DB_USER: teacherapp
      DB_PASSWORD: teacherapp_password
    depends_on:
      - mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

运行：

```bash
docker-compose up -d
```

## Systemd服务配置

创建服务文件 `/etc/systemd/system/teacher-app.service`:

```ini
[Unit]
Description=Teacher App Service
After=network.target mysql.service

[Service]
Type=simple
User=teacherapp
Group=teacherapp
WorkingDirectory=/opt/teacher-app
EnvironmentFile=/opt/teacher-app/.env
ExecStart=/opt/teacher-app/teacher-app
Restart=always
RestartSec=10

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/teacher-app

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=teacher-app

[Install]
WantedBy=multi-user.target
```

启用和启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable teacher-app
sudo systemctl start teacher-app
sudo systemctl status teacher-app
```

查看日志：

```bash
sudo journalctl -u teacher-app -f
```

## Nginx反向代理

配置Nginx作为反向代理，提供HTTPS支持。

### 1. 安装Nginx

```bash
sudo apt-get update
sudo apt-get install nginx certbot python3-certbot-nginx
```

### 2. 配置Nginx

创建配置文件 `/etc/nginx/sites-available/teacher-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书（使用Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 代理配置
    location / {
        proxy_pass http://127.0.0.1:8848;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:8848;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/teacher-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 获取SSL证书

```bash
sudo certbot --nginx -d your-domain.com
```

## 安全建议

### 1. 数据库安全

- 使用强密码
- 创建专用数据库用户，不要使用root
- 限制数据库访问IP
- 定期备份数据库

### 2. 应用安全

- 使用HTTPS
- 设置防火墙规则
- 定期更新依赖
- 启用日志审计

### 3. 防火墙配置

```bash
# 使用UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 4. 定期备份

创建备份脚本 `/opt/backup/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backup"
DB_USER="teacherapp"
DB_PASS="your_password"
DB_NAME="career_db"

# 备份数据库
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/career_db_$DATE.sql

# 保留最近7天的备份
find $BACKUP_DIR -name "career_db_*.sql" -mtime +7 -delete
```

设置定时任务：

```bash
sudo crontab -e
# 每天凌晨2点备份
0 2 * * * /opt/backup/backup.sh
```

## 监控和日志

### 查看应用日志

```bash
sudo journalctl -u teacher-app -f
```

### 查看资源使用

```bash
htop
```

### 监控数据库

```bash
mysql -u teacherapp -p -e "SHOW PROCESSLIST;"
```

## 故障排查

### 应用无法启动

1. 检查日志: `sudo journalctl -u teacher-app -n 50`
2. 检查端口占用: `sudo lsof -i :8848`
3. 验证数据库连接: `mysql -u teacherapp -p -h localhost career_db`

### 性能问题

1. 检查系统资源: `top`, `htop`
2. 检查数据库性能: `SHOW ENGINE INNODB STATUS`
3. 启用慢查询日志

## 更新和维护

### 更新应用

```bash
# 停止服务
sudo systemctl stop teacher-app

# 备份当前版本
sudo cp /opt/teacher-app/teacher-app /opt/teacher-app/teacher-app.bak

# 部署新版本
sudo cp new-teacher-app /opt/teacher-app/teacher-app

# 启动服务
sudo systemctl start teacher-app
```

### 数据库维护

```sql
-- 优化表
OPTIMIZE TABLE students;
OPTIMIZE TABLE jobs;
OPTIMIZE TABLE interview_sessions;

-- 检查表
CHECK TABLE students;
CHECK TABLE jobs;
CHECK TABLE interview_sessions;
```

## 支持和联系

如遇问题，请：
1. 查看日志文件
2. 检查配置文件
3. 参考故障排查部分
4. 提交Issue到GitHub