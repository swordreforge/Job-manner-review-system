use actix_web::{HttpResponse, Result, web};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "template/"]
struct Asset;

/// 根据文件扩展名获取 Content-Type
fn get_content_type(path: &str) -> &'static str {
    match path.rsplit('.').next() {
        Some("html") => "text/html",
        Some("css") => "text/css",
        Some("js") => "application/javascript",
        Some("json") => "application/json",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("svg") => "image/svg+xml",
        Some("woff") => "font/woff",
        Some("woff2") => "font/woff2",
        Some("ttf") => "font/ttf",
        Some("eot") => "application/vnd.ms-fontobject",
        _ => "application/octet-stream",
    }
}

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

/// 通用静态文件处理器
pub async fn serve_static(path: web::Path<String>) -> Result<HttpResponse> {
    let file_path = path.as_str();

    match Asset::get(file_path) {
        Some(content) => {
            let content_type = get_content_type(file_path);
            Ok(HttpResponse::Ok()
                .content_type(content_type)
                .body(content.data.to_vec()))
        }
        None => Ok(HttpResponse::NotFound().finish()),
    }
}