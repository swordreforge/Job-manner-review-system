#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FastAPI 网页端语音识别应用
支持音频文件上传和语音识别，使用讯飞星火语音识别服务
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import subprocess
from typing import Optional
import logging

# 导入讯飞星火客户端
from xunfei_client import XunfeiASRClient

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(
    title="中文语音识别 API",
    description="基于讯飞星火的中文语音识别服务",
    version="2.0.0"
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 讯飞星火配置（从环境变量读取）
XUNFEI_APP_ID = os.getenv("XUNFEI_APP_ID", "d2aa42c9")
XUNFEI_API_KEY = os.getenv("XUNFEI_API_KEY", "95556aefd492e5942df045678c0302f5")
XUNFEI_API_SECRET = os.getenv("XUNFEI_API_SECRET", "NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh")

# 创建讯飞星火客户端
xunfei_client = XunfeiASRClient(
    app_id=XUNFEI_APP_ID,
    api_key=XUNFEI_API_KEY,
    api_secret=XUNFEI_API_SECRET
)

# 创建静态文件目录
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# 挂载静态文件目录
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


async def convert_to_pcm(audio_data: bytes, filename: str) -> bytes:
    """
    将音频转换为 PCM 格式（16bit, 16kHz, 单声道）

    Args:
        audio_data: 原始音频数据
        filename: 文件名（用于判断格式）

    Returns:
        PCM 格式的音频数据
    """
    # 检查是否已经是 PCM 格式
    if filename.endswith('.pcm') or filename.endswith('.raw'):
        return audio_data

    # 保存临时文件
    temp_input = os.path.join(static_dir, f"temp_input_{os.urandom(8).hex()}")
    temp_output = os.path.join(static_dir, f"temp_output_{os.urandom(8).hex()}.pcm")

    try:
        # 写入临时输入文件
        with open(temp_input, "wb") as f:
            f.write(audio_data)

        # 使用 ffmpeg 转换为 PCM 格式
        # -f s16le: 16bit 小端格式
        # -ar 16000: 采样率 16kHz
        # -ac 1: 单声道
        cmd = [
            "ffmpeg",
            "-y",  # 覆盖输出文件
            "-i", temp_input,
            "-f", "s16le",
            "-ar", "16000",
            "-ac", "1",
            temp_output
        ]

        logger.info(f"转换音频格式: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            logger.error(f"ffmpeg 转换失败: {result.stderr}")
            # 如果转换失败，返回原始数据（可能已经是 PCM 格式）
            return audio_data

        # 读取转换后的 PCM 数据
        with open(temp_output, "rb") as f:
            pcm_data = f.read()

        logger.info(f"音频转换成功: {len(audio_data)} -> {len(pcm_data)} 字节")
        return pcm_data

    except subprocess.TimeoutExpired:
        logger.error("音频转换超时")
        return audio_data
    except Exception as e:
        logger.error(f"音频转换失败: {str(e)}")
        return audio_data
    finally:
        # 清理临时文件
        try:
            if os.path.exists(temp_input):
                os.remove(temp_input)
            if os.path.exists(temp_output):
                os.remove(temp_output)
        except:
            pass


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化"""
    logger.info("讯飞星火语音识别服务启动中...")
    logger.info(f"APP ID: {XUNFEI_APP_ID}")
    logger.info("服务初始化完成！")


@app.get("/", response_class=HTMLResponse)
async def root():
    """返回首页 HTML"""
    html_content = """
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>中文语音识别</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 40px;
                max-width: 800px;
                width: 100%;
            }
            
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
                font-size: 2.5em;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .record-area {
                border: 3px dashed #667eea;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                margin-bottom: 30px;
                transition: all 0.3s ease;
                background: rgba(102, 126, 234, 0.05);
            }
            
            .record-area:hover {
                border-color: #764ba2;
                background: rgba(118, 75, 162, 0.1);
                transform: translateY(-2px);
            }
            
            .record-icon {
                font-size: 60px;
                margin-bottom: 20px;
                color: #667eea;
            }
            
            .record-text {
                color: #666;
                font-size: 1.1em;
                margin-bottom: 15px;
            }
            
            .record-buttons {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .record-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                font-size: 1em;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 150px;
            }
            
            .record-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .record-btn.recording {
                background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
                }
                50% {
                    box-shadow: 0 0 0 15px rgba(244, 67, 54, 0);
                }
            }
            
            .record-timer {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                font-size: 1.5em;
                color: #667eea;
                font-weight: bold;
                margin-bottom: 15px;
            }
            
            .timer-icon {
                font-size: 1.2em;
            }
            
            .record-hint {
                color: #999;
                font-size: 0.9em;
            }
            
            input[type="file"] {
                display: none;
            }
            
            .upload-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                font-size: 1em;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 15px;
            }
            
            .upload-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .upload-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
            }
            
            .result-area {
                margin-top: 30px;
                display: none;
            }
            
            .result-area.show {
                display: block;
            }
            
            .result-title {
                color: #333;
                font-size: 1.2em;
                margin-bottom: 15px;
                font-weight: bold;
            }
            
            .result-content {
                background: #f5f5f5;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                padding: 20px;
                min-height: 100px;
                line-height: 1.6;
                color: #333;
                font-size: 1.05em;
            }
            
            .status {
                text-align: center;
                margin-top: 20px;
                padding: 10px;
                border-radius: 8px;
                font-weight: bold;
            }
            
            .status.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .status.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .status.loading {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 10px;
                vertical-align: middle;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .clear-btn {
                background: #f44336;
                color: white;
                border: none;
                padding: 8px 20px;
                font-size: 0.9em;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 15px;
            }
            
            .clear-btn:hover {
                background: #d32f2f;
                transform: translateY(-2px);
            }
            
            @media (max-width: 600px) {
                .container {
                    padding: 20px;
                }
                
                h1 {
                    font-size: 2em;
                }
                
                .record-area {
                    padding: 30px 20px;
                }
                
                .record-buttons {
                    flex-direction: column;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎙️ 中文语音识别</h1>
            
            <div class="record-area">
                <div class="record-icon">🎙️</div>
                <div class="record-text">点击按钮开始录音</div>
                <div class="record-buttons">
                    <button class="record-btn" id="recordBtn" onclick="toggleRecording()">
                        <span id="recordBtnText">开始录音</span>
                    </button>
                    <button class="upload-btn" onclick="document.getElementById('fileInput').click()">
                        或上传文件
                    </button>
                    <input type="file" id="fileInput" accept="audio/*" onchange="handleFileSelect(event)">
                </div>
                <div class="record-timer" id="recordTimer" style="display: none;">
                    <span class="timer-icon">⏱️</span>
                    <span id="timerDisplay">00:00</span>
                </div>
                <div class="record-hint">支持录音或上传音频文件（讯飞星火语音识别）</div>
            </div>
            
            <div class="result-area" id="resultArea">
                <div class="result-title">识别结果：</div>
                <div class="result-content" id="resultContent"></div>
                <button class="clear-btn" onclick="clearResult()">清除结果</button>
            </div>
            
            <div class="status" id="status" style="display: none;"></div>
        </div>
        
        <script>
            const fileInput = document.getElementById('fileInput');
            const resultArea = document.getElementById('resultArea');
            const resultContent = document.getElementById('resultContent');
            const status = document.getElementById('status');
            const recordBtn = document.getElementById('recordBtn');
            const recordBtnText = document.getElementById('recordBtnText');
            const recordTimer = document.getElementById('recordTimer');
            const timerDisplay = document.getElementById('timerDisplay');
            
            // 录音相关变量
            let mediaRecorder = null;
            let audioChunks = [];
            let isRecording = false;
            let timerInterval = null;
            let recordingSeconds = 0;
            
            function showStatus(message, type) {
                status.style.display = 'block';
                status.className = `status ${type}`;
                if (type === 'loading') {
                    status.innerHTML = `<span class="loading-spinner"></span>${message}`;
                } else {
                    status.textContent = message;
                }
            }
            
            function hideStatus() {
                status.style.display = 'none';
            }
            
            function updateTimer() {
                recordingSeconds++;
                const minutes = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
                const seconds = (recordingSeconds % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${minutes}:${seconds}`;
            }
            
            function startTimer() {
                recordingSeconds = 0;
                timerDisplay.textContent = '00:00';
                timerInterval = setInterval(updateTimer, 1000);
            }
            
            function stopTimer() {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            }
            
            async function toggleRecording() {
                if (!isRecording) {
                    // 开始录音
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaRecorder = new MediaRecorder(stream);
                        audioChunks = [];
                        
                        mediaRecorder.ondataavailable = (event) => {
                            audioChunks.push(event.data);
                        };
                        
                        mediaRecorder.onstop = async () => {
                            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                            await uploadAudio(audioBlob);
                            
                            // 停止所有音频轨道
                            stream.getTracks().forEach(track => track.stop());
                        };
                        
                        mediaRecorder.start();
                        isRecording = true;
                        recordBtn.classList.add('recording');
                        recordBtnText.textContent = '停止录音';
                        recordTimer.style.display = 'flex';
                        startTimer();
                        showStatus('正在录音...', 'loading');
                        
                    } catch (error) {
                        console.error('录音失败:', error);
                        showStatus('无法访问麦克风，请检查权限设置', 'error');
                    }
                } else {
                    // 停止录音
                    mediaRecorder.stop();
                    isRecording = false;
                    recordBtn.classList.remove('recording');
                    recordBtnText.textContent = '开始录音';
                    recordTimer.style.display = 'none';
                    stopTimer();
                }
            }
            
            async function uploadAudio(audioBlob) {
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.wav');
                
                try {
                    showStatus('正在上传并识别...', 'loading');
                    
                    const response = await fetch(`/transcribe`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        resultContent.textContent = data.text;
                        resultArea.classList.add('show');
                        showStatus('识别完成！', 'success');
                    } else {
                        const error = await response.json();
                        throw new Error(error.detail || '识别失败');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showStatus(`错误: ${error.message}`, 'error');
                    resultArea.classList.remove('show');
                }
                
                // 重置文件输入
                fileInput.value = '';
            }
            
            function handleFileSelect(event) {
                const file = event.target.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    uploadFile(formData);
                }
            }
            
            async function uploadFile(formData) {
                try {
                    showStatus('正在上传并识别...', 'loading');
                    
                    const response = await fetch(`/transcribe`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        resultContent.textContent = data.text;
                        resultArea.classList.add('show');
                        showStatus('识别完成！', 'success');
                    } else {
                        const error = await response.json();
                        throw new Error(error.detail || '识别失败');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showStatus(`错误: ${error.message}`, 'error');
                    resultArea.classList.remove('show');
                }
                
                // 重置文件输入
                fileInput.value = '';
            }
            
            function clearResult() {
                resultContent.textContent = '';
                resultArea.classList.remove('show');
                hideStatus();
            }
        </script>
    </body>
    </html>
    """
    return html_content


@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    model_name: Optional[str] = "xunfei"
):
    """
    识别上传的音频文件

    Args:
        file: 音频文件
        model_name: 模型名称（保留参数以兼容，实际使用讯飞星火）

    Returns:
        识别结果
    """
    try:
        # 读取音频数据
        audio_data = await file.read()

        # 检查音频数据是否为空
        if not audio_data:
            raise HTTPException(status_code=400, detail="音频数据为空")

        # 检查音频数据大小（限制 60 秒）
        max_size = 60 * 16000 * 2  # 60秒 * 16000Hz * 2字节（16bit）
        if len(audio_data) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"音频过长，最大支持 60 秒（当前 {len(audio_data) / (16000 * 2):.1f} 秒）"
            )

        logger.info(f"开始识别音频: {file.filename}, 大小: {len(audio_data)} 字节")

        # 如果音频不是 PCM 格式，需要转换
        audio_data = await convert_to_pcm(audio_data, file.filename)

        # 直接调用异步方法（在 FastAPI 事件循环中）
        text = await xunfei_client.transcribe_audio(audio_data)

        # 检查识别结果
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="未识别到有效语音内容")

        logger.info(f"识别成功: {text[:50]}...")

        return JSONResponse(content={
            "text": text.strip(),
            "language": "zh_cn",
            "model": "xunfei-slm"
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"识别错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"识别失败: {str(e)}")


@app.post("/change-model")
async def change_model(request: dict):
    """
    切换模型（保留接口以兼容，讯飞星火不支持切换模型）

    Args:
        request: 请求参数

    Returns:
        成功消息
    """
    try:
        new_model = request.get('model', 'xunfei')

        if new_model != 'xunfei':
            logger.warning(f"尝试切换到模型 {new_model}，但讯飞星火不支持模型切换")
            return JSONResponse(content={
                "message": "讯飞星火不支持模型切换，使用默认模型",
                "model": "xunfei-slm"
            })

        return JSONResponse(content={
            "message": "使用讯飞星火语音识别模型",
            "model": "xunfei-slm"
        })

    except Exception as e:
        logger.error(f"切换模型错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"操作失败: {str(e)}")


@app.get("/health")
async def health_check():
    """
    健康检查

    Returns:
        服务状态
    """
    return JSONResponse(content={
        "status": "ok",
        "model": "xunfei-slm",
        "model_loaded": True,
        "app_id": XUNFEI_APP_ID
    })


if __name__ == "__main__":
    uvicorn.run(
        "web_app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # 生产环境关闭热重载
        log_level="info"
    )