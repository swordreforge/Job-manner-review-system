use actix_web::{HttpResponse, Result};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "template/"]
struct Asset;

/// 返回嵌入的 index.html 文件
pub async fn serve_index() -> Result<HttpResponse> {
    match Asset::get("index.html") {
        Some(content) => {
            Ok(HttpResponse::Ok()
                .content_type("text/html")
                .body(content.data.to_vec()))
        }
        None => Ok(HttpResponse::NotFound().finish()),
    }
}