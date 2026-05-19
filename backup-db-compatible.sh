#!/bin/bash

# MariaDB → MySQL 兼容备份脚本
# 仅修复不兼容的排序规则和引擎类型，保留完整数据完整性

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS}"
DB_NAME="${DB_NAME:-career_db}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="career_db_backup_${TIMESTAMP}.sql"
OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}"

if [ -z "$DB_PASS" ]; then
    echo "请设置 DB_PASS 环境变量"
    echo "Usage: DB_PASS=your_password $0"
    exit 1
fi

echo "开始备份数据库: ${DB_NAME}"
echo "输出文件: ${OUTPUT_PATH}"

DUMP_CMD="mysqldump"
if command -v mariadb-dump &> /dev/null; then
    DUMP_CMD="mariadb-dump"
fi

$DUMP_CMD \
    -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --skip-comments \
    --skip-add-locks \
    "$DB_NAME" \
| sed \
    -e 's/TYPE=InnoDB/ENGINE=InnoDB/g' \
    -e 's/COLLATE utf8mb4_uca[0-9]*_ai_ci/COLLATE utf8mb4_general_ci/g' \
    -e 's/COLLATE=utf8mb4_uca[0-9]*_ai_ci/COLLATE=utf8mb4_general_ci/g' \
    -e 's/COLLATE utf8mb4_bin/COLLATE utf8mb4_general_ci/g' \
    -e 's/COLLATE=utf8mb4_bin/COLLATE=utf8mb4_general_ci/g' \
> "$OUTPUT_PATH"

FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)

echo ""
echo "备份完成!"
echo "文件: ${FILENAME}"
echo "大小: ${FILE_SIZE}"