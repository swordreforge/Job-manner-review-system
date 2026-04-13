中英识别大模型 API 文档
#一、接口说明
中英识别大模型识别能力，将短音频(≤60秒)精准识别成文字，实时返回文字结果，真实还原语音内容。支持中文、英文及202种方言免切换识别。 支持方言详细列表：方言明细 技术咨询可直接提交工单

注意：测试或正式使用前，请去对应产品页面获取免费额度或下单购买正式套餐；同时需要去控制台服务页面，获取API有效密钥（AppID、APIKey、APISecret）后再调用。

中英识别大模型产品页面

中英识别大模型服务页

#二、接口Demo
部分开发语言Demo如下，其他开发语言请参照文档进行开发，欢迎大家到讯飞开放平台社区  交流集成经验。

大模型中文+方言语音识别 Demo java语言

大模型中文+方言语音识别 Demo python语言

大模型中文+方言语音识别 PYTHON-SDK-DEMO

大模型中文+方言语音识别 JAVA-SDK-DEMO

#三、接口要求
内容	说明
请求协议	ws[s]（为提高安全性，强烈推荐wss）
请求地址	中英文语音地址：ws[s]: //iat.xf-yun.com/v1
接口鉴权	签名机制，详情请参照下方接口鉴权
字符编码	UTF-8
响应格式	统一采用JSON格式
开发语言	任意，只要可以向讯飞云服务发起HTTP请求的均可
音频属性	采样率16k或8K、位长16bit、单声道
音频格式	pcm (传参audio.encoding=raw)、mp3(传参audio.encoding=lame)
音频长度	最长60s
#四、接口鉴权
#鉴权方法
通过在请求地址后面加上鉴权相关参数的方式。示例url：

https://iat.xf-yun.com/v1?authorization=YXBpX2tleT0ia2V5eHh4eHh4eHg4ZWUyNzkzNDg1MTlleHh4eHh4eHgiLCBhbGdvcml0aG09ImhtYWMtc2hhMjU2IiwgaGVhZGVycz0iaG9zdCBkYXRlIHJlcXVlc3QtbGluZSIsIHNpZ25hdHVyZT0iUzY2RmVxVEpsdmtkK0tmSmcrYTczQkFhYm9jd1JnMnNjS2ZsT05JOG84MD0i&amp;date=Tue%2C%2014%20May%202024%2008%3A46%3A48%20GMT&amp;host=iat.xf-yun.com
鉴权参数：

参数	类型	必须	说明	示例
host	string	是	请求主机	iat.xf-yun.com
date	string	是	当前时间戳，RFC1123格式	Tue, 14 May 2024 08:46:48 GMT
authorization	string	是	使用base64编码的签名相关信息(签名基于hmac-sha256计算)	参考下方authorization参数生成规则
· date参数生成规则

date必须是UTC+0或GMT时区，RFC1123格式(Tue, 14 May 2024 08:46:48 GMT)。 服务端会对Date进行时钟偏移检查，最大允许300秒的偏差，超出偏差的请求都将被拒绝。

· authorization参数生成规则

1）获取接口密钥APIKey 和 APISecret。 在讯飞开放平台控制台，创建WebAPI平台应用并添加语音听写（流式版）服务后即可查看，均为32位字符串。

2）参数authorization base64编码前（authorization_origin）的格式如下。

api_key="$api_key",algorithm="hmac-sha256",headers="host date request-line",signature="$signature"
其中 api_key 是在控制台获取的APIKey，algorithm 是加密算法（仅支持hmac-sha256），headers 是参与签名的参数（见下方注释）。 signature 是使用加密算法对参与签名的参数签名后并使用base64编码的字符串，详见下方。

*注：* headers是参与签名的参数，请注意是固定的参数名（"host date request-line"），而非这些参数的值。

3）signature的原始字段(signature_origin)规则如下。

signature原始字段由 host，date，request-line三个参数按照格式拼接成， 拼接的格式为(\n为换行符,’:’后面有一个空格)：

host: $host\ndate: $date\n$request-line
假设

请求url = wss://iat.xf-yun.com/v1
date = Tue, 14 May 2024 08:46:48 GMT
那么 signature原始字段(signature_origin)则为：

host: iat.xf-yun.com
date: Tue, 14 May 2024 08:46:48 GMT
GET /v1 HTTP/1.1
4）使用hmac-sha256算法结合apiSecret对signature_origin签名，获得签名后的摘要signature_sha。

signature_sha=hmac-sha256(signature_origin,$apiSecret)
其中 apiSecret 是在控制台获取的APISecret

5）使用base64编码对signature_sha进行编码获得最终的signature。

signature=base64(signature_sha)
假设

APISecret = secretxxxxxxxx2df7900c09xxxxxxxx	
date = Tue, 14 May 2024 08:46:48 GMT
则signature为

signature=S66FeqTJlvkd+KfJg+a73BAabocwRg2scKflONI8o80=
6）根据以上信息拼接authorization base64编码前（authorization_origin）的字符串，示例如下。

api_key="keyxxxxxxxx8ee279348519exxxxxxxx", algorithm="hmac-sha256", headers="host date request-line", signature="S66FeqTJlvkd+KfJg+a73BAabocwRg2scKflONI8o80="
注： headers是参与签名的参数，请注意是固定的参数名（"host date request-line"），而非这些参数的值。

7）最后再对authorization_origin进行base64编码获得最终的authorization参数。

authorization = base64(authorization_origin)
示例：
https://iat.xf-yun.com/v1?authorization=YXBpX2tleT0ia2V5eHh4eHh4eHg4ZWUyNzkzNDg1MTlleHh4eHh4eHgiLCBhbGdvcml0aG09ImhtYWMtc2hhMjU2IiwgaGVhZGVycz0iaG9zdCBkYXRlIHJlcXVlc3QtbGluZSIsIHNpZ25hdHVyZT0iUzY2RmVxVEpsdmtkK0tmSmcrYTczQkFhYm9jd1JnMnNjS2ZsT05JOG84MD0i&amp;date=Tue%2C%2014%20May%202024%2008%3A46%3A48%20GMT&amp;host=iat.xf-yun.com
#五、数据传输接收与请求、返回示例
#1、数据传输接收
握手成功后客户端和服务端会建立Websocket连接，客户端通过Websocket连接可以同时上传和接收数据。 当服务端有识别结果时，会通过Websocket连接推送识别结果到客户端。

数据发送建议采用实时流式分包发送，每一包音频时长应符合人正常说话的实时场景，避免发包间隔过短或者发包长度过大，否则可能导致识别响应耗时增加。

音频发送规范建议：

音频数据发送间隔：40ms / 次；
单次发送音频字节数：1280 字节（对应 python 示例 Demo 中 frameSize 参数的取值）
特殊说明：若音频为压缩格式，上述 1280 字节为解压后的音频数据字节大小
//连接成功，开始发送数据
int frameSize = 1280; //每次发送音频大小
int intervel = 40; //每次发送音频间隔
int status = 0;  // 音频的状态
try (FileInputStream fs = new FileInputStream(file)) {
    byte[] buffer = new byte[frameSize];
    // 发送音频
#2、请求json示例
第一帧数据：

{
  "header": {
    "app_id": "your_appid",
    "res_id": "hot_words",
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
      "audio": "AAAAAP..."
    }
  }
}
中间帧数据：

{
  "header": {
    "app_id": "your_appid",
    "res_id": "hot_words",
    "status": 1
  },
  "payload": {
    "audio": {
      "encoding": "raw",
      "sample_rate": 16000,
      "channels": 1,
      "bit_depth": 16,
      "seq": 2,
      "status": 1,
      "audio": "AAAAAA..."
    }
  }
}
最后一帧数据：

{
  "header": {
    "app_id": "your_appid",
    "res_id": "hot_words",
    "status": 2
  },
  "payload": {
    "audio": {
      "encoding": "raw",
      "sample_rate": 16000,
      "channels": 1,
      "bit_depth": 16,
      "seq": 591,
      "status": 2,
      "audio": ""
    }
  }
}
#3、返回json示例
第一帧返回数据示例：

{
  "header": {
    "code": 0,
    "message": "success",
    "sid": "iat000e0044@hu18f5b16b0330324...",
    "status": 0
  }
}
中间帧返回数据示例：

{
  "header": {
    "code": 0,
    "message": "success",
    "sid": "iat000e0044@hu18f5b16b033032...",
    "status": 1
  },
  "payload": {
    "result": {
      "compress": "raw",
      "encoding": "utf8",
      "format": "json",
      "seq": 2,
      "status": 1,
      "text": "eyJzbiI6Miwib..."
    }
  }
}
最后一帧返回数据示例：

{
  "header": {
    "code": 0,
    "message": "success",
    "sid": "iat000e0044@hu18f5b16b033032...",
    "status": 2
  },
  "payload": {
    "result": {
      "compress": "raw",
      "encoding": "utf8",
      "format": "json",
      "seq": 76,
      "status": 2,
      "text": "eyJzbiI6NzYs..."
    }
  }
}
#六、参数说明
#1、请求参数说明
参数名	类型	必传	描述
header	object	是	用于上传平台参数
header.app_id	string	是	在平台申请的appid信息
header.res_id	string	否	应用级热词，用于提高相关词语识别权重（可直接在控制台  设置，并上传res_id）
header.status	int	是	音频传输状态 0:首帧 1：中间帧 2:最后一帧
parameter	object	是	用于上传服务特性参数
parameter.iat	object	是	服务名称，大模型中文语音识别
parameter.iat.domain	string	是	指定访问的领域，固定取值： slm
parameter.iat.language	string	是	语种 ，固定取值：zh_cn
parameter.iat.accent	string	是	口音， 固定取值：mandarin
parameter.iat.eos	int	否	静音多少秒停止识别 如6000毫秒
parameter.iat.ltc	int	否	是否进行中英文筛选，默认：1，不进行筛选 2，只出中文 3，只出英文
parameter.iat.vinfo	int	否	句子级别帧对齐
parameter.iat.dwa	string	否	动态修正控制：默认关闭 开启（wpgs）：实时返回识别结果，每次返回的结果可能是对之前结果的追加，也有可能是对之前结果的替换（即修正）； 关闭：实时返回识别结果，每次返回的结果都是对之前结果的追加； 开启后返回结果的颗粒度更小，视觉冲击效果更佳；
parameter.iat.dhw	string	否	会话热词，支持utf-8和gb2312； 取值样例：“dhw=gb2312;你好|大家”（对应gb2312编码）； “dhw=utf-8;你好|大家”（对应utf-8编码） 最小长度:0, 最大长度:1024
parameter.iat.result	obejct	否	响应数据字段
payload	object	是	请求数据携带
payload.audio	object	是	音频数据模块
payload.audio.encoding	string	是	音频编码格式，支持以下取值：
1. raw：代表 pcm 原始音频格式；
2. lame：代表 mp3音频格式（若 mp3 包含 ID3 头信息，需先移除，可参考 ffmpeg 命令：ffmpeg -i input.mp3 -map_metadata -1 -c:a copy output.mp3 完成移除）
payload.audio.sample_rate	int	否	音频采样率 16000, 8000
payload.audio.channels	int	否	音频声道 1
payload.audio.bit_depth	int	否	音频位深 16
payload.audio.seq	int	否	数据序号 0-999999
payload.audio.status	int	否	取值范围为：0（开始）、1（继续）、2（结束）
payload.audio.audio	string	是	音频数据base64 音频时长不要超过60秒
#2、返回参数说明
参数名	类型	描述
header	object	协议头部
header.message	string	描述信息
header.code	int	返回码 0表示会话调用成功（并不一定表示服务调用成功，服务是否调用成功以text字段中的ret为准） 其它表示会话调用异常
header.sid	string	本次会话id
header.status	int	数据状态 0:开始, 1:继续, 2:结束
payload	object	数据段，用于携带响应的数据
payload.result.compress	string	文本压缩格式
payload.result.encoding	string	文本编码
payload.result.format	string	文本格式
payload.result.seq	int	数据序号 0-999999
payload.result.status	int	0:开始, 1:继续, 2:结束
payload.result.text	string	听写数据文本 base64编码
text字段base64解码后参数说明请：

参数	类型	描述
sn	int	返回结果的序号
ls	bool	是否是最后一片结果
bg	int	保留字段，无需关心
ed	int	保留字段，无需关心
ws	array	听写结果
ws.bg	int	起始的端点帧偏移值，单位：帧（1帧=10ms） 注：以下两种情况下bg=0，无参考意义： 1)返回结果为标点符号或者为空；2)本次返回结果过长。
ws.cw	array	中文分词
ws.cw.w	string	字词
ws.cw.其他字段 sc/wb/wc/we/wp/ng/ph	int/string	均为保留字段，无需关心。如果解析sc字段，建议float与int数据类型都做兼容
#动态修正返回参数
若开通了动态修正功能并设置了dwa=wpgs（仅中文支持），还有如下字段返回： 注：动态修正结果解析可参考页面下方的java demo。

参数	类型	描述
data.result.pgs	string	开启wpgs会有此字段 取值为 "apd"时表示该片结果是追加到前面的最终结果；取值为"rpl" 时表示替换前面的部分结果，替换范围为rg字段
data.result.rg	array	替换范围，开启wpgs会有此字段 假设值为[2,5]，则代表要替换的是第2次到第5次返回的结果
#七、常见问题
#中英识别大模型与语音听写的区别？
答：中英识别大模型基于大模型进行的训练，数据量更丰富，听写效果上限更高，未来发展性更强。

#中英识别大模型支持多少分钟的音频识别？
答：支持1分钟以内的音频识别。

#中英识别大模型支持多少语种和方言？
答：支持中文和英文，还有202种方言，支持方言详细列表  。
