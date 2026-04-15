#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讯飞星火鉴权调试脚本
"""

import os
import hmac
import base64
import hashlib
import json
from datetime import datetime
from urllib.parse import quote

# 讯飞配置
APP_ID = os.getenv("XUNFEI_APP_ID", "your_app_id_here")
API_KEY = os.getenv("XUNFEI_API_KEY", "your_api_key_here")
API_SECRET = os.getenv("XUNFEI_API_SECRET", "your_api_secret_here")

def generate_auth_url():
    """生成鉴权 URL"""
    # 获取 RFC1123 格式时间（UTC+0）
    date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')

    print(f"配置信息：")
    print(f"  APP ID: {APP_ID}")
    print(f"  API Key: {API_KEY}")
    print(f"  API Secret: {API_SECRET}")
    print(f"  时间: {date}")
    print()

    # 拼接签名字符串
    signature_origin = f"host: iat.xf-yun.com\ndate: {date}\nGET /v1 HTTP/1.1"

    print(f"签名字符串：")
    print(f"  {repr(signature_origin)}")
    print()

    # 使用 HMAC-SHA256 签名
    signature_sha = hmac.new(
        API_SECRET.encode('utf-8'),
        signature_origin.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()

    # Base64 编码
    signature = base64.b64encode(signature_sha).decode(encoding='utf-8')

    print(f"签名（Base64）：")
    print(f"  {signature}")
    print()

    # 拼接 authorization_origin
    authorization_origin = f'api_key="{API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'

    print(f"Authorization 原始字符串：")
    print(f"  {authorization_origin}")
    print()

    # Base64 编码
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

    print(f"Authorization（Base64）：")
    print(f"  {authorization}")
    print()

    # URL 编码
    authorization_encoded = quote(authorization)
    date_encoded = quote(date)

    # 生成完整 URL
    url = f"wss://iat.xf-yun.com/v1?authorization={authorization_encoded}&date={date_encoded}&host=iat.xf-yun.com"

    print(f"完整 URL：")
    print(f"  {url}")
    print()

    # 测试连接
    try:
        import websockets
        import asyncio

        async def test_connection():
            print("尝试连接...")
            try:
                async with websockets.connect(url, ping_interval=None) as websocket:
                    print("✓ 连接成功！")
                    # 发送测试消息
                    test_data = {
                        "header": {
                            "app_id": APP_ID,
                            "status": 0
                        },
                        "parameter": {
                            "iat": {
                                "domain": "slm",
                                "language": "zh_cn",
                                "accent": "mandarin",
                                "eos": 6000,
                                "dwa": "wpgs",
                                "result": {
                                    "encoding": "utf8",
                                    "compress": "raw",
                                    "format": "json"
                                }
                            }
                        },
                        "payload": {
                            "audio": {
                                "encoding": "raw",
                                "sample_rate": 16000,
                                "channels": 1,
                                "bit_depth": 16,
                                "seq": 1,
                                "status": 2,
                                "audio": ""
                            }
                        }
                    }

                    await websocket.send(json.dumps(test_data, ensure_ascii=False))
                    response = await websocket.recv()
                    print(f"✓ 收到响应: {response[:200]}...")

            except Exception as e:
                print(f"✗ 连接失败: {type(e).__name__}: {e}")

        asyncio.run(test_connection())

    except ImportError:
        print("需要安装 websockets 库: pip install websockets")

if __name__ == "__main__":
    generate_auth_url()