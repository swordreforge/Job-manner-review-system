#!/bin/bash

# 开发服务器启动脚本

echo "Starting Teacher API in development mode..."

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it first."
    exit 1
fi

# 设置日志级别
export RUST_LOG=info

# 启动服务器
cargo run