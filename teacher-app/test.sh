#!/bin/bash

# 测试运行脚本

echo "=== 运行教师端 API 测试 ==="
echo ""

# 检查测试数据库环境变量
if [ -z "$TEST_DATABASE_URL" ]; then
    echo "警告: TEST_DATABASE_URL 环境变量未设置"
    echo "使用默认测试数据库连接"
    export TEST_DATABASE_URL="mysql://root:password@localhost:3306/career_db_test"
fi

echo "测试数据库连接: $TEST_DATABASE_URL"
echo ""

# 运行所有测试
cargo test --test '*' "$@"