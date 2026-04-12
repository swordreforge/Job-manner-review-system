#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FastAPI 网页端语音识别应用
支持音频文件上传和语音识别，自动繁简体转换
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import whisper
import opencc
import uvicorn
import os
import torch
from typing import Optional
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(
    title="中文语音识别 API",
    description="基于 Whisper 的中文语音识别服务，支持繁简体转换",
    version="1.0.0"
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量
model = None
converter = None
model_name = "base"

# 创建静态文件目录
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# 挂载静态文件目录
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
async def startup_event():
    """应用启动时加载模型"""
    global model, converter
    try:
        logger.info(f"正在加载 Whisper 模型: {model_name}...")
        model = whisper.load_model(model_name)
        converter = opencc.OpenCC('t2s')
        logger.info("模型加载完成！")
    except Exception as e:
        logger.error(f"模型加载失败: {str(e)}")
        raise


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
            
            .model-select {
                margin-bottom: 20px;
                text-align: center;
            }
            
            .model-select label {
                color: #333;
                font-size: 1.1em;
                margin-right: 10px;
            }
            
            .model-select select {
                padding: 8px 15px;
                border: 2px solid #667eea;
                border-radius: 8px;
                font-size: 1em;
                color: #333;
                background: white;
                cursor: pointer;
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
            
            <div class="model-select">
                <label for="model">选择模型：</label>
                <select id="model" onchange="changeModel()">
                    <option value="base">Base (平衡)</option>
                    <option value="small">Small (高精度)</option>
                    <option value="medium">Medium (更高精度)</option>
                    <option value="large">Large (最高精度)</option>
                    <option value="large-v3-turbo">Large-v3-turbo (高速高精度)</option>
                </select>
            </div>
            
            <div class="record-area">
                <div class="record-icon">🎙️</div>
                <div class="record-text">点击按钮开始录音</div>
                <div class="record-buttons">
                    <button class="record-btn" id="recordBtn" onclick="toggleRecording()">
                        <span id="recordBtnText">开始录音</span>
                    </button>
                    <button class="upload-btn" onclick="document.getElementById('fileInput').click()" style="display: none;">
                        或上传文件
                    </button>
                    <input type="file" id="fileInput" accept="audio/*" onchange="handleFileSelect(event)">
                </div>
                <div class="record-timer" id="recordTimer" style="display: none;">
                    <span class="timer-icon">⏱️</span>
                    <span id="timerDisplay">00:00</span>
                </div>
                <div class="record-hint">支持录音或上传音频文件</div>
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
                
                const modelName = document.getElementById('model').value;
                
                try {
                    showStatus('正在上传并识别...', 'loading');
                    
                    const response = await fetch(`/transcribe?model=${modelName}`, {
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
                const modelName = document.getElementById('model').value;
                
                try {
                    showStatus('正在上传并识别...', 'loading');
                    
                    const response = await fetch(`/transcribe?model=${modelName}`, {
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
            
            async function changeModel() {
                const modelName = document.getElementById('model').value;
                try {
                    const response = await fetch('/change-model', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ model: modelName })
                    });
                    
                    if (response.ok) {
                        showStatus(`模型已切换为 ${modelName}`, 'success');
                        setTimeout(() => hideStatus(), 2000);
                    } else {
                        const error = await response.json();
                        throw new Error(error.detail || '切换模型失败');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showStatus(`错误: ${error.message}`, 'error');
                }
            }
        </script>
    </body>
    </html>
    """
    return html_content


@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    model_name: Optional[str] = "base"
):
    """识别上传的音频文件"""
    try:
        # 验证模型名称
        valid_models = ["base", "small", "medium", "large", "large-v3-turbo"]
        if model_name not in valid_models:
            raise HTTPException(status_code=400, detail=f"无效的模型名称。可用模型: {', '.join(valid_models)}")
        
        # 如果模型名称改变，重新加载模型
        global model
        if model_name != model_name or model is None:
            logger.info(f"切换到模型: {model_name}")
            model = whisper.load_model(model_name)
        
        # 保存临时文件
        temp_path = os.path.join(static_dir, f"temp_{file.filename}")
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # 使用 Whisper 识别
        result = model.transcribe(
            temp_path,
            language='zh',
            fp16=False
        )
        
        # 转换为简体中文
        text = converter.convert(result['text'].strip())
        
        # 删除临时文件
        try:
            os.remove(temp_path)
        except:
            pass
        
        return JSONResponse(content={
            "text": text,
            "language": result.get('language', 'zh'),
            "model": model_name
        })
        
    except Exception as e:
        logger.error(f"识别错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"识别失败: {str(e)}")


@app.post("/change-model")
async def change_model(request: dict):
    """切换模型"""
    global model
    try:
        new_model = request.get('model', 'base')
        valid_models = ["base", "small", "medium", "large", "large-v3-turbo"]
        
        if new_model not in valid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"无效的模型名称。可用模型: {', '.join(valid_models)}"
            )
        
        logger.info(f"正在切换模型: {new_model}")
        model = whisper.load_model(new_model)
        
        return JSONResponse(content={
            "message": f"模型已切换为 {new_model}",
            "model": new_model
        })
        
    except Exception as e:
        logger.error(f"切换模型错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"切换模型失败: {str(e)}")


@app.get("/health")
async def health_check():
    """健康检查"""
    return JSONResponse(content={
        "status": "ok",
        "model": model_name,
        "model_loaded": model is not None
    })


if __name__ == "__main__":
    uvicorn.run(
        "web_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )