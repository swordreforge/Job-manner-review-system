#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="$PROJECT_ROOT/部署"

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }

if [ ! -d "$DEPLOY_DIR" ]; then
    warn "未找到部署目录: $DEPLOY_DIR"
    echo "请先运行 quick-start.sh 进行部署"
    exit 1
fi

cd "$DEPLOY_DIR"

if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR]${NC} 未找到 docker compose"
    exit 1
fi

echo -e "${YELLOW}停止职业规划系统所有服务...${NC}"

read -p "是否同时删除数据卷? 这将清除所有 MySQL 数据和上传文件 [y/N]: " del_vols

if [[ "$del_vols" =~ ^[Yy] ]]; then
    $COMPOSE_CMD -p career down -v
    info "所有服务已停止，数据卷已删除"
else
    $COMPOSE_CMD -p career down
    info "所有服务已停止，数据卷保留"
fi

echo ""
info "如需重新启动，请运行: $SCRIPT_DIR/quick-start.sh"