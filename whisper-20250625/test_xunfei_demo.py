# -*- coding:utf-8 -*-
# 测试讯飞星火语音识别demo

import _thread as thread
import os
import time
from time import mktime

import websocket

import base64
import datetime
import hashlib
import hmac
import json
import ssl
from datetime import datetime
from urllib.parse import urlencode
from wsgiref.handlers import format_date_time

STATUS_FIRST_FRAME = 0  # 第一帧的标识
STATUS_CONTINUE_FRAME = 1  # 中间帧标识
STATUS_LAST_FRAME = 2  # 最后一帧的标识


class Ws_Param(object):
    # 初始化
    def __init__(self, APPID, APIKey, APISecret, AudioFile):
        self.APPID = APPID
        self.APIKey = APIKey
        self.APISecret = APISecret
        self.AudioFile = AudioFile
        self.iat_params = {
            "domain": "slm", "language": "zh_cn", "accent": "mandarin","dwa":"wpgs", "result":
                {
                    "encoding": "utf8",
                    "compress": "raw",
                    "format": "plain"
                }
        }

    # 生成url
    def create_url(self):
        url = 'ws://iat.xf-yun.com/v1'
        # 生成RFC1123格式的时间戳
        now = datetime.now()
        date = format_date_time(mktime(now.timetuple()))

        # 拼接字符串
        signature_origin = "host: " + "iat.xf-yun.com" + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + "/v1 " + "HTTP/1.1"
        # 进行hmac-sha256进行加密
        signature_sha = hmac.new(self.APISecret.encode('utf-8'), signature_origin.encode('utf-8'),
                                 digestmod=hashlib.sha256).digest()
        signature_sha = base64.b64encode(signature_sha).decode(encoding='utf-8')

        authorization_origin = "api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"" % (
            self.APIKey, "hmac-sha256", "host date request-line", signature_sha)
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')
        # 将请求的鉴权参数组合为字典
        v = {
            "authorization": authorization,
            "date": date,
            "host": "iat.xf-yun.com"
        }
        # 拼接鉴权参数，生成url
        url = url + '?' + urlencode(v)
        print('websocket url :', url)
        return url


# 收到websocket消息的处理
def on_message(ws, message):
    message = json.loads(message)
    code = message["header"]["code"]
    status = message["header"]["status"]
    if code != 0:
        print(f"请求错误：{code}")
        ws.close()
    else:
        payload = message.get("payload")
        if payload:
            text = payload["result"]["text"]
            text = json.loads(str(base64.b64decode(text), "utf8"))
            text_ws = text['ws']
            result = ''
            for i in text_ws:
                for j in i["cw"]:
                    w = j["w"]
                    result += w
            print(result)
        if status == 2:
            print("识别完成")
            ws.close()


# 收到websocket错误的处理
def on_error(ws, error):
    print("### error:", error)


# 收到websocket关闭的处理
def on_close(ws, close_status_code, close_msg):
    print("### closed ###")


# 收到websocket连接建立的处理
def on_open(ws):
    def run(*args):
        frameSize = 1280  # 每一帧的音频大小
        intervel = 0.04  # 发送音频间隔(单位:s)
        status = STATUS_FIRST_FRAME  # 音频的状态信息，标识音频是第一帧，还是中间帧、最后一帧

        with open(wsParam.AudioFile, "rb") as fp:
            while True:

                buf = fp.read(frameSize)
                audio = str(base64.b64encode(buf), 'utf-8')

                # 文件结束
                if not buf:
                    status = STATUS_LAST_FRAME
                # 第一帧处理
                if status == STATUS_FIRST_FRAME:

                    d = {"header":
                        {
                            "status": 0,
                            "app_id": wsParam.APPID
                        },
                        "parameter": {
                            "iat": wsParam.iat_params
                        },
                        "payload": {
                            "audio":
                                {
                                    "audio": audio, "sample_rate": 16000, "encoding": "raw"
                                }
                        }}
                    d = json.dumps(d)
                    ws.send(d)
                    status = STATUS_CONTINUE_FRAME
                # 中间帧处理
                elif status == STATUS_CONTINUE_FRAME:
                    d = {"header": {"status": 1,
                                    "app_id": wsParam.APPID},
                         "parameter": {
                             "iat": wsParam.iat_params
                         },
                         "payload": {
                             "audio":
                                 {
                                     "audio": audio, "sample_rate": 16000, "encoding": "raw"
                                 }}}
                    ws.send(json.dumps(d))
                # 最后一帧处理
                elif status == STATUS_LAST_FRAME:
                    d = {"header": {"status": 2,
                                    "app_id": wsParam.APPID
                                    },
                         "parameter": {
                             "iat": wsParam.iat_params
                         },
                         "payload": {
                             "audio":
                                 {
                                     "audio": audio, "sample_rate": 16000, "encoding": "raw"
                                 }}}
                    ws.send(json.dumps(d))
                    break

                # 模拟音频采样间隔
                time.sleep(intervel)


    thread.start_new_thread(run, ())


if __name__ == "__main__":
    print("开始测试讯飞星火语音识别...")
    print("音频文件: tests/jfk_16k.pcm")

    # 从环境变量读取凭证
    APPID = os.getenv("XUNFEI_APP_ID", "your_app_id_here")
    APISecret = os.getenv("XUNFEI_API_SECRET", "your_api_secret_here")
    APIKey = os.getenv("XUNFEI_API_KEY", "your_api_key_here")

    # 使用新的凭证
    wsParam = Ws_Param(APPID=APPID, APISecret=APISecret,
                       APIKey=APIKey,
                       AudioFile=r'tests/jfk_16k.pcm')
    websocket.enableTrace(False)
    wsUrl = wsParam.create_url()
    ws = websocket.WebSocketApp(wsUrl, on_message=on_message, on_error=on_error, on_close=on_close)
    ws.on_open = on_open
    ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})