#!/bin/bash
# 实时语音识别 GUI 启动脚本

echo "正在检查依赖..."

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python 3"
    exit 1
fi

# 检查 ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "错误: 未找到 ffmpeg"
    echo "请安装 ffmpeg: sudo pacman -S ffmpeg"
    exit 1
fi

# 检查 Python 依赖
echo "正在检查 Python 依赖..."
python3 -c "import tkinter, sounddevice, whisper, torch" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "错误: Python 依赖未完全安装"
    echo "请确保已安装以下软件包:"
    echo "  sudo pacman -S python-pytorch python-sounddevice python-tiktoken python-tqdm python-numba python-regex"
    exit 1
fi

echo "依赖检查通过"

# 启动应用
echo "正在启动实时语音识别应用..."
python3 realtime_speech_gui.py