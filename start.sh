#!/bin/bash

# 教师端应用启动脚本

set -e

# 默认配置
DEFAULT_HOST="127.0.0.1"
DEFAULT_PORT="8848"
DEFAULT_DB_HOST="127.0.0.1"
DEFAULT_DB_PORT="3306"
DEFAULT_DB_NAME="career_db"
DEFAULT_DB_USER="root"
DEFAULT_LOG_LEVEL="info"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  教师端应用启动脚本${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# 检查是否提供了数据库密码
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}请输入数据库密码:${NC}"
    read -s DB_PASSWORD
fi

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}错误: 数据库密码不能为空${NC}"
    exit 1
fi

# 使用环境变量或默认值
HOST="${HOST:-$DEFAULT_HOST}"
PORT="${PORT:-$DEFAULT_PORT}"
DB_HOST="${DB_HOST:-$DEFAULT_DB_HOST}"
DB_PORT="${DB_PORT:-$DEFAULT_DB_PORT}"
DB_NAME="${DB_NAME:-$DEFAULT_DB_NAME}"
DB_USER="${DB_USER:-$DEFAULT_DB_USER}"
LOG_LEVEL="${LOG_LEVEL:-$DEFAULT_LOG_LEVEL}"

# 显示配置信息
echo -e "${GREEN}配置信息:${NC}"
echo "  服务器地址: ${HOST}:${PORT}"
echo "  数据库地址: ${DB_HOST}:${DB_PORT}"
echo "  数据库名称: ${DB_NAME}"
echo "  数据库用户: ${DB_USER}"
echo "  日志级别: ${LOG_LEVEL}"
echo ""

# 检查二进制文件是否存在
if [ ! -f "./target/release/teacher-app" ]; then
    echo -e "${YELLOW}未找到发布版本，正在编译...${NC}"
    cargo build --release
    echo -e "${GREEN}编译完成！${NC}"
    echo ""
fi

# 启动应用
echo -e "${GREEN}正在启动应用...${NC}"
echo ""

./target/release/teacher-app \
    --host "${HOST}" \
    --port "${PORT}" \
    --db-host "${DB_HOST}" \
    --db-port "${DB_PORT}" \
    --db-name "${DB_NAME}" \
    --db-user "${DB_USER}" \
    --db-password "${DB_PASSWORD}" \
    --log-level "${LOG_LEVEL}"
