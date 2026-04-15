#!/bin/bash
# 讯飞星火语音识别服务 - 使用示例

# 示例 1: 使用默认值启动（无需任何参数）
echo "=== 示例 1: 使用默认值启动 ==="
echo "默认凭证："
echo "  APP ID: 140c88e2"
echo "  API Key: 63101bc8a895022a2f12d0875f909ee6"
echo "  API Secret: ZGRiNWVjZTRhMjQ0NmE0YTRkOGMxZWEx"
echo ""
./xunfei-asr-server --server-port 8001

# 示例 2: 使用命令行参数覆盖默认值
echo "=== 示例 2: 使用命令行参数覆盖默认值 ==="
./xunfei-asr-server \
  --xunfei-app-id your_app_id_here \
  --xunfei-api-key your_api_key_here \
  --xunfei-api-secret your_api_secret_here \
  --server-port 8002

# 示例 3: 使用环境变量覆盖默认值
echo "=== 示例 3: 使用环境变量覆盖默认值 ==="
export XUNFEI_APP_ID=your_app_id_here
export XUNFEI_API_KEY=your_api_key_here
export XUNFEI_API_SECRET=your_api_secret_here
./xunfei-asr-server --server-port 8003

# 示例 4: 自定义服务器地址和端口
echo "=== 示例 4: 自定义服务器地址和端口 ==="
./xunfei-asr-server \
  --server-host 127.0.0.1 \
  --server-port 9000

# 示例 5: 查看帮助信息
echo "=== 示例 5: 查看帮助信息 ==="
./xunfei-asr-server --help

# 示例 6: 查看版本信息
echo "=== 示例 6: 查看版本信息 ==="
./xunfei-asr-server --version