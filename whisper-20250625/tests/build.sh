#!/bin/bash
# 讯飞星火语音识别服务 - Rust 版本构建脚本

set -e

echo "========================================="
echo "讯飞星火语音识别服务 - Rust 版本构建"
echo "========================================="
echo ""

# 检查 Rust 环境
if ! command -v cargo &> /dev/null; then
    echo "错误: Rust 环境未安装"
    echo "请访问 https://rustup.rs/ 安装 Rust"
    exit 1
fi

echo "Rust 版本: $(rustc --version)"
echo ""

# 清理之前的构建
echo "清理之前的构建..."
cargo clean

# 构建 release 版本
echo "开始构建 release 版本..."
cargo build --release

echo ""
echo "========================================="
echo "构建完成！"
echo "========================================="
echo ""
echo "二进制文件位置: target/release/xunfei-asr-server"
echo "文件大小: $(du -h target/release/xunfei-asr-server | cut -f1)"
echo ""
echo "下一步:"
echo "1. 复制 .env.example 为 .env"
echo "2. 编辑 .env 文件，填入你的讯飞星火凭证"
echo "3. 运行 ./run.sh 启动服务"
echo ""