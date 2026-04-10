#!/bin/bash

# 职业规划系统 - 数据库初始化脚本

echo "=== 职业规划系统 - 数据库初始化 ==="
echo ""

# 检查是否在项目根目录
if [ ! -f "career.go" ]; then
    echo "错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 运行初始化程序
echo "正在启动数据库初始化程序..."
echo ""

go run cmd/init-db/main.go

# 检查是否成功
if [ $? -eq 0 ]; then
    echo ""
    echo "=== 初始化成功 ==="
    echo ""
    echo "现在可以启动后端服务:"
    echo "  go run career.go -f etc/career-api.yaml"
    echo ""
    echo "或者使用构建好的二进制文件:"
    echo "  ./career-api -f etc/career-api.yaml"
else
    echo ""
    echo "=== 初始化失败 ==="
    echo "请检查错误信息并重试"
    exit 1
fi