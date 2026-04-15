# 讯飞星火语音识别服务 - Rust 版本

基于讯飞星火语音识别 API 的中文语音识别服务，使用 Rust 重写为单二进制文件，方便服务器部署。

## 特性

- 单二进制文件，无需 Python 环境依赖
- 基于 Rust 的高性能异步运行时 (Tokio)
- 支持音频文件上传和实时录音识别
- 内置美观的 Web 界面
- 完整的 REST API 接口
- 支持 CORS 跨域请求
- 自动音频格式转换（使用 ffmpeg）

## 系统要求

- Rust 1.70 或更高版本
- ffmpeg（用于音频格式转换）

## 编译

```bash
cd whisper-20250625
cargo build --release
```

编译完成后，二进制文件位于 `target/release/xunfei-asr-server`，大小约为 2.8MB。

## 配置

### 方式 1: 使用默认值（最简单）

```bash
./xunfei-asr-server
```

内置测试凭证：
- APP ID: `140c88e2`
- API Key: `63101bc8a895022a2f12d0875f909ee6`
- API Secret: `ZGRiNWVjZTRhMjQ0NmE0YTRkOGMxZWEx`

### 方式 2: 使用命令行参数覆盖

```bash
./xunfei-asr-server \
  --xunfei-app-id your_app_id \
  --xunfei-api-key your_api_key \
  --xunfei-api-secret your_api_secret
```

### 方式 3: 使用环境变量覆盖

```bash
export XUNFEI_APP_ID=your_app_id
export XUNFEI_API_KEY=your_api_key
export XUNFEI_API_SECRET=your_api_secret
./xunfei-asr-server
```

### 配置优先级

参数按以下优先级加载（高到低）：
1. **命令行参数** - 最高优先级
2. **环境变量** - 中等优先级
3. **默认值** - 最低优先级（内置测试凭证）

### 可选参数

- `--server-host`: 服务器监听地址（默认: 0.0.0.0）
- `--server-port`: 服务器监听端口（默认: 8000）

## 运行

### 直接运行

```bash
./target/release/xunfei-asr-server
```

### 后台运行

```bash
nohup ./target/release/xunfei-asr-server > xunfei.log 2>&1 &
```

### 使用 systemd 管理（推荐）

创建服务文件 `/etc/systemd/system/xunfei-asr.service`：

```ini
[Unit]
Description=Xunfei ASR Server
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/whisper-20250625
Environment="PATH=/usr/bin:/bin"
ExecStart=/path/to/whisper-20250625/target/release/xunfei-asr-server
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

## 使用

### Web 界面

访问 `http://localhost:8000` 打开 Web 界面，支持：
- 实时录音识别
- 上传音频文件识别

### API 接口

#### 1. 健康检查

```bash
curl http://localhost:8000/health
```

响应：
```json
{
  "status": "ok",
  "model": "xunfei-slm",
  "model_loaded": true,
  "app_id": "140c88e2"
}
```

#### 2. 识别音频

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@audio.wav"
```

响应：
```json
{
  "text": "识别到的文本内容",
  "language": "zh_cn",
  "model": "xunfei-slm"
}
```

#### 3. 切换模型（保留接口，讯飞星火不支持模型切换）

```bash
curl -X POST http://localhost:8000/change-model \
  -H "Content-Type: application/json" \
  -d '{"model": "xunfei"}'
```

响应：
```json
{
  "message": "使用讯飞星火语音识别模型",
  "model": "xunfei-slm"
}
```

## 音频格式支持

- 支持的输入格式：WAV, MP3, OGG, FLAC, M4A 等（ffmpeg 支持的所有格式）
- 输出格式：PCM 16bit, 16kHz, 单声道
- 最大时长：60 秒

## 与 Python 版本的对比

| 特性 | Python 版本 | Rust 版本 |
|------|------------|-----------|
| 二进制大小 | N/A (需要 Python 环境) | ~2.8MB |
| 启动时间 | ~1-2 秒 | < 0.1 秒 |
| 内存占用 | ~100MB+ | ~20MB |
| 依赖管理 | pip, 虚拟环境 | 单二进制 |
| 部署复杂度 | 需要配置 Python 环境 | 直接复制运行 |
| 性能 | 受限于 Python GIL | 原生性能 |

## 故障排除

### ffmpeg 未安装

如果遇到音频转换失败，请确保系统安装了 ffmpeg：

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

### 权限问题

如果遇到权限错误，确保二进制文件有执行权限：

```bash
chmod +x target/release/xunfei-asr-server
```

### 端口占用

如果端口 8000 被占用，可以修改 `.env` 文件中的 `SERVER_PORT` 配置。

## 开发

### 运行测试

```bash
cargo test
```

### 开发模式运行

```bash
cargo run
```

### 代码格式化

```bash
cargo fmt
```

### 代码检查

```bash
cargo clippy
```

## 许可证

MIT License

## 技术栈

- **Web 服务器**: Axum + Tokio
- **WebSocket**: tokio-tungstenite
- **加密**: hmac + sha2
- **序列化**: serde + serde_json
- **音频处理**: ffmpeg（外部依赖）

## 贡献

欢迎提交 Issue 和 Pull Request！