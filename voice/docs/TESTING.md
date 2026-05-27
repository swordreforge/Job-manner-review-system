# 测试指南

## 快速测试

### 1. 启动服务（使用默认值）

```bash
./xunfei-asr-server
```

服务将在 http://localhost:8000 启动。

### 2. 测试健康检查

```bash
curl http://localhost:8000/health
```

预期输出：
```json
{
  "status": "ok",
  "model": "xunfei-slm",
  "model_loaded": true,
  "app_id": "140c88e2"
}
```

### 3. 测试 Web 界面

打开浏览器访问：http://localhost:8000

### 4. 测试音频识别

```bash
# 上传音频文件
curl -X POST http://localhost:8000/transcribe \
  -F "file=@test_audio.wav"
```

## 配置测试

### 测试默认值

```bash
./xunfei-asr-server
# 应该使用内置的测试凭证
```

### 测试环境变量

```bash
export XUNFEI_APP_ID=TEST_APP_ID
export XUNFEI_API_KEY=TEST_API_KEY
export XUNFEI_API_SECRET=TEST_API_SECRET
./xunfei-asr-server
# 应该使用环境变量中的凭证
```

### 测试命令行参数

```bash
./xunfei-asr-server \
  --xunfei-app-id CMD_APP_ID \
  --xunfei-api-key CMD_API_KEY \
  --xunfei-api-secret CMD_API_SECRET
# 应该使用命令行参数中的凭证
```

### 测试优先级

```bash
# 设置环境变量
export XUNFEI_APP_ID=ENV_APP_ID

# 使用命令行参数
./xunfei-asr-server --xunfei-app-id CMD_APP_ID
# 应该使用命令行参数（优先级高于环境变量）
```

## 功能测试

### 1. 健康检查

```bash
curl http://localhost:8000/health
```

### 2. 获取首页

```bash
curl http://localhost:8000/
```

### 3. 切换模型

```bash
curl -X POST http://localhost:8000/change-model \
  -H "Content-Type: application/json" \
  -d '{"model": "xunfei"}'
```

### 4. 音频识别

```bash
# 需要准备测试音频文件
curl -X POST http://localhost:8000/transcribe \
  -F "file=@test_audio.wav"
```

## 性能测试

### 测试启动时间

```bash
time ./xunfei-asr-server --version
```

### 测试内存占用

```bash
# 启动服务
./xunfei-asr-server &

# 查看内存占用
ps aux | grep xunfei-asr-server
```

### 测试并发请求

```bash
# 安装 Apache Bench
sudo apt install apache2-utils

# 并发测试
ab -n 100 -c 10 http://localhost:8000/health
```

## 故障排查

### 服务无法启动

1. 检查端口是否被占用：
```bash
lsof -i :8000
```

2. 检查日志输出

### 音频识别失败

1. 检查网络连接：
```bash
ping iat.xf-yun.com
```

2. 检查凭证是否有效

3. 查看详细日志：
```bash
export RUST_LOG=debug
./xunfei-asr-server
```

### 查看帮助

```bash
./xunfei-asr-server --help
```

### 查看版本

```bash
./xunfei-asr-server --version
```

## 测试脚本

运行提供的测试脚本：

```bash
./test.sh
```