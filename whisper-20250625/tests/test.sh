#!/bin/bash
# 讯飞星火语音识别服务 - 测试脚本

set -e

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "========================================="
echo "讯飞星火语音识别服务 - 测试"
echo "========================================="
echo ""
echo "测试服务器: $BASE_URL"
echo ""

# 测试 1: 健康检查
echo "测试 1: 健康检查"
curl -s "$BASE_URL/health" | jq .
echo ""

# 测试 2: 获取首页
echo "测试 2: 获取首页"
curl -s "$BASE_URL/" | head -20
echo ""
echo "..."
echo ""

# 测试 3: 切换模型
echo "测试 3: 切换模型"
curl -s -X POST "$BASE_URL/change-model" \
  -H "Content-Type: application/json" \
  -d '{"model": "xunfei"}' | jq .
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "要测试音频识别功能，请："
echo "1. 访问 $BASE_URL 打开 Web 界面"
echo "2. 或使用 curl 上传音频文件："
echo "   curl -X POST $BASE_URL/transcribe -F 'file=@audio.wav'"
echo ""