#!/bin/bash
# 讯飞星火语音识别服务 - Rust 版本启动脚本

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查二进制文件是否存在
if [ ! -f "target/release/xunfei-asr-server" ]; then
    echo "二进制文件不存在，正在编译..."
    cargo build --release
fi

# 检查 ffmpeg 是否安装
if ! command -v ffmpeg &> /dev/null; then
    echo "警告: ffmpeg 未安装，音频格式转换功能可能无法正常工作"
    echo "请使用以下命令安装 ffmpeg:"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  Arch Linux: sudo pacman -S ffmpeg"
    echo "  CentOS/RHEL: sudo yum install ffmpeg"
fi

# 启动服务
echo "启动讯飞星火语音识别服务..."

# 如果提供了命令行参数，使用它们
if [ $# -gt 0 ]; then
    ./target/release/xunfei-asr-server "$@"
else
    # 否则尝试从环境变量读取
    ./target/release/xunfei-asr-server
fi