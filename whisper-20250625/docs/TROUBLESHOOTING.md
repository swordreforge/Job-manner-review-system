# 故障排除指南

## 问题：讯飞星火识别失败

### 错误信息
```
ERROR xunfei_asr_server::server: 内部错误: 讯飞星火识别失败
```

### 可能原因

#### 1. 讯飞星火 API 凭证无效或过期

**症状：**
- 服务启动正常
- 上传音频后返回 500 错误
- 日志显示"讯飞星火识别失败"

**解决方案：**

1. 检查 `.env` 文件中的凭证配置：
```bash
cat .env | grep XUNFEI
```

2. 访问 [讯飞开放平台](https://console.xfyun.cn/) 获取新的凭证

3. 更新 `.env` 文件：
```env
XUNFEI_APP_ID=你的_APP_ID
XUNFEI_API_KEY=你的_API_KEY
XUNFEI_API_SECRET=你的_API_SECRET
```

4. 重启服务：
```bash
# 停止当前服务
pkill xunfei-asr-server

# 重新启动
./run.sh
```

#### 2. 网络连接问题

**症状：**
- 日志显示"连接讯飞星火 WebSocket 失败"
- 或"发送音频数据失败"

**解决方案：**

1. 检查网络连接：
```bash
ping iat.xf-yun.com
```

2. 检查防火墙设置：
```bash
# 检查是否允许 HTTPS 连接
curl -I https://iat.xf-yun.com
```

3. 如果使用代理，确保正确配置了环境变量：
```bash
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

#### 3. 音频数据问题

**症状：**
- 日志显示"音频数据为空"
- 或"音频过长"

**解决方案：**

1. 确保上传的音频文件不为空
2. 检查音频时长（最大支持 60 秒）
3. 确保音频格式正确（支持 WAV, MP3, OGG, FLAC, M4A 等）

#### 4. ffmpeg 未安装

**症状：**
- 日志显示"音频转换失败"
- 或"ffmpeg 执行失败"

**解决方案：**

检查 ffmpeg 是否安装：
```bash
ffmpeg -version
```

如果未安装，请安装：

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Arch Linux:**
```bash
sudo pacman -S ffmpeg
```

**CentOS/RHEL:**
```bash
sudo yum install ffmpeg
```

### 调试技巧

#### 1. 启用详细日志

修改 `.env` 文件，添加：
```env
RUST_LOG=xunfei_asr_server=debug,tower_http=debug,axum=trace
```

#### 2. 测试健康检查

```bash
curl http://localhost:8000/health
```

期望输出：
```json
{
  "status": "ok",
  "model": "xunfei-slm",
  "model_loaded": true,
  "app_id": "140c88e2"
}
```

#### 3. 测试音频识别

```bash
# 使用 curl 测试
curl -X POST http://localhost:8000/transcribe \
  -F "file=@test_audio.wav"
```

#### 4. 查看完整日志

```bash
# 如果使用 systemd
sudo journalctl -u xunfei-asr -f

# 如果直接运行
tail -f xunfei.log
```

#### 5. 测试讯飞星火 API 连通性

创建测试脚本 `test_xunfei_connection.py`：

```python
import websocket
import hmac
import hashlib
import base64
import json
from datetime import datetime
from urllib.parse import quote

# 配置
app_id = "你的_APP_ID"
api_key = "你的_API_KEY"
api_secret = "你的_API_SECRET"

# 生成鉴权 URL
date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
signature_origin = f"host: iat.xf-yun.com\ndate: {date}\nGET /v1 HTTP/1.1"
signature_sha = hmac.new(
    api_secret.encode('utf-8'),
    signature_origin.encode('utf-8'),
    digestmod=hashlib.sha256
).digest()
signature = base64.b64encode(signature_sha).decode(encoding='utf-8')
authorization_origin = f'api_key="{api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')
authorization_encoded = quote(authorization)
date_encoded = quote(date)
url = f"wss://iat.xf-yun.com/v1?authorization={authorization_encoded}&date={date_encoded}&host=iat.xf-yun.com"

# 测试连接
try:
    ws = websocket.create_connection(url, timeout=10)
    print("✓ WebSocket 连接成功")
    ws.close()
except Exception as e:
    print(f"✗ WebSocket 连接失败: {e}")
```

运行测试：
```bash
python3 test_xunfei_connection.py
```

### 常见错误代码

| 错误代码 | 说明 | 解决方案 |
|---------|------|---------|
| 400 | 请求参数错误 | 检查请求格式 |
| 401 | 鉴权失败 | 检查 API 凭证 |
| 403 | 无权限访问 | 检查账户状态 |
| 429 | 请求过于频繁 | 等待一段时间后重试 |
| 500 | 服务器内部错误 | 联系讯飞客服 |
| 10407 | IP 白名单限制 | 在讯飞控制台添加 IP |

### 获取帮助

如果以上方法都无法解决问题，请：

1. 检查完整的错误日志
2. 记录重现步骤
3. 访问 [讯飞开发者社区](https://www.xfyun.cn/doc/) 寻求帮助
4. 或在 GitHub 上提交 Issue

### 相关资源

- [讯飞星火语音识别 API 文档](https://www.xfyun.cn/doc/spark/API.html)
- [讯飞开放平台](https://console.xfyun.cn/)
- [项目文档](README_RUST.md)
- [快速开始](QUICKSTART.md)