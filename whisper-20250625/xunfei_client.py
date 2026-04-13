#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讯飞星火语音识别客户端（参考官方示例）
实现 WebSocket 连接、鉴权、音频流式传输
"""

import hmac
import base64
import hashlib
import json
import asyncio
import logging
import time
from datetime import datetime
from urllib.parse import urlencode
from wsgiref.handlers import format_date_time

try:
    import websockets
except ImportError:
    websockets = None

logger = logging.getLogger(__name__)

STATUS_FIRST_FRAME = 0  # 第一帧的标识
STATUS_CONTINUE_FRAME = 1  # 中间帧标识
STATUS_LAST_FRAME = 2  # 最后一帧的标识


class XunfeiASRClient:
    """讯飞星火语音识别客户端（参考官方示例）"""

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
        self.base_url = 'ws://iat.xf-yun.com/v1'
        
        # 参考官方示例的参数配置
        self.iat_params = {
            "domain": "slm",
            "language": "zh_cn", 
            "accent": "mandarin",
            "dwa": "wpgs",
            "result": {
                "encoding": "utf8",
                "compress": "raw",
                "format": "plain"  # 官方示例使用 plain 而不是 json
            }
        }

    def create_url(self) -> str:
        """
        生成鉴权 URL（参考官方示例）

        Returns:
            带鉴权参数的 WebSocket URL
        """
        url = self.base_url
        
        # 生成RFC1123格式的时间戳（本地时间）
        now = datetime.now()
        date = format_date_time(now.timestamp())

        # 拼接字符串
        signature_origin = "host: " + "iat.xf-yun.com" + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + "/v1 " + "HTTP/1.1"
        
        # 进行hmac-sha256进行加密
        signature_sha = hmac.new(
            self.api_secret.encode('utf-8'), 
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        signature_sha = base64.b64encode(signature_sha).decode(encoding='utf-8')

        authorization_origin = 'api_key="%s", algorithm="%s", headers="%s", signature="%s"' % (
            self.api_key, "hmac-sha256", "host date request-line", signature_sha)
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')
        
        # 将请求的鉴权参数组合为字典
        v = {
            "authorization": authorization,
            "date": date,
            "host": "iat.xf-yun.com"
        }
        
        # 拼接鉴权参数，生成url
        url = url + '?' + urlencode(v)
        
        logger.info(f"WebSocket URL: {url}")
        return url

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

        url = self.create_url()

        try:
            async with websockets.connect(url, ping_interval=None) as websocket:
                # 流式发送音频数据
                result = await self._send_and_receive(websocket, audio_data, sample_rate)
                return result
        except Exception as e:
            logger.error(f"音频识别失败: {str(e)}")
            raise

    async def _send_and_receive(self, websocket, audio_data: bytes, sample_rate: int):
        """
        发送音频并接收结果（参考官方示例）

        Args:
            websocket: WebSocket 连接
            audio_data: 音频数据
            sample_rate: 采样率

        Returns:
            识别文本
        """
        frame_size = 1280  # 每一帧的音频大小
        interval = 0.04  # 发送音频间隔(单位:s)
        status = STATUS_FIRST_FRAME
        full_text = ""
        
        # 使用生成器逐帧读取音频数据
        audio_generator = self._read_audio_frames(audio_data, frame_size)
        
        try:
            for buf in audio_generator:
                # 将音频转换为 base64
                audio = str(base64.b64encode(buf), 'utf-8')
                
                # 第一帧处理
                if status == STATUS_FIRST_FRAME:
                    d = {
                        "header": {
                            "status": 0,
                            "app_id": self.app_id
                        },
                        "parameter": {
                            "iat": self.iat_params
                        },
                        "payload": {
                            "audio": {
                                "audio": audio,
                                "sample_rate": sample_rate,
                                "encoding": "raw"
                            }
                        }
                    }
                    status = STATUS_CONTINUE_FRAME
                
                # 中间帧处理
                elif status == STATUS_CONTINUE_FRAME:
                    d = {
                        "header": {
                            "status": 1,
                            "app_id": self.app_id
                        },
                        "parameter": {
                            "iat": self.iat_params
                        },
                        "payload": {
                            "audio": {
                                "audio": audio,
                                "sample_rate": sample_rate,
                                "encoding": "raw"
                            }
                        }
                    }
                
                # 最后一帧处理
                elif status == STATUS_LAST_FRAME:
                    d = {
                        "header": {
                            "status": 2,
                            "app_id": self.app_id
                        },
                        "parameter": {
                            "iat": self.iat_params
                        },
                        "payload": {
                            "audio": {
                                "audio": audio,
                                "sample_rate": sample_rate,
                                "encoding": "raw"
                            }
                        }
                    }
                
                # 发送数据
                await websocket.send(json.dumps(d, ensure_ascii=False))
                
                # 模拟音频采样间隔
                await asyncio.sleep(interval)
            
            # 等待接收结果
            while True:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    message_data = json.loads(message)
                    code = message_data["header"]["code"]
                    status = message_data["header"]["status"]
                    
                    if code != 0:
                        error_msg = message_data["header"].get("message", "未知错误")
                        logger.error(f"请求错误：{code} - {error_msg}")
                        raise Exception(f"讯飞星火返回错误: {error_msg} (code: {code})")
                    
                    payload = message_data.get("payload")
                    if payload and "result" in payload:
                        text = payload["result"]["text"]
                        # 参考官方示例：text 是 base64 编码的
                        text_data = json.loads(str(base64.b64decode(text), "utf8"))
                        
                        # 解析结果
                        if 'ws' in text_data:
                            text_ws = text_data['ws']
                            result = ''
                            for i in text_ws:
                                for j in i["cw"]:
                                    w = j["w"]
                                    result += w
                            full_text += result
                            logger.info(f"识别结果: {result}")
                    
                    if status == 2:
                        break
                        
                except asyncio.TimeoutError:
                    logger.warning("接收结果超时")
                    break
            
            return full_text
            
        except Exception as e:
            logger.error(f"发送和接收失败: {str(e)}")
            raise

    def _read_audio_frames(self, audio_data: bytes, frame_size: int):
        """
        生成器：逐帧读取音频数据

        Args:
            audio_data: 音频数据
            frame_size: 每帧大小

        Yields:
            音频帧数据
        """
        total_size = len(audio_data)
        for i in range(0, total_size, frame_size):
            buf = audio_data[i:i + frame_size]
            
            # 检查是否为最后一帧
            if i + frame_size >= total_size:
                # 返回当前帧（可能不足 frame_size）
                yield buf
                # 标记最后一帧
                self.last_frame = True
                break
            else:
                yield buf

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