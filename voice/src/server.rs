use crate::audio::{convert_to_pcm, validate_audio_size};
use crate::config::Config;
use crate::html::get_html_content;
use crate::xunfei::XunfeiClient;
use anyhow::{Context, Result};
use axum::{
    body::Body,
    extract::{Multipart, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json, Response},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{debug, error, info};

/// 安全地截取字符串前 n 个字节（确保在字符边界上）
fn safe_truncate(s: &str, n: usize) -> &str {
    if n >= s.len() {
        return s;
    }
    // 找到第 n 个字节位置最近的有效字符边界
    match s.char_indices().nth(n) {
        Some((pos, _)) => &s[..pos],
        None => s,
    }
}

pub struct AppState {
    pub xunfei_client: Arc<XunfeiClient>,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    model: String,
    model_loaded: bool,
    app_id: String,
}

#[derive(Debug, Serialize)]
struct TranscribeResponse {
    text: String,
    language: String,
    model: String,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    detail: String,
}

#[derive(Debug, Deserialize)]
struct ChangeModelRequest {
    model: String,
}

#[derive(Debug, Serialize)]
struct ChangeModelResponse {
    message: String,
    model: String,
}

/// 返回首页 HTML
async fn root() -> impl IntoResponse {
    let html = get_html_content();
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(Body::from(html))
        .unwrap()
}

/// 健康检查
async fn health_check(State(app_state): State<Arc<AppState>>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        model: "xunfei-slm".to_string(),
        model_loaded: true,
        app_id: app_state.xunfei_client.get_app_id(),
    })
}

/// 识别上传的音频文件
async fn transcribe_audio(
    State(app_state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    // 读取上传的文件
    let mut audio_data: Option<Vec<u8>> = None;
    let mut filename: String = "upload.wav".to_string();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| internal_error(format!("读取上传文件失败: {}", e)))?
    {
        let name = field.name().unwrap_or("unknown").to_string();
        debug!("处理字段: {}", name);

        if name == "file" {
            filename = field
                .file_name()
                .unwrap_or("upload.wav")
                .to_string();

            audio_data = field
                .bytes()
                .await
                .map(|b| b.to_vec())
                .ok();

            break;
        }
    }

    // 检查是否读取到音频数据
    let audio_data = audio_data.ok_or_else(|| {
        bad_request("未上传音频文件".to_string())
    })?;

    // 检查音频数据是否为空
    if audio_data.is_empty() {
        return Err(bad_request("音频数据为空".to_string()));
    }

    // 检查音频数据大小（限制 60 秒）
    if let Err(e) = validate_audio_size(&audio_data, 60) {
        return Err(bad_request(e.to_string()));
    }

    info!(
        "开始识别音频: {}, 大小: {} 字节",
        filename,
        audio_data.len()
    );

    // 转换音频格式
    let pcm_data = convert_to_pcm(audio_data.clone(), &filename)
        .context("音频格式转换失败")
        .map_err(|e| internal_error(e.to_string()))?;

    // 调用讯飞星火识别
    let text = app_state
        .xunfei_client
        .transcribe_audio(pcm_data, 16000)
        .await
        .map_err(|e| {
            // 构建完整的错误信息链
            let mut error_chain = String::new();
            let mut current = Some(e.as_ref() as &dyn std::error::Error);
            let mut first = true;
            while let Some(cause) = current {
                if !first {
                    error_chain.push_str(" -> ");
                }
                error_chain.push_str(&cause.to_string());
                current = cause.source();
                first = false;
            }
            internal_error(format!("讯飞星火识别失败: {}", error_chain))
        })?;

    // 检查识别结果
    if text.trim().is_empty() {
        return Err(bad_request("未识别到有效语音内容".to_string()));
    }

    // 安全地截取前 50 个字节（确保在字符边界上）
    let preview = safe_truncate(&text, 50);
    info!("识别成功: {}...", preview);

    Ok(Json(TranscribeResponse {
        text: text.trim().to_string(),
        language: "zh_cn".to_string(),
        model: "xunfei-slm".to_string(),
    }))
}

/// 切换模型（保留接口以兼容，讯飞星火不支持切换模型）
async fn change_model(
    Json(request): Json<ChangeModelRequest>,
) -> Json<ChangeModelResponse> {
    if request.model != "xunfei" {
        debug!(
            "尝试切换到模型 {}，但讯飞星火不支持模型切换",
            request.model
        );
        return Json(ChangeModelResponse {
            message: "讯飞星火不支持模型切换，使用默认模型".to_string(),
            model: "xunfei-slm".to_string(),
        });
    }

    Json(ChangeModelResponse {
        message: "使用讯飞星火语音识别模型".to_string(),
        model: "xunfei-slm".to_string(),
    })
}

/// 错误处理函数
fn bad_request(message: String) -> (StatusCode, Json<ErrorResponse>) {
    (StatusCode::BAD_REQUEST, Json(ErrorResponse { detail: message }))
}

fn internal_error(message: String) -> (StatusCode, Json<ErrorResponse>) {
    error!("内部错误: {}", message);
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse { detail: message }),
    )
}

/// 启动 Web 服务器
pub async fn run_server(xunfei_client: XunfeiClient, config: Config) -> Result<()> {
    let app_state = Arc::new(AppState {
        xunfei_client: Arc::new(xunfei_client),
    });

    // 构建 Router
    let app = Router::new()
        .route("/", get(root))
        .route("/transcribe", post(transcribe_audio))
        .route("/change-model", post(change_model))
        .route("/health", get(health_check))
        .with_state(app_state)
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any),
        )
        .layer(tower_http::trace::TraceLayer::new_for_http());

    let addr = format!("{}:{}", config.server_host, config.server_port);
    info!("服务器监听: {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .context("绑定 TCP 监听器失败")?;

    axum::serve(listener, app)
        .await
        .context("启动服务器失败")?;

    Ok(())
}