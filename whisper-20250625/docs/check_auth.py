#!/usr/bin/env python3
import os
import hmac
import base64
import hashlib
import json
import time
import ssl
import websocket
from datetime import datetime
from urllib.parse import urlencode

# 配置
APPID = os.getenv("XUNFEI_APP_ID", "your_app_id_here")
APIKey = os.getenv("XUNFEI_API_KEY", "your_api_key_here")
APISecret = os.getenv("XUNFEI_API_SECRET", "your_api_secret_here")

# 参数
iat_params = {
    "domain": "slm",
    "language": "zh_cn", 
    "accent": "mandarin",
    "dwa": "wpgs",
    "result": {
        "encoding": "utf8",
        "compress": "raw",
        "format": "plain"
    }
}

def create_url():
    """生成鉴权 URL"""
    base_url = 'ws://iat.xf-yun.com/v1'
    
    # 生成本地时间戳
    now = datetime.now()
    date = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.localtime(now.timestamp()))
    
    print(f"日期: {date}")
    
    # 拼接签名字符串
    signature_origin = f"host: iat.xf-yun.com\ndate: {date}\nGET /v1 HTTP/1.1"
    print(f"签名字符串:\n{signature_origin}")
    
    # HMAC-SHA256 签名
    signature_sha = hmac.new(
        APISecret.encode('utf-8'), 
        signature_origin.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    signature = base64.b64encode(signature_sha).decode('utf-8')
    print(f"签名: {signature}")
    
    # 拼接 authorization_origin
    authorization_origin = f'api_key="{APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
    print(f"Authorization 原始: {authorization_origin}")
    
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
    print(f"Authorization (Base64): {authorization}")
    
    # 组合参数
    v = {
        "authorization": authorization,
        "date": date,
        "host": "iat.xf-yun.com"
    }
    
    # 生成 URL
    url = base_url + '?' + urlencode(v)
    print(f"\n完整 URL: {url}")
    
    return url

def on_message(ws, message):
    """接收消息"""
    try:
        data = json.loads(message)
        print(f"\n=== 收到消息 ===")
        print(f"完整数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        code = data.get("header", {}).get("code")
        status = data.get("header", {}).get("status")
        
        if code != 0:
            error_msg = data.get("header", {}).get("message", "未知错误")
            print(f"❌ 错误: code={code}, message={error_msg}")
        else:
            payload = data.get("payload", {})
            if "result" in payload:
                text = payload["result"]["text"]
                if text:
                    text_data = json.loads(str(base64.b64decode(text), "utf8"))
                    print(f"识别结果: {text_data}")
            
            if status == 2:
                print("✅ 识别完成")
                ws.close()
                
    except Exception as e:
        print(f"解析消息失败: {e}")

def on_error(ws, error):
    """错误处理"""
    print(f"❌ WebSocket 错误: {error}")

def on_close(ws, close_status_code, close_msg):
    """关闭处理"""
    print(f"🔌 WebSocket 关闭: code={close_status_code}, msg={close_msg}")

def on_open(ws):
    """连接建立"""
    print("✅ WebSocket 连接建立")
    
    # 发送测试数据
    import base64
    
    # 生成测试音频（1秒静音）
    test_audio = b'\x00' * (16000 * 2)  # 1秒静音 @ 16kHz, 16bit
    audio_base64 = str(base64.b64encode(test_audio), 'utf-8')
    
    # 第一帧
    data = {
        "header": {
            "status": 0,
            "app_id": APPID
        },
        "parameter": {
            "iat": iat_params
        },
        "payload": {
            "audio": {
                "audio": audio_base64,
                "sample_rate": 16000,
                "encoding": "raw"
            }
        }
    }
    
    ws.send(json.dumps(data, ensure_ascii=False))
    print("📤 发送第一帧")
    
    # 最后一帧
    data = {
        "header": {
            "status": 2,
            "app_id": APPID
        },
        "parameter": {
            "iat": iat_params
        },
        "payload": {
            "audio": {
                "audio": "",
                "sample_rate": 16000,
                "encoding": "raw"
            }
        }
    }
    
    ws.send(json.dumps(data, ensure_ascii=False))
    print("📤 发送最后一帧")

if __name__ == "__main__":
    print("=== 讯飞星火鉴权测试 ===\n")
    
    url = create_url()
    
    print("\n=== 尝试连接 ===\n")
    
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp(
        url, 
        on_message=on_message, 
        on_error=on_error, 
        on_close=on_close
    )
    ws.on_open = on_open
    
    ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
