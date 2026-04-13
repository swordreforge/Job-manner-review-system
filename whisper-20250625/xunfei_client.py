#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讯飞星火语音识别客户端（修复版）
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
from urllib.parse import quote

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

        # URL 编码参数
        authorization_encoded = quote(authorization)
        date_encoded = quote(date)

        # 生成完整 URL
        return f"{self.url}?authorization={authorization_encoded}&date={date_encoded}&host=iat.xf-yun.com"

    async def transcribe_audio(self, audio_data: bytes, sample_rate: int = 16000) -> str:
        """
        异步识别音频（流式发送）

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
                # 流式发送音频数据
                await self._send_audio_stream(websocket, audio_data, sample_rate)

                # 接收结果
                result = await self._receive_result(websocket)

                return result
        except Exception as e:
            logger.error(f"音频识别失败: {str(e)}")
            raise

    async def _send_audio_stream(self, websocket, audio_data: bytes, sample_rate: int):
        """
        流式发送音频数据

        Args:
            websocket: WebSocket 连接
            audio_data: 音频数据
            sample_rate: 采样率
        """
        # 分包参数（根据讯飞星火文档建议）
        frame_size = 1280  # 每次发送 1280 字节（对应 40ms 音频）
        total_size = len(audio_data)
        seq = 1

        # 计算总帧数
        total_frames = (total_size + frame_size - 1) // frame_size

        for i in range(0, total_size, frame_size):
            # 获取当前帧数据
            chunk = audio_data[i:i + frame_size]

            # 计算当前帧状态
            if i == 0:
                status = 0  # 第一帧
            elif i + frame_size >= total_size:
                status = 2  # 最后一帧
            else:
                status = 1  # 中间帧

            # 将音频转换为 base64
            audio_base64 = base64.b64encode(chunk).decode('utf-8')

            # 构建数据帧
            data = {
                "header": {
                    "app_id": self.app_id,
                    "status": status
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
                        "seq": seq,
                        "status": status,
                        "audio": audio_base64
                    }
                }
            }

            # 发送数据帧
            await websocket.send(json.dumps(data, ensure_ascii=False))

            # 最后一帧后立即发送空帧（确保服务器知道结束）
            if status == 2:
                end_data = {
                    "header": {
                        "app_id": self.app_id,
                        "status": 2
                    },
                    "payload": {
                        "audio": {
                            "encoding": "raw",
                            "sample_rate": sample_rate,
                            "channels": 1,
                            "bit_depth": 16,
                            "seq": seq + 1,
                            "status": 2,
                            "audio": ""
                        }
                    }
                }
                await websocket.send(json.dumps(end_data, ensure_ascii=False))

            seq += 1

            # 模拟实时发送间隔（40ms）
            if status != 2:
                await asyncio.sleep(0.04)

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

                # 检查 header 中的 code
                if data['header'].get('code') != 0:
                    error_msg = data['header'].get('message', '未知错误')
                    logger.error(f"讯飞星火返回错误: {error_msg} (code: {data['header'].get('code')})")
                    raise Exception(f"讯飞星火返回错误: {error_msg}")

                # 检查是否结束
                if data['header']['status'] == 2:
                    if 'payload' in data and 'result' in data['payload']:
                        text_base64 = data['payload']['result']['text']
                        if text_base64:
                            text_json = base64.b64decode(text_base64).decode('utf-8')
                            result = json.loads(text_json)

                            # 解析结果
                            if 'ws' in result:
                                for ws in result['ws']:
                                    if 'cw' in ws:
                                        for cw in ws['cw']:
                                            full_text += cw.get('w', '')

                    break
                else:
                    # 中间帧也可能有结果
                    if 'payload' in data and 'result' in data['payload']:
                        text_base64 = data['payload']['result']['text']
                        if text_base64:
                            text_json = base64.b64decode(text_base64).decode('utf-8')
                            result = json.loads(text_json)

                            # 解析结果
                            if 'ws' in result:
                                for ws in result['ws']:
                                    if 'cw' in ws:
                                        for cw in ws['cw']:
                                            full_text += cw.get('w', '')

            return full_text

        except Exception as e:
            logger.error(f"接收结果失败: {str(e)}")
            raise

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