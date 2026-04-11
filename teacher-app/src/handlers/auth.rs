use actix_web::{web, HttpResponse, Responder};

pub async fn login(_req: web::Json<serde_json::Value>) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": {
            "token": "placeholder_token",
            "user": {
                "id": "1",
                "username": "teacher",
                "name": "教师"
            }
        }
    }))
}