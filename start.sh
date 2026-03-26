#!/bin/bash

# 清理并启动后端服务脚本

echo "=== 清理端口占用 ==="

# 清理 8088 端口
PORT_8088_PID=$(lsof -i :8088 -t 2>/dev/null)
if [ ! -z "$PORT_8088_PID" ]; then
    echo "Killing process on port 8088 (PID: $PORT_8088_PID)"
    kill -9 $PORT_8088_PID
fi

# 清理 9091 端口
PORT_9091_PID=$(lsof -i :9091 -t 2>/dev/null)
if [ ! -z "$PORT_9091_PID" ]; then
    echo "Killing process on port 9091 (PID: $PORT_9091_PID)"
    kill -9 $PORT_9091_PID
fi

# 等待进程完全停止
sleep 2

echo "=== 启动后端服务 ==="
go run career.go -f etc/career-api.yaml