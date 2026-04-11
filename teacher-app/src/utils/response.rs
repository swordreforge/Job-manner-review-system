use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use serde::Serialize;
use std::fmt;

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

    pub fn success_with_message(data: T, message: &str) -> Self {
        ApiResponse {
            code: 200,
            message: message.to_string(),
            data: Some(data),
        }
    }

    pub fn error(code: u16, message: &str) -> Self {
        ApiResponse {
            code,
            message: message.to_string(),
            data: None,
        }
    }
}

#[derive(Debug)]
pub struct ApiError {
    pub status_code: StatusCode,
    pub message: String,
}

impl ApiError {
    pub fn new(status_code: StatusCode, message: &str) -> Self {
        ApiError {
            status_code,
            message: message.to_string(),
        }
    }

    pub fn bad_request(message: &str) -> Self {
        ApiError::new(StatusCode::BAD_REQUEST, message)
    }

    pub fn not_found(message: &str) -> Self {
        ApiError::new(StatusCode::NOT_FOUND, message)
    }

    pub fn internal_error(message: &str) -> Self {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, message)
    }

    pub fn unauthorized(message: &str) -> Self {
        ApiError::new(StatusCode::UNAUTHORIZED, message)
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}: {}", self.status_code, self.message)
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        self.status_code
    }

    fn error_response(&self) -> HttpResponse {
        let error_response = ApiResponse::<()>::error(
            self.status_code.as_u16(),
            &self.message,
        );

        HttpResponse::build(self.status_code()).json(error_response)
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError::internal_error(&err.to_string())
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        ApiError::internal_error(&format!("Database error: {}", err))
    }
}