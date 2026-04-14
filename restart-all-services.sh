#!/bin/bash

# 重启所有服务脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  重启所有服务"
echo "========================================"
echo ""

echo -e "${YELLOW}⏳ 停止服务...${NC}"
"$PROJECT_ROOT/stop-all-services.sh"

echo ""
echo -e "${YELLOW}⏳ 启动服务...${NC}"
"$PROJECT_ROOT/start-all-services.sh"