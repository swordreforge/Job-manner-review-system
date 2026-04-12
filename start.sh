#!/bin/bash

# 面试系统 Docker 一键启动脚本

set -e

echo "========================================"
echo "  面试系统 Docker 一键启动"
echo "========================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 环境检查通过"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "✅ .env 文件已创建，请根据需要修改配置"
    echo ""
fi

# 询问启动模式
echo "请选择启动模式："
echo "1) 开发模式（带源码挂载，适合开发）"
echo "2) 生产模式（优化配置，适合生产）"
echo "3) 基础模式（默认配置）"
read -p "请输入选项 (1-3): " mode

case $mode in
    1)
        echo ""
        echo "🚀 启动开发模式..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    2)
        echo ""
        echo "🚀 启动生产模式..."
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    3)
        echo ""
        echo "🚀 启动基础模式..."
        docker-compose up -d
        ;;
    *)
        echo ""
        echo "❌ 无效选项，使用基础模式..."
        docker-compose up -d
        ;;
esac

echo ""
echo "========================================"
echo "  服务启动完成"
echo "========================================"
echo ""
echo "等待服务启动中..."
sleep 5

echo ""
echo "📊 服务状态："
docker-compose ps

echo ""
echo "📝 访问地址："
echo "  前端界面: http://localhost"
echo "  后端 API:  http://localhost:8088"
echo "  Whisper:  http://localhost:8000"
echo ""
echo "📖 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"
echo "🧹 清理服务: docker-compose down -v"
echo ""
echo "✅ 启动完成！"