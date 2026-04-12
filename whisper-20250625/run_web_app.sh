#!/bin/bash
# 启动 FastAPI 网页端语音识别应用

echo "=========================================="
echo "  中文语音识别 Web 服务"
echo "=========================================="
echo ""

# 检查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3，请先安装 Python 3"
    exit 1
fi

echo "Python 版本:"
python3 --version
echo ""

# 检查必要的依赖
echo "检查依赖..."
python3 -c "import fastapi" 2>/dev/null || { echo "错误: 未安装 fastapi，请运行: pip install fastapi uvicorn"; exit 1; }
python3 -c "import whisper" 2>/dev/null || { echo "错误: 未安装 whisper，请运行: pip install openai-whisper"; exit 1; }
python3 -c "import opencc" 2>/dev/null || { echo "错误: 未安装 opencc，请运行: pip install opencc"; exit 1; }
python3 -c "import uvicorn" 2>/dev/null || { echo "错误: 未安装 uvicorn，请运行: pip install uvicorn"; exit 1; }

echo "所有依赖检查通过！"
echo ""

# 创建 static 目录
mkdir -p static

# 启动应用
echo "正在启动 FastAPI 应用..."
echo "访问地址: http://localhost:8000"
echo "按 Ctrl+C 停止服务"
echo ""

python3 web_app.py