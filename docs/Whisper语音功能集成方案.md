# Whisper 语音功能集成方案

## 📋 项目概述

本文档描述如何将 OpenAI Whisper 语音识别功能集成到面试模块中，使用户可以通过语音输入回答面试问题。

## 🎯 集成目标

- 在面试界面添加语音录制功能
- 将录制的语音转换为文本
- 自动将识别结果填充到输入框
- 支持实时录音状态显示
- 提供完整的错误处理

## 🏗️ 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     浏览器前端                           │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │  面试界面    │      │  录音组件    │                 │
│  │  (React)     │      │  (MediaRecorder)               │
│  └──────┬───────┘      └──────┬───────┘                 │
│         │                     │                          │
│         │ 1. 显示录音按钮     │ 2. 捕获音频流             │
│         │ 3. 接收识别文本     │ 4. 发送音频数据           │
└─────────┼─────────────────────┼──────────────────────────┘
          │                     │
          │                     │ HTTP POST
          │                     ▼
┌─────────┼─────────────────────┼──────────────────────────┐
│         │         ┌─────────────────────┐               │
│         │         │  Whisper 服务        │               │
│         │         │  (FastAPI + Python)  │               │
│         │         │  - base 模型         │               │
│         │         │  - 繁简体转换        │               │
│         │         │  - 端口: 8000        │               │
│         │         └──────────┬──────────┘               │
│         │                    │ 5. 返回识别文本           │
│         │                    ▼                           │
│         │         ┌─────────────────────┐               │
│         │         │  前端输入框          │               │
│         │         │  (自动填充)          │               │
│         │         └──────────┬──────────┘               │
│         │                    │ 6. 用户确认/编辑         │
│         │                    ▼                           │
│         │         ┌─────────────────────┐               │
│         └────────▶│  Go 后端 API         │               │
│                   │  - 面试对话          │               │
│                   │  - AI 评分           │               │
│                   │  - 流式响应          │               │
│                   └─────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 语音识别 | Whisper | base/small/medium |
| Whisper 服务 | FastAPI | 0.x |
| 前端框架 | React | 18.x |
| 前端构建 | Vite | 5.x |
| 后端框架 | Go + go-zero | 1.x |
| 音频格式 | WAV/MP3 | - |

## 📝 实施步骤

### 步骤 1: 部署 Whisper 服务

#### 1.1 安装依赖

```bash
cd whisper-20250625

# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

#### 1.2 检查依赖

确保系统已安装 `ffmpeg`：

```bash
ffmpeg -version
```

如果没有安装，使用包管理器安装：

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg

# macOS
brew install ffmpeg
```

#### 1.3 启动服务

```bash
# 方式 1: 直接启动
python web_app.py

# 方式 2: 使用启动脚本
./run_web_app.sh

# 方式 3: 后台运行
nohup python web_app.py > whisper.log 2>&1 &
```

服务将在 `http://localhost:8000` 启动。

#### 1.4 验证服务

```bash
# 健康检查
curl http://localhost:8000/health

# 预期响应
{
  "status": "ok",
  "model": "base",
  "model_loaded": true
}
```

#### 1.5 配置服务（可选）

编辑 `web_app.py` 修改默认配置：

```python
# 修改默认模型
model_name = "small"  # base, small, medium, large, large-v3-turbo

# 修改监听端口
uvicorn.run(
    "web_app:app",
    host="0.0.0.0",
    port=8000,  # 修改端口
    reload=False  # 生产环境关闭热重载
)
```

### 步骤 2: 前端添加录音功能

#### 2.1 修改文件路径

- 文件：`high-school-worker-design-forend/src/pages/Interview/index.tsx`

#### 2.2 添加状态变量

在组件顶部添加以下状态：

```typescript
// 录音相关状态
const [isRecording, setIsRecording] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
const [transcribing, setTranscribing] = useState(false);
const [whisperModel, setWhisperModel] = useState('base');

// 录音相关引用
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const timerRef = useRef<NodeJS.Timeout | null>(null);
```

#### 2.3 添加录音函数

在组件内添加以下函数：

```typescript
// 格式化录音时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 开始录音
const startRecording = async () => {
  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // 创建 MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm' // 或 'audio/wav'
    });
    
    audioChunksRef.current = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm' 
      });
      await transcribeAudio(audioBlob);
      
      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);
    
    // 开始计时
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    message.info('开始录音...');
    
  } catch (error: any) {
    console.error('录音启动失败:', error);
    if (error.name === 'NotAllowedError') {
      message.error('无法访问麦克风，请允许麦克风权限');
    } else if (error.name === 'NotFoundError') {
      message.error('未检测到麦克风设备');
    } else {
      message.error('录音启动失败，请重试');
    }
  }
};

// 停止录音
const stopRecording = () => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  }
  setIsRecording(false);
  
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
};

// 语音识别
const transcribeAudio = async (audioBlob: Blob) => {
  setTranscribing(true);
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  
  try {
    const response = await fetch(`http://localhost:8000/transcribe?model=${whisperModel}`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        setInput(data.text.trim());
        message.success('语音识别完成');
      } else {
        message.warning('未识别到语音内容，请重试');
      }
    } else {
      const error = await response.json();
      message.error(`识别失败: ${error.detail || '未知错误'}`);
    }
  } catch (error) {
    console.error('语音识别失败:', error);
    message.error('语音识别服务连接失败，请检查服务是否启动');
  } finally {
    setTranscribing(false);
  }
};

// 清理资源
useEffect(() => {
  return () => {
    // 组件卸载时清理资源
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, []);
```

#### 2.4 修改 UI 组件

找到输入框部分（约在第 480 行），修改为：

```tsx
<div className="border-t pt-4">
  {/* 录音控制区域 */}
  <div className="flex items-center gap-3 mb-3">
    {isRecording ? (
      <Button
        danger
        size="large"
        onClick={stopRecording}
        loading={transcribing}
        className="flex items-center gap-2 min-w-[180px]"
      >
        <span className="animate-pulse text-red-500">●</span>
        停止录音 ({formatTime(recordingTime)})
      </Button>
    ) : (
      <Button
        size="large"
        onClick={startRecording}
        loading={transcribing}
        disabled={!session || session.status !== 'running'}
        className="flex items-center gap-2 min-w-[180px]"
      >
        🎤 开始录音
      </Button>
    )}
    
    {/* 模型选择器 */}
    <Select
      value={whisperModel}
      onChange={setWhisperModel}
      disabled={isRecording}
      className="w-[150px]"
      options={[
        { value: 'base', label: 'Base (快)' },
        { value: 'small', label: 'Small (准)' },
        { value: 'medium', label: 'Medium (更准)' },
      ]}
    />
    
    <div className="flex-1 text-center text-sm text-gray-500">
      {isRecording ? (
        <span className="text-red-500 font-medium">正在录音...</span>
      ) : transcribing ? (
        <span className="text-blue-500 font-medium">正在识别...</span>
      ) : (
        <span>支持语音输入，点击按钮开始录音</span>
      )}
    </div>
  </div>
  
  {/* 输入框 */}
  <Input.Search
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onSearch={handleSend}
    placeholder="输入你的回答或点击录音按钮..."
    enterButton={
      <Button type="primary" icon={<SendOutlined />}>
        发送
      </Button>
    }
    size="large"
    disabled={!session || session.status !== 'running'}
  />
</div>
```

#### 2.5 添加导入

在文件顶部添加 Select 组件导入：

```typescript
import { Card, Button, Segmented, Input, Avatar, Tag, message, Spin, Modal, Progress, List, Select } from 'antd';
```

### 步骤 3: 配置 API 代理（可选）

为了避免跨域问题，配置 Vite 代理。

#### 3.1 修改 vite.config.ts

文件：`high-school-worker-design-forend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/whisper': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/whisper/, '')
      }
    }
  }
})
```

#### 3.2 修改前端调用

将录音函数中的 URL 改为：

```typescript
const response = await fetch(`/whisper/transcribe?model=${whisperModel}`, {
  method: 'POST',
  body: formData
});
```

### 步骤 4: 后端集成（可选）

如果需要在 Go 后端直接调用 Whisper，可以使用以下方法：

#### 4.1 添加 HTTP 客户端

在 `internal/svc/servicecontext.go` 中添加：

```go
type ServiceContext struct {
    Config  config.Config
    // ... 其他字段
    
    // Whisper 服务客户端
    WhisperClient *http.Client
    WhisperURL    string
}
```

#### 4.2 调用示例

```go
func (l *SomeLogic) TranscribeAudio(audioData []byte) (string, error) {
    formData := &bytes.Buffer{}
    writer := multipart.NewWriter(formData)
    
    part, err := writer.CreateFormFile("file", "audio.wav")
    if err != nil {
        return "", err
    }
    
    _, err = part.Write(audioData)
    if err != nil {
        return "", err
    }
    
    writer.Close()
    
    req, err := http.NewRequest(
        "POST",
        l.svcCtx.WhisperURL+"/transcribe?model=base",
        formData,
    )
    if err != nil {
        return "", err
    }
    
    req.Header.Set("Content-Type", writer.FormDataContentType())
    
    resp, err := l.svcCtx.WhisperClient.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var result struct {
        Text string `json:"text"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return "", err
    }
    
    return result.Text, nil
}
```

## 🔧 配置说明

### Whisper 服务配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 模型 | base | 可选：base, small, medium, large, large-v3-turbo |
| 端口 | 8000 | Whisper 服务监听端口 |
| 语言 | zh | 语音识别语言（中文） |
| fp16 | false | 是否使用 FP16 精度 |

### 模型对比

| 模型 | 大小 | 速度 | 精度 | VRAM |
|------|------|------|------|------|
| base | 74MB | 快 | 中等 | ~1GB |
| small | 244MB | 中 | 高 | ~2GB |
| medium | 769MB | 慢 | 很高 | ~5GB |
| large | 1550MB | 很慢 | 最高 | ~10GB |
| turbo | 809MB | 快 | 高 | ~6GB |

**推荐配置**：
- 开发环境：`base` 模型
- 生产环境：`small` 模型
- 高精度需求：`turbo` 模型

## 🧪 测试方案

### 功能测试

1. **录音功能测试**
   - [ ] 点击录音按钮，检查麦克风权限请求
   - [ ] 录制 5-10 秒语音
   - [ ] 点击停止按钮
   - [ ] 检查识别结果是否正确填充

2. **语音识别测试**
   - [ ] 测试普通话识别
   - [ ] 测试带口音的中文
   - [ ] 测试不同语速的语音
   - [ ] 测试环境噪音影响

3. **错误处理测试**
   - [ ] 拒绝麦克风权限
   - [ ] Whisper 服务未启动
   - [ ] 网络连接失败
   - [ ] 录制空音频

4. **性能测试**
   - [ ] 测试长时间录音（60秒）
   - [ ] 测试连续多次录音
   - [ ] 测试并发录音（多标签页）

### 测试用例

#### 测试用例 1: 正常录音流程

```
前置条件：
- Whisper 服务已启动（端口 8000）
- 用户已登录面试系统

测试步骤：
1. 进入面试页面
2. 点击"开始录音"按钮
3. 说出测试文本："我是一名软件工程师，有三年开发经验"
4. 点击"停止录音"按钮

预期结果：
- 录音按钮显示"停止录音"和计时器
- 识别完成后显示"语音识别完成"提示
- 输入框自动填充："我是一名软件工程师，有三年开发经验"
```

#### 测试用例 2: 模型切换

```
测试步骤：
1. 选择"small"模型
2. 开始录音并识别
3. 选择"base"模型
4. 再次录音并识别

预期结果：
- 识别结果准确度有所差异
- 识别速度有明显差异（base 更快）
```

## ⚠️ 注意事项

### 浏览器兼容性

- **支持**: Chrome 66+, Firefox 66+, Safari 14+, Edge 79+
- **不支持**: IE 11 及更早版本
- **要求**: 
  - 需要用户授权麦克风权限
  - HTTPS 环境下才能访问麦克风（localhost 除外）

### 性能考虑

1. **首次识别延迟**
   - Whisper 模型首次加载需要 2-5 秒
   - 后续识别速度显著提升

2. **音频处理**
   - 录制音频大小：约 1MB/分钟（webm 格式）
   - 识别速度：约 2-3 秒/分钟（base 模型）

3. **资源占用**
   - Whisper 服务内存：约 1-2GB（base 模型）
   - CPU 使用率：中等（识别时）

### 隐私保护

- 音频数据仅在本地处理
- 不会上传到第三方服务
- 可以配置 Whisper 服务只监听 `127.0.0.1`

### 错误处理

常见错误及解决方案：

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `NotAllowedError` | 用户拒绝麦克风权限 | 提示用户允许权限 |
| `NotFoundError` | 未检测到麦克风 | 检查麦克风设备 |
| `NotReadableError` | 麦克风被其他应用占用 | 关闭其他应用 |
| 连接失败 | Whisper 服务未启动 | 启动 Whisper 服务 |
| 识别失败 | 音频格式不支持 | 检查音频格式 |

## 🚀 部署建议

### 开发环境

```bash
# 终端 1: 启动 Whisper 服务
cd whisper-20250625
python web_app.py

# 终端 2: 启动前端开发服务器
cd high-school-worker-design-forend
npm run dev

# 终端 3: 启动后端服务
cd ..
go run career.go
```

### 生产环境

#### 方案 1: Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY web_app.py .
COPY whisper/ ./whisper/

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "web_app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

构建和运行：

```bash
docker build -t whisper-service .
docker run -d -p 8000:8000 --name whisper whisper-service
```

#### 方案 2: Systemd 服务

创建 `/etc/systemd/system/whisper.service`:

```ini
[Unit]
Description=Whisper Speech Recognition Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/whisper
Environment="PYTHONUNBUFFERED=1"
ExecStart=/usr/bin/python3 /opt/whisper/web_app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable whisper
sudo systemctl start whisper
sudo systemctl status whisper
```

### 负载均衡

如果需要高并发支持，可以使用 Nginx 反向代理：

```nginx
upstream whisper {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name whisper.example.com;

    location / {
        proxy_pass http://whisper;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # 增加超时时间（识别可能需要较长时间）
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

## 📊 监控和日志

### 日志配置

修改 `web_app.py` 添加日志：

```python
import logging
from logging.handlers import RotatingFileHandler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('whisper.log', maxBytes=10*1024*1024, backupCount=5),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
```

### 监控指标

建议监控以下指标：

- 识别成功率
- 平均识别时间
- 服务响应时间
- 错误率
- 并发连接数

## 🔄 后续优化

### 短期优化（1-2周）

1. **音频预处理**
   - 添加降噪功能
   - 自动去除静音片段
   - 音频增益调整

2. **用户体验**
   - 添加语音波形显示
   - 支持按住录音模式
   - 添加键盘快捷键

3. **性能优化**
   - 实现模型预加载
   - 添加识别结果缓存
   - 优化音频压缩

### 中期优化（1-2月）

1. **功能增强**
   - 支持多语言识别
   - 实时字幕显示
   - 语音编辑功能

2. **AI 优化**
   - 根据面试主题优化识别
   - 上下文感知识别
   - 专业术语识别

3. **数据分析**
   - 识别准确率统计
   - 用户行为分析
   - 性能瓶颈分析

### 长期规划（3-6月）

1. **技术升级**
   - 升级到 Whisper v2/v3
   - 探索其他语音识别方案
   - 支持离线识别

2. **功能扩展**
   - 语音合成（TTS）
   - 实时语音转写
   - 多人语音分离

## 📚 参考资料

- [OpenAI Whisper 官方文档](https://github.com/openai/whisper)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## 📞 技术支持

如有问题，请联系开发团队或查看：
- 项目 Issue
- 技术文档
- 代码注释

---

**文档版本**: 1.0  
**最后更新**: 2026-04-12  
**维护者**: 开发团队