# Docker 网络问题解决方案

## 问题描述

启动 Docker 服务时遇到网络超时错误：

```
Error response from daemon: failed to resolve reference "docker.io/library/redis:7-alpine": failed to do request: Head "https://registry-1.docker.io/v2/library/redis/manifests/7-alpine": dial tcp157.240.15.8:443: i/o timeout
```

## 原因

Docker Hub (docker.io) 在中国大陆访问不稳定，导致镜像拉取超时。

## 解决方案

### 方案 1: 配置 Docker 镜像加速（推荐）

#### 步骤 1: 创建或编辑 Docker 配置文件

```bash
# 创建配置目录
sudo mkdir -p /etc/docker

# 复制配置文件
sudo cp docker-daemon.json /etc/docker/daemon.json
```

#### 步骤 2: 重启 Docker 服务

```bash
# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

#### 步骤 3: 重新启动服务

```bash
# 停止当前服务
docker-compose down

# 重新启动
docker-compose up -d
```

### 方案 2: 使用国内镜像源

编辑 `docker-compose.yml`，将镜像源改为国内镜像：

```yaml
services:
  mysql:
    image: registry.cn-hangzhou.aliyuncs.com/library/mysql:8.0

  redis:
    image: registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine

  whisper:
    build:
      context: ./whisper-20250625
      dockerfile: Dockerfile

  backend:
    build:
      context: .
      dockerfile: Dockerfile

  frontend:
    build:
      context: ./high-school-worker-design-forend
      dockerfile: Dockerfile
```

### 方案 3: 手动拉取镜像

如果网络问题持续，可以手动拉取镜像：

```bash
# 拉取 MySQL
docker pull registry.cn-hangzhou.aliyuncs.com/library/mysql:8.0

# 拉取 Redis
docker pull registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine

# 拉取 Nginx（生产模式需要）
docker pull registry.cn-hangzhou.aliyuncs.com/library/nginx:alpine

# 然后重新启动
docker-compose up -d
```

### 方案 4: 使用代理

如果公司有代理，可以配置 Docker 使用代理：

```bash
# 创建 systemd override 目录
sudo mkdir -p /etc/systemd/system/docker.service.d

# 创建代理配置
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf > /dev/null <<EOF
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 常用国内镜像源

| 镜像源 | 地址 |
|--------|------|
| 道客云 | https://docker.m.daocloud.io |
| 中科大 | https://docker.mirrors.ustc.edu.cn |
| 南京大学 | https://docker.nju.edu.cn |
| 腾讯云 | https://mirror.ccs.tencentyun.com |
| 阿里云 | https://[your-id].mirror.aliyuncs.com |

## 验证配置

配置完成后，验证镜像加速是否生效：

```bash
# 查看 Docker 信息
docker info | grep -A 10 "Registry Mirrors"

# 测试拉取镜像
docker pull hello-world

# 查看拉取速度
time docker pull redis:7-alpine
```

## 其他问题

### 如果仍然无法拉取镜像

1. **检查网络连接**
   ```bash
   ping registry-1.docker.io
   ```

2. **检查 DNS 配置**
   ```bash
   cat /etc/resolv.conf
   ```

3. **尝试不同的镜像源**
   编辑 `/etc/docker/daemon.json`，更换镜像源顺序

4. **使用 VPN 或代理**
   如果有条件，可以尝试使用 VPN 或代理

### 镜像拉取慢

1. **增加并发下载数**
   ```json
   {
     "registry-mirrors": ["https://docker.m.daocloud.io"],
     "max-concurrent-downloads": 10,
     "max-download-attempts": 5
   }
   ```

2. **提前拉取镜像**
   ```bash
   docker pull mysql:8.0
   docker pull redis:7-alpine
   docker pull nginx:alpine
   ```

## 联系支持

如果以上方案都无法解决问题，请联系：

- Docker 官方支持：https://www.docker.com/support
- Docker Hub 状态：https://status.docker.com/

## 推荐配置

对于中国大陆用户，推荐使用以下配置：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://docker.nju.edu.cn"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "max-download-attempts": 5
}
```

配置后重启 Docker，然后重新启动服务：

```bash
docker-compose up -d
```

---

**提示**：配置镜像加速后，首次拉取镜像仍需要一些时间，但后续使用会明显加速。