use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: u16,
    pub message: String,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            code: 200,
            message: "success".to_string(),
            data: Some(data),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub code: u16,
    pub message: String,
    pub error: Option<String>,
}

impl ErrorResponse {
    pub fn error(message: &str, error: Option<String>) -> Self {
        ErrorResponse {
            code: 400,
            message: message.to_string(),
            error,
        }
    }
}
