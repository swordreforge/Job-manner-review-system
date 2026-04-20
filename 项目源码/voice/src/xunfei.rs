use anyhow::{Context, Result};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use hmac::{Hmac, Mac};
// URL 编码暂时不需要，保留导入以备将来使用
// use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{debug, error, info, warn};
use url::Url;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone)]
pub struct XunfeiClient {
    app_id: String,
    api_key: String,
    api_secret: String,
    base_url: String,
}

#[derive(Debug, Serialize)]
struct XunfeiRequestHeader {
    app_id: String,
    status: i32,
}

#[derive(Debug, Serialize)]
struct XunfeiRequestParameter {
    iat: XunfeiRequestParameterIat,
}

#[derive(Debug, Serialize)]
struct XunfeiRequestParameterIat {
    domain: String,
    language: String,
    accent: String,
    eos: i32,
    dwa: String,
    result: XunfeiRequestParameterResult,
}

#[derive(Debug, Serialize)]
struct XunfeiRequestParameterResult {
    encoding: String,
    compress: String,
    format: String,
}

#[derive(Debug, Serialize)]
struct XunfeiRequestPayload {
    audio: XunfeiRequestPayloadAudio,
}

#[derive(Debug, Serialize)]
struct XunfeiRequestPayloadAudio {
    encoding: String,
    sample_rate: i32,
    channels: i32,
    bit_depth: i32,
    seq: i32,
    status: i32,
    audio: String,
}

#[derive(Debug, Serialize)]
struct XunfeiRequest {
    header: XunfeiRequestHeader,
    parameter: XunfeiRequestParameter,
    payload: XunfeiRequestPayload,
}

#[derive(Debug, Deserialize)]
struct XunfeiResponseHeader {
    code: i32,
    message: Option<String>,
    status: i32,
}

#[derive(Debug, Deserialize)]
struct XunfeiResponsePayloadResult {
    text: String,
}

#[derive(Debug, Deserialize)]
struct XunfeiResponsePayload {
    result: Option<XunfeiResponsePayloadResult>,
}

#[derive(Debug, Deserialize)]
struct XunfeiResponse {
    header: XunfeiResponseHeader,
    payload: Option<XunfeiResponsePayload>,
}

#[derive(Debug, Deserialize)]
struct XunfeiResultText {
    ws: Vec<XunfeiResultWord>,
}

#[derive(Debug, Deserialize)]
struct XunfeiResultWord {
    cw: Vec<XunfeiResultWordContent>,
}

#[derive(Debug, Deserialize)]
struct XunfeiResultWordContent {
    w: String,
}

impl XunfeiClient {
    pub fn new(app_id: String, api_key: String, api_secret: String) -> Self {
        XunfeiClient {
            app_id,
            api_key,
            api_secret,
            base_url: "wss://iat.xf-yun.com/v1".to_string(),
        }
    }

    /// 获取 APP ID
    pub fn get_app_id(&self) -> String {
        self.app_id.clone()
    }

    /// 生成鉴权 URL
    fn generate_auth_url(&self) -> Result<String> {
        // 获取 RFC1123 格式时间（UTC+0）
        let date = Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string();

        // 拼接签名字符串
        let signature_origin = format!(
            "host: iat.xf-yun.com\ndate: {}\nGET /v1 HTTP/1.1",
            date
        );

        // 使用 HMAC-SHA256 签名
        let mut mac = HmacSha256::new_from_slice(self.api_secret.as_bytes())
            .context("创建 HMAC 密钥失败")?;
        mac.update(signature_origin.as_bytes());
        let signature_bytes = mac.finalize().into_bytes();

        // Base64 编码
        let signature = BASE64.encode(signature_bytes);

        // 拼接 authorization_origin
        let authorization_origin = format!(
            r#"api_key="{}", algorithm="hmac-sha256", headers="host date request-line", signature="{}""#,
            self.api_key, signature
        );
        let authorization = BASE64.encode(authorization_origin);

        // 生成完整 URL（不进行 URL 编码，与 Python 版本保持一致）
        let url = format!(
            "{}?authorization={}&date={}&host=iat.xf-yun.com",
            self.base_url, authorization, date
        );

        debug!("生成鉴权 URL: {}", url);
        Ok(url)
    }

    /// 识别音频（流式发送）
    pub async fn transcribe_audio(&self, audio_data: Vec<u8>, sample_rate: i32) -> Result<String> {
        let url = self.generate_auth_url()?;
        let ws_url = Url::parse(&url).context("解析 WebSocket URL 失败")?;
        let app_id = self.app_id.clone();

        debug!("连接到讯飞星火 WebSocket...");
        debug!("音频数据大小: {} 字节", audio_data.len());
        debug!("采样率: {} Hz", sample_rate);
        debug!("APP ID: {}", app_id);

        let (ws_stream, _) = connect_async(&ws_url)
            .await
            .context("连接讯飞星火 WebSocket 失败，请检查网络连接和 API 密钥是否正确")?;

        let (mut write, mut read) = ws_stream.split();

        // 流式发送音频数据（不使用 spawn，直接发送）
        debug!("开始发送音频数据...");
        Self::send_audio_stream(
            &mut write,
            audio_data,
            sample_rate,
            &app_id,
        )
        .await
        .context("发送音频数据失败，请检查音频格式是否正确")?;

        debug!("音频数据发送完成，开始接收结果...");

        // 接收结果
        Self::receive_result(&mut read).await
    }

    /// 流式发送音频数据
    async fn send_audio_stream<S>(
        write: &mut S,
        audio_data: Vec<u8>,
        sample_rate: i32,
        app_id: &str,
    ) -> Result<()>
    where
        S: futures_util::Sink<Message> + Unpin,
        S::Error: std::error::Error + Send + Sync + 'static,
    {
        // 分包参数（根据讯飞星火文档建议）
        let frame_size = 1280; // 每次发送 1280 字节（对应 40ms 音频）
        let total_size = audio_data.len();
        let mut seq = 1;

        debug!("开始发送音频数据，总大小: {} 字节，帧大小: {}", total_size, frame_size);

        let total_frames = (total_size + frame_size - 1) / frame_size;
        for (i, chunk) in audio_data.chunks(frame_size).enumerate() {
            // 计算当前帧状态
            let status = if i == 0 {
                0 // 第一帧
            } else if i == total_frames - 1 {
                2 // 最后一帧
            } else {
                1 // 中间帧
            };

            debug!("发送第 {} 帧，状态: {}, 大小: {} 字节", i + 1, status, chunk.len());

            // 将音频转换为 base64
            let audio_base64 = BASE64.encode(chunk);

            // 构建数据帧
            let request = XunfeiRequest {
                header: XunfeiRequestHeader {
                    app_id: app_id.to_string(),
                    status,
                },
                parameter: XunfeiRequestParameter {
                    iat: XunfeiRequestParameterIat {
                        domain: "slm".to_string(),
                        language: "zh_cn".to_string(),
                        accent: "mandarin".to_string(),
                        eos: 6000,
                        dwa: "pgs".to_string(),
                        result: XunfeiRequestParameterResult {
                            encoding: "utf8".to_string(),
                            compress: "raw".to_string(),
                            format: "json".to_string(),
                        },
                    },
                },
                payload: XunfeiRequestPayload {
                    audio: XunfeiRequestPayloadAudio {
                        encoding: "raw".to_string(),
                        sample_rate,
                        channels: 1,
                        bit_depth: 16,
                        seq,
                        status,
                        audio: audio_base64,
                    },
                },
            };

            // 发送数据帧
            let json_data = serde_json::to_string(&request).context("序列化请求数据失败")?;
            write.send(Message::Text(json_data))
                .await
                .context("发送 WebSocket 消息失败")?;

            // 最后一帧后立即发送空帧（确保服务器知道结束）
            if status == 2 {
                let end_request = XunfeiRequest {
                    header: XunfeiRequestHeader {
                        app_id: app_id.to_string(),
                        status: 2,
                    },
                    parameter: XunfeiRequestParameter {
                        iat: XunfeiRequestParameterIat {
                            domain: "slm".to_string(),
                            language: "zh_cn".to_string(),
                            accent: "mandarin".to_string(),
                            eos: 6000,
                            dwa: "pgs".to_string(),
                            result: XunfeiRequestParameterResult {
                                encoding: "utf8".to_string(),
                                compress: "raw".to_string(),
                                format: "json".to_string(),
                            },
                        },
                    },
                    payload: XunfeiRequestPayload {
                        audio: XunfeiRequestPayloadAudio {
                            encoding: "raw".to_string(),
                            sample_rate,
                            channels: 1,
                            bit_depth: 16,
                            seq: seq + 1,
                            status: 2,
                            audio: String::new(),
                        },
                    },
                };

                let json_data =
                    serde_json::to_string(&end_request).context("序列化结束请求数据失败")?;
                write.send(Message::Text(json_data))
                    .await
                    .context("发送结束 WebSocket 消息失败")?;
            }

            seq += 1;

            // 模拟实时发送间隔（40ms）
            if status != 2 {
                tokio::time::sleep(tokio::time::Duration::from_millis(40)).await;
            }
        }

        debug!("音频数据发送完成");
        Ok(())
    }

    /// 接收识别结果
    async fn receive_result<R>(read: &mut R) -> Result<String>
    where
        R: futures_util::Stream<Item = Result<Message, tokio_tungstenite::tungstenite::Error>>
            + Unpin,
    {
        let mut full_text = String::new();
        let mut message_count = 0;

        debug!("开始接收识别结果...");

        loop {
            match read.next().await {
                Some(Ok(message)) => {
                    message_count += 1;
                    match message {
                        Message::Text(text) => {
                            debug!("收到第 {} 条消息，长度: {} 字节", message_count, text.len());

                            let response: XunfeiResponse =
                                serde_json::from_str(&text).context("解析响应数据失败")?;

                            debug!("响应状态: code={}, status={}", response.header.code, response.header.status);

                            // 检查 header 中的 code
                            if response.header.code != 0 {
                                let error_msg = response
                                    .header
                                    .message
                                    .unwrap_or_else(|| "未知错误".to_string());
                                let error_detail = format!(
                                    "讯飞星火返回错误: {} (code: {})\n完整响应: {}",
                                    error_msg,
                                    response.header.code,
                                    text
                                );
                                error!("{}", error_detail);
                                return Err(anyhow::anyhow!("{}", error_detail));
                            }

                            // 检查是否结束
                            if response.header.status == 2 {
                                debug!("收到最后一帧消息");
                                if let Some(payload) = response.payload {
                                    if let Some(result) = payload.result {
                                        if !result.text.is_empty() {
                                            let text_json = BASE64
                                                .decode(&result.text)
                                                .context("解码结果文本失败")?;
                                            let text_str =
                                                String::from_utf8(text_json)
                                                    .context("结果文本 UTF-8 解码失败")?;

                                            let result_data: XunfeiResultText =
                                                serde_json::from_str(&text_str)
                                                    .context("解析结果数据失败")?;

                                            for ws in result_data.ws {
                                                for cw in ws.cw {
                                                    full_text.push_str(&cw.w);
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            } else {
                                // 中间帧也可能有结果
                                if let Some(payload) = response.payload {
                                    if let Some(result) = payload.result {
                                        if !result.text.is_empty() {
                                            let text_json = BASE64
                                                .decode(&result.text)
                                                .context("解码中间结果文本失败")?;
                                            let text_str =
                                                String::from_utf8(text_json)
                                                    .context("中间结果文本 UTF-8 解码失败")?;

                                            let result_data: XunfeiResultText =
                                                serde_json::from_str(&text_str)
                                                    .context("解析中间结果数据失败")?;

                                            for ws in result_data.ws {
                                                for cw in ws.cw {
                                                    full_text.push_str(&cw.w);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Message::Close(_) => {
                            debug!("WebSocket 连接关闭");
                            break;
                        }
                        _ => {
                            warn!("收到非文本消息");
                        }
                    }
                }
                Some(Err(e)) => {
                    error!("接收消息失败: {}", e);
                    return Err(anyhow::anyhow!("接收消息失败: {}", e));
                }
                None => {
                    debug!("消息流结束");
                    break;
                }
            }
        }

        info!("识别完成: {} 字符", full_text.len());
        Ok(full_text)
    }
}
