#!/bin/bash

# 面试模拟系统启动脚本

echo "🎤 启动面试模拟系统..."

# 检查是否设置了API密钥
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量"
    echo ""
    echo "请先设置环境变量:"
    echo "  export DEEPSEEK_API_KEY=your_api_key_here"
    echo ""
    echo "或者在命令行中直接运行:"
    echo "  DEEPSEEK_API_KEY=your_api_key_here ./run.sh"
    echo ""
    exit 1
fi

# 运行程序
cd "$(dirname "$0")"
go run main.go