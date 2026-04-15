#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 debug_auth.py 生成的 URL 进行测试
"""

import asyncio
import os
import hmac
import base64
import hashlib
import json
from datetime import datetime
from urllib.parse import quote

try:
    import websockets
except ImportError:
    websockets = None

APP_ID = os.getenv("XUNFEI_APP_ID", "your_app_id_here")
API_KEY = os.getenv("XUNFEI_API_KEY", "your_api_key_here")
API_SECRET = os.getenv("XUNFEI_API_SECRET", "your_api_secret_here")


def generate_auth_url():
    """生成鉴权 URL"""
    date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')

    signature_origin = f"host: iat.xf-yun.com\ndate: {date}\nGET /v1 HTTP/1.1"

    signature_sha = hmac.new(
        API_SECRET.encode('utf-8'),
        signature_origin.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()

    signature = base64.b64encode(signature_sha).decode(encoding='utf-8')

    authorization_origin = f'api_key="{API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

    authorization_encoded = quote(authorization)
    date_encoded = quote(date)

    url = f"wss://iat.xf-yun.com/v1?authorization={authorization_encoded}&date={date_encoded}&host=iat.xf-yun.com"

    return url


async def test_connection():
    """测试连接"""
    url = generate_auth_url()

    print(f"尝试连接到: {url[:100]}...")

    try:
        async with websockets.connect(url, ping_interval=None) as websocket:
            print("✓ 连接成功！")

            # 发送测试数据
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
                        "status": 0,
                        "audio": ""
                    }
                }
            }

            await websocket.send(json.dumps(test_data, ensure_ascii=False))

            response = await websocket.recv()
            data = json.loads(response)

            print(f"收到响应: {json.dumps(data, ensure_ascii=False, indent=2)}")

            code = data.get("header", {}).get("code")
            message = data.get("header", {}).get("message")

            if code == 0:
                print("✓ 鉴权成功！")
                return True
            else:
                print(f"✗ 鉴权失败: code={code}, message={message}")
                return False

    except Exception as e:
        print(f"✗ 连接失败: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    exit(0 if success else 1)