use actix_web::{web, HttpResponse, Responder};

pub async fn list(_query: web::Query<serde_json::Value>) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": {
            "total": 0,
            "page": 1,
            "page_size": 20,
            "items": []
        }
    }))
}

pub async fn get(_path: web::Path<String>) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "code": 200,
        "message": "success",
        "data": null
    }))
}