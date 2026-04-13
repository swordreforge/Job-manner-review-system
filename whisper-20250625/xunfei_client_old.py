#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讯飞星火语音识别客户端
实现 WebSocket 连接、鉴权、音频流式传输
"""

import hmac
import base64
import hashlib
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional

try:
    import websockets
except ImportError:
    websockets = None

logger = logging.getLogger(__name__)


class XunfeiASRClient:
    """讯飞星火语音识别客户端"""

    def __init__(self, app_id: str, api_key: str, api_secret: str):
        """
        初始化客户端

        Args:
            app_id: 讯飞应用 ID
            api_key: 讯飞 API Key
            api_secret: 讯飞 API Secret
        """
        self.app_id = app_id
        self.api_key = api_key
        self.api_secret = api_secret
        self.url = "wss://iat.xf-yun.com/v1"

    def _generate_auth_url(self) -> str:
        """
        生成鉴权 URL

        Returns:
            带鉴权参数的 WebSocket URL
        """
        # 获取 RFC1123 格式时间（UTC+0）
        date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')

        # 拼接签名字符串
        signature_origin = f"host: iat.xf-yun.com\ndate: {date}\nGET /v1 HTTP/1.1"

        # 使用 HMAC-SHA256 签名
        signature_sha = hmac.new(
            self.api_secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()

        # Base64 编码
        signature = base64.b64encode(signature_sha).decode(encoding='utf-8')

        # 拼接 authorization_origin
        authorization_origin = f'api_key="{self.api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

        # 生成完整 URL
        return f"{self.url}?authorization={authorization}&date={date}&host=iat.xf-yun.com"

    async def transcribe_audio(self, audio_data: bytes, sample_rate: int = 16000) -> str:
        """
        异步识别音频

        Args:
            audio_data: 音频数据（PCM 格式）
            sample_rate: 采样率（默认 16000Hz）

        Returns:
            识别文本
        """
        if websockets is None:
            raise ImportError("websockets 库未安装，请运行: pip install websockets")

        url = self._generate_auth_url()

        try:
            async with websockets.connect(url, ping_interval=None) as websocket:
                # 发送首帧
                await self._send_first_frame(websocket, audio_data, sample_rate)

                # 接收结果
                result = await self._receive_result(websocket)

                return result
        except Exception as e:
            logger.error(f"音频识别失败: {str(e)}")
            raise

    async def _send_first_frame(self, websocket, audio_data: bytes, sample_rate: int):
        """
        发送首帧数据

        Args:
            websocket: WebSocket 连接
            audio_data: 音频数据
            sample_rate: 采样率
        """
        # 将音频转换为 base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')

        # 构建第一帧数据
        data = {
            "header": {
                "app_id": self.app_id,
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
                    "sample_rate": sample_rate,
                    "channels": 1,
                    "bit_depth": 16,
                    "seq": 1,
                    "status": 2,  # 直接发送最后一帧（完整音频）
                    "audio": audio_base64
                }
            }
        }

        await websocket.send(json.dumps(data, ensure_ascii=False))

    async def _receive_result(self, websocket) -> str:
        """
        接收识别结果

        Args:
            websocket: WebSocket 连接

        Returns:
            识别文本
        """
        full_text = ""

        try:
            while True:
                response = await websocket.recv()
                data = json.loads(response)

                # 检查是否结束
                if data['header']['status'] == 2:
                    if 'payload' in data and 'result' in data['payload']:
                        text_base64 = data['payload']['result']['text']
                        text_json = base64.b64decode(text_base64).decode('utf-8')
                        result = json.loads(text_json)

                        # 解析结果
                        if 'ws' in result:
                            for ws in result['ws']:
                                if 'cw' in ws:
                                    for cw in ws['cw']:
                                        full_text += cw.get('w', '')

                    break

                # 处理中间帧
                elif data['header']['status'] == 1:
                    if 'payload' in data and 'result' in data['payload']:
                        text_base64 = data['payload']['result']['text']
                        text_json = base64.b64decode(text_base64).decode('utf-8')
                        result = json.loads(text_json)

                        # 解析中间结果
                        if 'ws' in result:
                            for ws in result['ws']:
                                if 'cw' in ws:
                                    for cw in ws['cw']:
                                        full_text += cw.get('w', '')

        except Exception as e:
            logger.error(f"接收结果失败: {str(e)}")
            raise

        return full_text

    def transcribe_audio_sync(self, audio_data: bytes, sample_rate: int = 16000) -> str:
        """
        同步识别音频（兼容现有接口）

        Args:
            audio_data: 音频数据（PCM 格式）
            sample_rate: 采样率（默认 16000Hz）

        Returns:
            识别文本
        """
        return asyncio.run(self.transcribe_audio(audio_data, sample_rate))


def test_client():
    """测试客户端"""
    # 使用测试配置
    client = XunfeiASRClient(
        app_id="d2aa42c9",
        api_key="95556aefd492e5942df045678c0302f5",
        api_secret="NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh"
    )

    # 测试鉴权 URL 生成
    url = client._generate_auth_url()
    print(f"鉴权 URL: {url[:100]}...")

    # 测试识别功能（需要真实的音频数据）
    # with open("test_audio.pcm", "rb") as f:
    #     audio_data = f.read()
    #     result = client.transcribe_audio_sync(audio_data)
    #     print(f"识别结果: {result}")


if __name__ == "__main__":
    test_client()