#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试讯飞星火语音识别客户端（修复版）
"""

import asyncio
import os
from xunfei_client import XunfeiASRClient


async def test_transcribe():
    """测试音频识别"""
    # 使用环境变量中的配置
    app_id = os.getenv("XUNFEI_APP_ID", "your_app_id_here")
    api_key = os.getenv("XUNFEI_API_KEY", "your_api_key_here")
    api_secret = os.getenv("XUNFEI_API_SECRET", "your_api_secret_here")

    client = XunfeiASRClient(app_id, api_key, api_secret)

    # 创建测试音频数据（10秒的静音）
    # 10秒 * 16000Hz * 2字节 = 320000 字节
    audio_data = bytes(10 * 16000 * 2)

    print(f"开始测试...")
    print(f"音频大小: {len(audio_data)} 字节 ({len(audio_data) / (16000 * 2):.1f} 秒)")

    try:
        result = await client.transcribe_audio(audio_data)
        print(f"识别成功！")
        print(f"识别结果: {result}")
        return True
    except Exception as e:
        print(f"识别失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_transcribe())
    exit(0 if success else 1)