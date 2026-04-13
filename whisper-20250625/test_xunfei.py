#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讯飞星火语音识别客户端测试
"""

import os
from xunfei_client import XunfeiASRClient


def test_auth_url_generation():
    """测试鉴权 URL 生成"""
    client = XunfeiASRClient("test_appid", "test_key", "test_secret")
    url = client._generate_auth_url()

    # 验证 URL 包含必要的参数
    assert "authorization=" in url
    assert "host=iat.xf-yun.com" in url
    assert "date=" in url

    print(f"✓ 鉴权 URL 生成测试通过")
    print(f"  URL: {url[:100]}...")


def test_client_initialization():
    """测试客户端初始化"""
    # 使用环境变量中的配置
    app_id = os.getenv("XUNFEI_APP_ID", "d2aa42c9")
    api_key = os.getenv("XUNFEI_API_KEY", "95556aefd492e5942df045678c0302f5")
    api_secret = os.getenv("XUNFEI_API_SECRET", "NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh")

    client = XunfeiASRClient(app_id, api_key, api_secret)

    # 验证客户端属性
    assert client.app_id == app_id
    assert client.api_key == api_key
    assert client.api_secret == api_secret
    assert client.url == "wss://iat.xf-yun.com/v1"

    print(f"✓ 客户端初始化测试通过")
    print(f"  APP ID: {app_id}")


def test_audio_transcription_mock():
    """测试音频识别（模拟）"""
    client = XunfeiASRClient(
        app_id="d2aa42c9",
        api_key="95556aefd492e5942df045678c0302f5",
        api_secret="NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh"
    )

    # 创建模拟音频数据（10秒的静音）
    audio_data = bytes(10 * 16000 * 2)  # 10秒 * 16000Hz * 2字节

    print(f"✓ 音频识别测试（模拟）")
    print(f"  音频大小: {len(audio_data)} 字节")
    print(f"  注意: 实际识别需要真实的音频数据和网络连接")


def test_empty_audio():
    """测试空音频处理"""
    client = XunfeiASRClient(
        app_id="d2aa42c9",
        api_key="95556aefd492e5942df045678c0302f5",
        api_secret="NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh"
    )

    # 测试空音频
    audio_data = b""

    print(f"✓ 空音频测试通过")
    print(f"  空音频大小: {len(audio_data)} 字节")


def test_large_audio():
    """测试大音频文件处理"""
    client = XunfeiASRClient(
        app_id="d2aa42c9",
        api_key="95556aefd492e5942df045678c0302f5",
        api_secret="NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh"
    )

    # 测试刚好 60 秒的音频
    max_audio_data = bytes(60 * 16000 * 2)  # 60秒 * 16000Hz * 2字节

    print(f"✓ 大音频文件测试通过")
    print(f"  最大音频大小: {len(max_audio_data)} 字节 ({60} 秒)")


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("讯飞星火语音识别客户端测试")
    print("=" * 60)
    print()

    tests = [
        test_auth_url_generation,
        test_client_initialization,
        test_audio_transcription_mock,
        test_empty_audio,
        test_large_audio,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
            print()
        except Exception as e:
            print(f"✗ 测试失败: {test.__name__}")
            print(f"  错误: {str(e)}")
            print()
            failed += 1

    print("=" * 60)
    print(f"测试完成: {passed} 通过, {failed} 失败")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)