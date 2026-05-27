# 快速开始指南

## 1. 编译项目

```bash
./build.sh
```

或手动编译：

```bash
cargo build --release
```

## 2. 配置服务

### 方式 1: 使用默认值（推荐用于测试）

```bash
./xunfei-asr-server
```

内置测试凭证，无需任何配置即可启动！

### 方式 2: 使用命令行参数（推荐用于生产）

```bash
./xunfei-asr-server \
  --xunfei-app-id your_app_id \
  --xunfei-api-key your_api_key \
  --xunfei-api-secret your_api_secret
```

### 方式 3: 使用环境变量

```bash
export XUNFEI_APP_ID=your_app_id
export XUNFEI_API_KEY=your_api_key
export XUNFEI_API_SECRET=your_api_secret
./xunfei-asr-server
```

### 配置优先级

参数按以下优先级加载（高到低）：
1. 命令行参数
2. 环境变量
3. 默认值（内置测试凭证）

## 3. 启动服务

### 使用默认值（最简单）：

```bash
./xunfei-asr-server
```

### 使用命令行参数：

```bash
./xunfei-asr-server \
  --xunfei-app-id your_app_id \
  --xunfei-api-key your_api_key \
  --xunfei-api-secret your_api_secret
```

### 使用环境变量：

```bash
./run.sh
```

或直接运行：

```bash
./target/release/xunfei-asr-server
```

## 4. 测试服务

打开浏览器访问：http://localhost:8000

或使用命令行测试：

```bash
# 健康检查
curl http://localhost:8000/health

# 上传音频文件识别
curl -X POST http://localhost:8000/transcribe -F "file=@audio.wav"
```

## 5. 部署到服务器

### 方式 1: 直接复制

```bash
# 在本地编译完成后
scp target/release/xunfei-asr-server user@server:/opt/xunfei-asr/
scp .env user@server:/opt/xunfei-asr/

# 在服务器上
ssh user@server
cd /opt/xunfei-asr
chmod +x xunfei-asr-server
./xunfei-asr-server
```

### 方式 2: 使用 Docker

```bash
# 构建 Docker 镜像
docker build -t xunfei-asr:latest .

# 运行容器
docker run -d \
  --name xunfei-asr \
  -p 8000:8000 \
  --env-file .env \
  xunfei-asr:latest
```

## 6. 使用 systemd 管理

创建服务文件 `/etc/systemd/system/xunfei-asr.service`：

```ini
[Unit]
Description=Xunfei ASR Server
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/xunfei-asr
Environment="PATH=/usr/bin:/bin"
ExecStart=/opt/xunfei-asr/xunfei-asr-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable xunfei-asr
sudo systemctl start xunfei-asr
sudo systemctl status xunfei-asr
```

## 常见问题

### Q: ffmpeg 未安装怎么办？

A: 安装 ffmpeg：

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

### Q: 如何修改端口？

A: 编辑 `.env` 文件，修改 `SERVER_PORT` 配置：

```env
SERVER_PORT=8080
```

### Q: 如何查看日志？

A: 使用 systemd：

```bash
sudo journalctl -u xunfei-asr -f
```

或直接运行时重定向：

```bash
./xunfei-asr-server > xunfei.log 2>&1 &
tail -f xunfei.log
```

### Q: 如何停止服务？

A: 使用 systemd：

```bash
sudo systemctl stop xunfei-asr
```

或找到进程并终止：

```bash
pkill xunfei-asr-server
```

## 更多信息

查看完整文档：[README_RUST.md](README_RUST.md)