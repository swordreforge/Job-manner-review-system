#!/bin/bash

# 高度兼容的 MySQL 数据库备份脚本

set -e

# 配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS}"
DB_NAME="${DB_NAME:-career_db}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

# 创建备份目录
mkdir -p "$OUTPUT_DIR"

# 生成文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="career_db_backup_${TIMESTAMP}.sql"
OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}"

# 检查密码
if [ -z "$DB_PASS" ]; then
    echo "请设置 DB_PASS 环境变量或直接在脚本中修改"
    echo "Usage: DB_PASS=your_password $0"
    exit 1
fi

echo "开始备份数据库: ${DB_NAME}"
echo "输出文件: ${OUTPUT_PATH}"

# 使用 mariadb-dump（MariaDB）或 mysqldump（MySQL）
DUMP_CMD="mysqldump"
if command -v mariadb-dump &> /dev/null; then
    DUMP_CMD="mariadb-dump"
fi

# 导出并清理
{
    # 1. 添加 CREATE DATABASE 和禁用外键检查
    echo "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "USE \`${DB_NAME}\`;"
    echo "SET FOREIGN_KEY_CHECKS=0;"
    
    # 2. 导出并过滤
    $DUMP_CMD -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null | \
    grep -v "^-- " | \
    grep -v "^/\*" | \
    grep -v "^SET " | \
    grep -v "^LOCK" | \
    grep -v "^UNLOCK" | \
    grep -v "^COMMIT" | \
    grep -v "^\*" | \
    grep -v "^\$" | \
    grep -v "^$"
    
    # 3. 结尾启用外键检查
    echo "SET FOREIGN_KEY_CHECKS=1;"
} | sed \
    -e 's/  */ /g' \
    -e 's/TYPE=InnoDB/ENGINE=InnoDB/g' \
    -e "s/COMMENT '[^']*'//g" \
    -e 's/COLLATE utf8mb4_uca\w*//g' \
    -e 's/COLLATE=utf8mb4_bin//g' \
    -e 's/CHARACTER SET utf8mb4 COLLATE utf8mb4_bin//g' \
    -e 's/CHECK (json_valid([^)]*))//g' \
    -e 's/longtext/json/g' \
    -e 's/;  */;/g' \
    -e 's/ ,/,/g' \
    -e 's/\s*(/(/g' \
    -e 's/\s*)/)/g' \
    -e 's/AUTO_INCREMENT=[0-9]* //g' \
    -e '/^$/d' \
    -e '/^--*$/d' \
    -e '/^;*$/d' \
    -e 's/^ *//g' \
    -e 's/ $//g' \
    > "$OUTPUT_PATH"

# 确保 ENGINE 子句正确
sed -i 's/) ENGINE=InnoDB;/) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;/g' "$OUTPUT_PATH"
sed -i 's/) ENGINE=InnoDB$/) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;/g' "$OUTPUT_PATH"
sed -i 's/) ENGINE=InnoDB )/) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;/g' "$OUTPUT_PATH"

# 获取文件大小
FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)

echo ""
echo "备份完成!"
echo "文件: ${FILENAME}"
echo "大小: ${FILE_SIZE}"
