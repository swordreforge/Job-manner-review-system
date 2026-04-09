#!/bin/bash

# 数据库迁移脚本
# 用于执行面试模块的数据库迁移

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 面试模块数据库迁移 ===${NC}"

# 检查是否提供了数据库配置
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${YELLOW}未设置数据库环境变量，使用默认配置${NC}"

    # 默认配置
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-3306}"
    DB_USER="${DB_USER:-root}"
    DB_PASSWORD="${DB_PASSWORD:-}"
    DB_NAME="${DB_NAME:-career_api}"
fi

echo "数据库配置:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# 询问是否继续
read -p "是否继续执行迁移? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}已取消迁移${NC}"
    exit 0
fi

# 执行迁移
echo -e "${GREEN}开始执行迁移...${NC}"

MYSQL_CMD="mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME"

# 检查数据库连接
if ! echo "SELECT 1;" | $MYSQL_CMD &> /dev/null; then
    echo -e "${RED}数据库连接失败，请检查配置${NC}"
    exit 1
fi

# 执行迁移脚本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/004_add_interview_tables.sql"

if [ ! -f "$MIGRATION_SCRIPT" ]; then
    echo -e "${RED}迁移脚本不存在: $MIGRATION_SCRIPT${NC}"
    exit 1
fi

if $MYSQL_CMD < "$MIGRATION_SCRIPT"; then
    echo -e "${GREEN}迁移执行成功！${NC}"

    # 验证表是否创建成功
    echo -e "${GREEN}验证表创建...${NC}"
    TABLES=$($MYSQL_CMD -N -e "SHOW TABLES LIKE 'interview_%';" | wc -l)
    if [ "$TABLES" -eq 3 ]; then
        echo -e "${GREEN}所有表创建成功（3个表）${NC}"
    else
        echo -e "${YELLOW}部分表可能创建失败，请检查${NC}"
    fi
else
    echo -e "${RED}迁移执行失败${NC}"
    exit 1
fi

echo -e "${GREEN}=== 迁移完成 ===${NC}"