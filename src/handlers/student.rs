use actix_web::{web, HttpResponse, Responder, HttpMessage, HttpRequest};
use crate::models::{StudentQuery, CreateStudentRequest, UpdateStudentRequest, BatchImportStudentsRequest, StudentImportResult, StudentImportError};
use crate::services::StudentService;
use crate::state::AppState;
use crate::utils::response::{ApiResponse, ErrorResponse};
use crate::models::TokenInfo;
use calamine::{Reader, Xlsx};
use base64::{Engine as _, engine::general_purpose};
use std::io::Cursor;

#[derive(serde::Deserialize)]
pub struct PathId {
    pub id: i64,
}

pub async fn list(
    query: web::Query<StudentQuery>,
    state: web::Data<AppState>,
) -> impl Responder {
    let student_service = StudentService::new(&state);
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);
    let student_query = query.into_inner();

    match student_service.list_students(student_query).await {
        Ok((students, total)) => {
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "total": total,
                "page": page,
                "page_size": page_size,
                "items": students
            })))
        }
        Err(e) => {
            log::error!("查询学生列表失败: {}", e);
            HttpResponse::InternalServerError()
                .json(ErrorResponse::error("查询失败", Some(e.to_string())))
        }
    }
}

pub async fn get(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let student_service = StudentService::new(&state);

    match student_service.get_student(id).await {
        Ok(student) => HttpResponse::Ok().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("查询学生失败: {}", e);
            HttpResponse::NotFound()
                .json(ErrorResponse::error("学生不存在", None))
        }
    }
}

pub async fn create(
    req: HttpRequest,
    body: web::Json<CreateStudentRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let user_id = match req.extensions().get::<TokenInfo>() {
        Some(token_info) => token_info.user_id.to_string().parse().unwrap_or(1),
        None => 1,
    };
    
    let student_service = StudentService::new(&state);

    match student_service.create_student(user_id, body.into_inner()).await {
        Ok(student) => HttpResponse::Created().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("创建学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("创建失败", Some(e.to_string())))
        }
    }
}

pub async fn update(
    path: web::Path<PathId>,
    req: web::Json<UpdateStudentRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let student_service = StudentService::new(&state);

    match student_service.update_student(id, req.into_inner()).await {
        Ok(student) => HttpResponse::Ok().json(ApiResponse::success(student)),
        Err(e) => {
            log::error!("更新学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("更新失败", Some(e.to_string())))
        }
    }
}

pub async fn delete(
    path: web::Path<PathId>,
    state: web::Data<AppState>,
) -> impl Responder {
    let id = path.id;
    let student_service = StudentService::new(&state);

    match student_service.delete_student(id).await {
        Ok(_) => HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
            "message": "删除成功"
        }))),
        Err(e) => {
            log::error!("删除学生失败: {}", e);
            HttpResponse::BadRequest()
                .json(ErrorResponse::error("删除失败", Some(e.to_string())))
        }
    }
}

pub async fn batch_import_students(
    req: web::Json<BatchImportStudentsRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    log::info!("开始批量导入学生");

    let file_data = match general_purpose::STANDARD.decode(&req.file) {
        Ok(data) => data,
        Err(e) => {
            log::error!("文件解码失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("文件解码失败", Some(e.to_string())));
        }
    };

    let cursor = Cursor::new(file_data);
    let mut workbook: Xlsx<Cursor<Vec<u8>>> = match Xlsx::new(cursor) {
        Ok(wb) => wb,
        Err(e) => {
            log::error!("打开 Excel 文件失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("打开 Excel 文件失败", Some(e.to_string())));
        }
    };

    let range = match workbook.worksheet_range_at(0) {
        Some(Ok(r)) => r,
        Some(Err(e)) => {
            log::error!("读取工作表失败: {}", e);
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("读取工作表失败", Some(e.to_string())));
        }
        None => {
            log::error!("工作表为空");
            return HttpResponse::BadRequest()
                .json(ErrorResponse::error("工作表为空", None));
        }
    };

    let mut total = 0u32;
    let mut success = 0u32;
    let mut failed = 0u32;
    let mut errors = Vec::new();
    let student_service = StudentService::new(&state);

    for (row_idx, row) in range.rows().skip(1).enumerate() {
        total += 1;
        let row_num = (row_idx + 2) as u32;

        let student_request = match parse_student_row_from_vec(row) {
            Ok(s) => s,
            Err(e) => {
                failed += 1;
                errors.push(StudentImportError {
                    row: row_num,
                    message: e,
                });
                continue;
            }
        };

        match student_service.create_student(1, student_request).await {
            Ok(_) => success += 1,
            Err(e) => {
                failed += 1;
                errors.push(StudentImportError {
                    row: row_num,
                    message: format!("插入数据库失败: {}", e),
                });
            }
        }
    }

    let result = StudentImportResult {
        total,
        success,
        failed,
        errors,
    };

    log::info!("批量导入完成: 总数={}, 成功={}, 失败={}", total, success, failed);
    HttpResponse::Ok().json(ApiResponse::success(result))
}

pub fn parse_student_row_from_vec(row: &[calamine::Data]) -> Result<CreateStudentRequest, String> {
    if row.len() < 10 {
        return Err("列数不足，需要10列".to_string());
    }

    let get_string = |idx: usize| -> Option<String> {
        row.get(idx)
            .and_then(|cell| match cell {
                calamine::Data::String(s) => Some(s.trim().to_string()),
                calamine::Data::Float(f) => Some(f.to_string()),
                calamine::Data::Int(i) => Some(i.to_string()),
                calamine::Data::Bool(b) => Some(b.to_string()),
                calamine::Data::Empty => None,
                _ => None,
            })
            .filter(|s| !s.is_empty())
    };

    let get_opt_i64 = |idx: usize| -> Option<i64> {
        row.get(idx)
            .and_then(|cell| match cell {
                calamine::Data::Int(i) => Some(*i as i64),
                calamine::Data::Float(f) => Some(*f as i64),
                calamine::Data::String(s) => s.trim().parse::<i64>().ok(),
                _ => None,
            })
    };

    let name = get_string(0).ok_or("学生姓名不能为空")?;
    let education = get_string(1);
    let major = get_string(2);
    let graduation_year = get_opt_i64(3);
    let skills = get_string(4);
    let certificates = get_string(5);
    let soft_skills = get_string(6);
    let internship = get_string(7);
    let projects = get_string(8);
    let _ = get_string(9);

    Ok(CreateStudentRequest {
        name,
        education,
        major,
        graduation_year,
        skills,
        certificates,
        soft_skills,
        internship,
        projects,
    })
}

pub async fn download_student_template() -> impl Responder {
    use rust_xlsxwriter::*;

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let headers = vec![
        "姓名", "学历", "专业", "毕业年份", "技能", "证书", "软技能", "实习经历", "项目经验", "备注"
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string(0, col as u16, *header).unwrap();
    }

    let example = vec![
        "张三", "本科", "计算机科学与技术", "2024", "Golang,Python,MySQL", "无", "团队协作", "字节跳动实习", "电商系统开发", "优秀学生"
    ];

    for (col, value) in example.iter().enumerate() {
        worksheet.write_string(1, col as u16, *value).unwrap();
    }

    let buffer = workbook.save_to_buffer().unwrap();

    HttpResponse::Ok()
        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .append_header(("Content-Disposition", "attachment; filename=student_import_template.xlsx"))
        .body(buffer)
}

pub async fn export(state: web::Data<AppState>) -> impl Responder {
    use rust_xlsxwriter::*;

    let student_repo = crate::db::StudentRepository::new(state.mysql_pool.clone());
    let students = match student_repo.list_all().await {
        Ok(students) => students,
        Err(e) => {
            log::error!("导出学生数据失败: {}", e);
            return HttpResponse::InternalServerError()
                .json(ErrorResponse::error("获取学生数据失败", None));
        }
    };

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let headers = vec![
        "姓名", "学历", "专业", "毕业年份", "技能", "证书", "软技能", "实习经历", "项目经验", "备注"
    ];

    for (col, header) in headers.iter().enumerate() {
        if let Err(e) = worksheet.write_string(0, col as u16, *header) {
            log::warn!("写入表头失败: {}", e);
        }
    }

    for (row_idx, student) in students.iter().enumerate() {
        let row = (row_idx + 1) as u32;
        let graduation_year_str = student.graduation_year.map(|y| y.to_string());
        let values: Vec<Option<&str>> = vec![
            Some(&student.name),
            student.education.as_deref(),
            student.major.as_deref(),
            graduation_year_str.as_deref(),
            student.skills.as_deref(),
            student.certificates.as_deref(),
            student.soft_skills.as_deref(),
            student.internship.as_deref(),
            student.projects.as_deref(),
            None,
        ];
        for (col, value) in values.into_iter().enumerate() {
            if let Some(v) = value {
                if let Err(e) = worksheet.write_string(row, col as u16, v) {
                    log::warn!("写入单元格({},{})失败: {}", row, col, e);
                }
            }
        }
    }

    let buffer = match workbook.save_to_buffer() {
        Ok(buf) => buf,
        Err(e) => {
            log::error!("生成导出文件失败: {}", e);
            return HttpResponse::InternalServerError()
                .json(ErrorResponse::error("生成导出文件失败", None));
        }
    };

    HttpResponse::Ok()
        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .append_header(("Content-Disposition", "attachment; filename=students_export.xlsx"))
        .body(buffer)
}
