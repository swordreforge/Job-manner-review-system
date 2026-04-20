# 批量导入功能实现指南

本文档详细说明了如何在 Rust (teacher-app) 中实现批量导入功能，支持企业常用的 xlsx 和 csv 文件格式。

## 目录

- [依赖库](#依赖库)
- [功能概述](#功能概述)
- [实现步骤](#实现步骤)
- [代码示例](#代码示例)
- [API 接口](#api-接口)
- [前端集成](#前端集成)
- [测试计划](#测试计划)
- [注意事项](#注意事项)

## 依赖库

### Cargo.toml 配置

```toml
[dependencies]
# 现有依赖
actix-web = "4.9"
actix-cors = "0.7"
actix-files = "0.6"
actix-multipart = "0.7"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "mysql", "sqlite", "chrono", "uuid"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
anyhow = "1.0"

# 批量导入专用依赖
calamine = "0.24"              # Excel 文件读取（.xlsx, .xls, .csv）
rust_xlsxwriter = "0.78"       # Excel 文件写入（生成模板）
csv = "1.3"                    # CSV 文件读写
```

### 库对比

| 库 | 版本 | 用途 | 优点 | 缺点 |
|------|------|------|------|------|
| **calamine** | 0.24 | 读取 Excel/CSV | 支持多种格式，性能好 | 写入功能较弱 |
| **rust_xlsxwriter** | 0.78 | 生成 Excel | 支持样式，质量高 | 只支持 .xlsx |
| **csv** | 1.3 | 读写 CSV | 类型安全，自动反序列化 | 只支持 CSV |

## 功能概述

### 支持的文件格式

1. **Excel 文件** (.xlsx, .xls)
   - 多工作表支持
   - 自动识别标题行
   - 支持数据类型：字符串、数字、布尔值

2. **CSV 文件** (.csv)
   - UTF-8 编码
   - 自动分隔符识别
   - 类型安全的数据解析

### 核心功能

- ✅ 文件上传（支持 xlsx, xls, csv）
- ✅ 自动格式识别
- ✅ 数据验证和清洗
- ✅ 批量插入数据库
- ✅ 导入结果统计（成功/失败数量）
- ✅ 详细错误信息反馈
- ✅ 下载导入模板

### 导入结果统计

```json
{
  "code": 200,
  "msg": "导入成功",
  "data": {
    "total": 150,
    "success": 145,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "error": "岗位名称不能为空"
      },
      {
        "row": 25,
        "error": "薪资格式错误"
      }
    ]
  }
}
```

## 实现步骤

### 步骤 1: 创建数据模型

创建导入数据的结构体定义。

### 步骤 2: 实现文件解析器

实现 Excel 和 CSV 文件的解析逻辑。

### 步骤 3: 创建批量导入服务

实现数据验证和批量插入逻辑。

### 步骤 4: 添加 API 接口

创建文件上传和导入的 HTTP 接口。

### 步骤 5: 生成导入模板

实现 Excel 模板的生成功能。

### 步骤 6: 前端集成

添加文件上传界面和结果展示。

## 代码示例

### 1. 数据模型

创建 `src/models/batch_import.rs`:

```rust
use serde::Deserialize;
use chrono::{DateTime, Utc};

/// 岗位批量导入数据结构
#[derive(Debug, Deserialize, Clone)]
pub struct JobImportData {
    /// 岗位名称（必填）
    #[serde(rename(deserialize = "岗位名称"))]
    pub name: String,
    
    /// 描述
    #[serde(rename(deserialize = "描述"))]
    pub description: Option<String>,
    
    /// 公司名称
    #[serde(rename(deserialize = "公司"))]
    pub company: Option<String>,
    
    /// 行业
    #[serde(rename(deserialize = "行业"))]
    pub industry: Option<String>,
    
    /// 类别
    #[serde(rename(deserialize = "类别"))]
    pub category: Option<String>,
    
    /// 地点
    #[serde(rename(deserialize = "地点"))]
    pub location: Option<String>,
    
    /// 薪资范围
    #[serde(rename(deserialize = "薪资范围"))]
    pub salary_range: Option<String>,
    
    /// 技能要求
    #[serde(rename(deserialize = "技能要求"))]
    pub skills: Option<String>,
    
    /// 证书要求
    #[serde(rename(deserialize = "证书要求"))]
    pub certificates: Option<String>,
    
    /// 软技能
    #[serde(rename(deserialize = "软技能"))]
    pub soft_skills: Option<String>,
    
    /// 岗位要求
    #[serde(rename(deserialize = "岗位要求"))]
    pub requirements: Option<String>,
    
    /// 成长潜力
    #[serde(rename(deserialize = "成长潜力"))]
    pub growth_potential: Option<String>,
}

/// 导入结果统计
#[derive(Debug, serde::Serialize)]
pub struct ImportStats {
    pub total: usize,
    pub success: usize,
    pub failed: usize,
    pub errors: Vec<ImportError>,
}

/// 导入错误信息
#[derive(Debug, serde::Serialize)]
pub struct ImportError {
    pub row: usize,
    pub error: String,
}

impl JobImportData {
    /// 验证数据
    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("岗位名称不能为空".to_string());
        }
        
        if self.name.len() > 200 {
            return Err("岗位名称长度不能超过200字符".to_string());
        }
        
        Ok(())
    }
}
```

### 2. Excel 解析器

创建 `src/utils/excel_parser.rs`:

```rust
use anyhow::{Result, Context};
use calamine::{Reader, open_workbook, Xlsx, DataType, open_workbook_from_path};

use crate::models::batch_import::JobImportData;

/// 解析 Excel 文件
pub fn parse_excel_file(file_path: &str) -> Result<Vec<JobImportData>> {
    let mut workbook: Xlsx<_> = open_workbook_from_path(file_path)
        .context("无法打开 Excel 文件")?;
    
    // 获取第一个工作表
    let range = workbook.worksheet_range_at(0)
        .ok_or_else(|| anyhow::anyhow!("找不到工作表"))?
        .context("无法读取工作表")?;
    
    let mut jobs = Vec::new();
    let mut errors = Vec::new();
    
    // 从第二行开始读取（第一行是标题）
    for (row_idx, row) in range.rows().enumerate().skip(1) {
        // 跳过空行
        if row.is_empty() {
            continue;
        }
        
        match parse_excel_row(row, row_idx + 2) {
            Ok(job) => jobs.push(job),
            Err(e) => errors.push((row_idx + 2, e)),
        }
    }
    
    if !errors.is_empty() {
        let error_msgs: Vec<String> = errors.iter()
            .map(|(row, err)| format!("行 {}: {}", row, err))
            .collect();
        anyhow::bail!("解析错误:\n{}", error_msgs.join("\n"));
    }
    
    Ok(jobs)
}

/// 解析 Excel 行数据
fn parse_excel_row(row: &[DataType], row_number: usize) -> Result<JobImportData> {
    let get_cell = |idx: usize| -> Result<String> {
        match row.get(idx) {
            Some(DataType::String(s)) => Ok(s.clone()),
            Some(DataType::Int(i)) => Ok(i.to_string()),
            Some(DataType::Float(f)) => Ok(f.to_string()),
            Some(DataType::Bool(b)) => Ok(b.to_string()),
            Some(DataType::Empty) => Ok(String::new()),
            Some(DataType::DateTime(dt)) => Ok(dt.to_string()),
            Some(DataType::Duration(_)) => Ok(String::new()),
            None => Ok(String::new()),
        }
    };
    
    let job = JobImportData {
        name: get_cell(0)?,
        description: if row.len() > 1 { get_cell(1)?.ok() } else { None },
        company: if row.len() > 2 { get_cell(2)?.ok() } else { None },
        industry: if row.len() > 3 { get_cell(3)?.ok() } else { None },
        category: if row.len() > 4 { get_cell(4)?.ok() } else { None },
        location: if row.len() > 5 { get_cell(5)?.ok() } else { None },
        salary_range: if row.len() > 6 { get_cell(6)?.ok() } else { None },
        skills: if row.len() > 7 { get_cell(7)?.ok() } else { None },
        certificates: if row.len() > 8 { get_cell(8)?.ok() } else { None },
        soft_skills: if row.len() > 9 { get_cell(9)?.ok() } else { None },
        requirements: if row.len() > 10 { get_cell(10)?.ok() } else { None },
        growth_potential: if row.len() > 11 { get_cell(11)?.ok() } else { None },
    };
    
    job.validate().map_err(|e| anyhow::anyhow!("行 {}: {}", row_number, e))?;
    
    Ok(job)
}
```

### 3. CSV 解析器

创建 `src/utils/csv_parser.rs`:

```rust
use anyhow::Result;
use csv::ReaderBuilder;
use serde::Deserialize;
use std::io::Read;

use crate::models::batch_import::JobImportData;

/// 解析 CSV 文件
pub fn parse_csv_file<R: Read>(reader: R) -> Result<Vec<JobImportData>> {
    let mut rdr = ReaderBuilder::new()
        .has_headers(true)  // 第一行是标题
        .trim(true)
        .flexible(true)    // 允许列数不一致
        .from_reader(reader);
    
    let mut jobs = Vec::new();
    let mut errors = Vec::new();
    
    for (idx, result) in rdr.deserialize().enumerate() {
        match result {
            Ok(mut job) => {
                // 验证数据
                if let Err(e) = job.validate() {
                    errors.push((idx + 2, e)); // +2 因为从第2行开始
                } else {
                    jobs.push(job);
                }
            }
            Err(e) => {
                errors.push((idx + 2, e.to_string()));
            }
        }
    }
    
    if !errors.is_empty() {
        let error_msgs: Vec<String> = errors.iter()
            .map(|(row, err)| format!("行 {}: {}", row, err))
            .collect();
        anyhow::bail!("解析错误:\n{}", error_msgs.join("\n"));
    }
    
    Ok(jobs)
}
```

### 4. 模板生成器

创建 `src/utils/template_generator.rs`:

```rust
use anyhow::Result;
use rust_xlsxwriter::*;

/// 生成岗位导入模板
pub fn generate_job_import_template() -> Result<Vec<u8>> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet(Some("岗位导入模板"));
    
    // 设置标题行格式
    let header_format = Format::new()
        .set_bold(true)
        .set_bg_color(Color::RGB(0x4F, 0x81, 0xBD))
        .set_font_color(Color::White)
        .set_align(FormatAlign::Center)
        .set_border(Border::Thin)
        .set_text_wrap(true);
    
    // 设置数据格式
    let data_format = Format::new()
        .set_border(Border::Thin)
        .set_text_wrap(true);
    
    // 列标题
    let headers = vec![
        "岗位名称*", "描述", "公司", "行业", "类别", 
        "地点", "薪资范围", "技能要求", "证书要求", 
        "软技能", "岗位要求", "成长潜力"
    ];
    
    // 设置列宽
    let column_widths = vec![25, 30, 20, 15, 15, 20, 15, 25, 20, 20, 30, 25];
    
    // 写入标题行
    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string_with_format(0, col as u16, header, &header_format)?;
        worksheet.set_column_width(col as u16, col as u16, column_widths[col])?;
    }
    
    // 写入示例数据
    let example_data = vec![
        "Golang后端开发工程师", 
        "负责公司后端服务开发，参与微服务架构设计与实现", 
        "字节跳动", 
        "技术", 
        "后端",
        "北京", 
        "15000-30000", 
        "Golang,MySQL,Redis", 
        "无", 
        "沟通能力,团队合作", 
        "熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构", 
        "技术专家"
    ];
    
    for (col, data) in example_data.iter().enumerate() {
        worksheet.write_string_with_format(1, col as u16, data, &data_format)?;
    }
    
    // 添加说明
    let note_format = Format::new()
        .set_font_color(Color::RGB(0xFF, 0x00, 0x00))
        .set_italic(true);
    
    worksheet.write_string_with_format(
        3, 
        0, 
        "说明：标有 * 的字段为必填项，其他为可选项。删除示例数据后填写您的数据。", 
        &note_format
    )?;
    
    // 生成字节数组
    let mut buf = Vec::new();
    workbook.save_to_buffer(&mut buf)?;
    
    Ok(buf)
}
```

### 5. 批量导入服务

创建 `src/services/batch_import_service.rs`:

```rust
use anyhow::Result;
use sqlx::MySqlPool;

use crate::models::batch_import::{JobImportData, ImportStats, ImportError};
use crate::utils::excel_parser::parse_excel_file;
use crate::utils::csv_parser::parse_csv_file;

pub struct BatchImportService {
    pool: MySqlPool,
}

impl BatchImportService {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }
    
    /// 批量导入岗位
    pub async fn import_jobs(&self, jobs: Vec<JobImportData>) -> Result<ImportStats> {
        let total = jobs.len();
        let mut success = 0;
        let mut failed = 0;
        let mut errors = Vec::new();
        
        let now = chrono::Utc::now().timestamp();
        
        // 批量插入 SQL
        let mut insert_sql = String::from(
            "INSERT INTO jobs (name, description, company, industry, category, location, \
             salary_range, skills, certificates, soft_skills, requirements, growth_potential, \
             created_at, updated_at) VALUES "
        );
        
        let mut values: Vec<String> = Vec::new();
        let mut params: Vec<String> = Vec::new();
        
        for (idx, job) in jobs.iter().enumerate() {
            // 数据验证
            if let Err(e) = job.validate() {
                failed += 1;
                errors.push(ImportError {
                    row: idx + 2, // +2 因为从第2行开始（第1行是标题）
                    error: e,
                });
                continue;
            }
            
            // 构建 VALUES 部分
            let value = format!(
                "(?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{}, ?{})",
                values.len() * 12 + 1,
                values.len() * 12 + 2,
                values.len() * 12 + 3,
                values.len() * 12 + 4,
                values.len() * 12 + 5,
                values.len() * 12 + 6,
                values.len() * 12 + 7,
                values.len() * 12 + 8,
                values.len() * 12 + 9,
                values.len() * 12 + 10,
                values.len() * 12 + 11,
                values.len() * 12 + 12
            );
            
            values.push(value);
            
            // 收集参数
            params.push(job.name.clone());
            params.push(job.description.clone().unwrap_or_default());
            params.push(job.company.clone().unwrap_or_default());
            params.push(job.industry.clone().unwrap_or_default());
            params.push(job.category.clone().unwrap_or_default());
            params.push(job.location.clone().unwrap_or_default());
            params.push(job.salary_range.clone().unwrap_or_default());
            params.push(job.skills.clone().unwrap_or_default());
            params.push(job.certificates.clone().unwrap_or_default());
            params.push(job.soft_skills.clone().unwrap_or_default());
            params.push(job.requirements.clone().unwrap_or_default());
            params.push(job.growth_potential.clone().unwrap_or_default());
            params.push(now.to_string());
            params.push(now.to_string());
            
            success += 1;
        }
        
        if success > 0 {
            insert_sql.push_str(&values.join(", "));
            
            // 执行批量插入
            let mut query = sqlx::query(&insert_sql);
            for param in params {
                query = query.bind(param);
            }
            
            if let Err(e) = query.execute(&self.pool).await {
                anyhow::bail!("批量插入失败: {}", e);
            }
        }
        
        Ok(ImportStats {
            total,
            success,
            failed,
            errors,
        })
    }
    
    /// 从文件导入岗位
    pub async fn import_from_file(&self, file_path: &str) -> Result<ImportStats> {
        let file_ext = std::path::Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        let jobs = match file_ext.to_lowercase().as_str() {
            "xlsx" | "xls" => parse_excel_file(file_path)?,
            "csv" => {
                let content = std::fs::read_to_string(file_path)?;
                let cursor = std::io::Cursor::new(content);
                parse_csv_file(cursor)?
            }
            _ => anyhow::bail!("不支持的文件格式: {}", file_ext),
        };
        
        self.import_jobs(jobs).await
    }
}
```

### 6. API Handler

创建 `src/handlers/batch_import.rs`:

```rust
use actix_multipart::Multipart;
use actix_web::{web, HttpResponse, Responder};
use futures_util::TryStreamExt;
use std::io::Cursor;

use crate::state::AppState;
use crate::services::batch_import_service::BatchImportService;
use crate::utils::template_generator::generate_job_import_template;
use crate::utils::response::{ApiResponse, ErrorResponse};

/// 批量导入岗位
pub async fn batch_import_jobs(
    mut payload: Multipart,
    state: web::Data<AppState>,
) -> impl Responder {
    let mut file_content: Vec<u8> = Vec::new();
    let mut file_name: String = String::new();
    
    // 处理上传的文件
    while let Some(mut field) = payload.try_next().await.unwrap() {
        let content_disposition = field.content_disposition();
        
        if let Some(filename) = content_disposition.get_filename() {
            file_name = filename.to_string();
            
            // 验证文件大小（限制为 10MB）
            let mut size = 0;
            const MAX_SIZE: usize = 10 * 1024 * 1024; // 10MB
            
            while let Some(chunk) = field.try_next().await.unwrap() {
                size += chunk.len();
                if size > MAX_SIZE {
                    return HttpResponse::BadRequest().json(ErrorResponse::error(
                        "文件大小超过限制（最大 10MB）",
                        None
                    ));
                }
                file_content.extend_from_slice(&chunk);
            }
        }
    }
    
    if file_content.is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse::error(
            "未找到上传的文件",
            None
        ));
    }
    
    // 验证文件类型
    let file_ext = std::path::Path::new(&file_name)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    
    if !["xlsx", "xls", "csv"].contains(&file_ext.to_lowercase().as_str()) {
        return HttpResponse::BadRequest().json(ErrorResponse::error(
            "不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件",
            None
        ));
    }
    
    // 保存临时文件
    let temp_path = format!("/tmp/job_import_{}.{}", uuid::Uuid::new_v4(), file_ext);
    if let Err(e) = std::fs::write(&temp_path, &file_content) {
        return HttpResponse::InternalServerError().json(ErrorResponse::error(
            "保存文件失败",
            Some(e.to_string())
        ));
    }
    
    // 解析文件并导入
    let import_service = BatchImportService::new(state.mysql_pool.clone());
    
    match import_service.import_from_file(&temp_path).await {
        Ok(stats) => {
            // 清理临时文件
            let _ = std::fs::remove_file(&temp_path);
            
            HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
                "message": "导入完成",
                "total": stats.total,
                "success": stats.success,
                "failed": stats.failed,
                "errors": stats.errors
            })))
        }
        Err(e) => {
            // 清理临时文件
            let _ = std::fs::remove_file(&temp_path);
            
            HttpResponse::BadRequest().json(ErrorResponse::error(
                "导入失败",
                Some(e.to_string())
            ))
        }
    }
}

/// 下载导入模板
pub async fn download_import_template() -> impl Responder {
    match generate_job_import_template() {
        Ok(template) => {
            HttpResponse::Ok()
                .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .insert_header(("Content-Disposition", "attachment; filename=\"岗位导入模板.xlsx\""))
                .body(template)
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(ErrorResponse::error(
                "生成模板失败",
                Some(e.to_string())
            ))
        }
    }
}
```

### 7. 添加路由

在 `src/routes.rs` 中添加：

```rust
// 批量导入相关路由
.route("/jobs/batch-import", web::post().to(handlers::batch_import::batch_import_jobs))
.route("/jobs/import-template", web::get().to(handlers::batch_import::download_import_template))
```

### 8. 更新模块导出

在各个 `mod.rs` 中添加新模块：

**src/models/mod.rs**:
```rust
pub mod batch_import;
pub use batch_import::{JobImportData, ImportStats, ImportError};
```

**src/utils/mod.rs**:
```rust
pub mod excel_parser;
pub mod csv_parser;
pub mod template_generator;

pub use excel_parser::parse_excel_file;
pub use csv_parser::parse_csv_file;
pub use template_generator::generate_job_import_template;
```

**src/handlers/mod.rs**:
```rust
pub mod batch_import;
pub use batch_import::{batch_import_jobs, download_import_template};
```

**src/services/mod.rs**:
```rust
pub mod batch_import_service;
pub use batch_import_service::BatchImportService;
```

## API 接口

### 1. 批量导入岗位

**请求**:
```
POST /api/v1/jobs/batch-import
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <文件内容>
```

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "message": "导入完成",
    "total": 150,
    "success": 145,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "error": "岗位名称不能为空"
      },
      {
        "row": 25,
        "error": "岗位名称长度不能超过200字符"
      }
    ]
  }
}
```

### 2. 下载导入模板

**请求**:
```
GET /api/v1/jobs/import-template
Authorization: Bearer <token>
```

**响应**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Body: Excel 文件二进制数据

## 前端集成

### HTML 结构

```html
<div class="batch-import-section">
    <h3>批量导入岗位</h3>
    
    <div class="import-actions">
        <button id="download-template-btn" class="btn btn-secondary">
            📥 下载导入模板
        </button>
        
        <label class="btn btn-primary">
            📤 选择文件
            <input type="file" id="import-file" accept=".xlsx,.xls,.csv" style="display: none;">
        </label>
        
        <button id="import-btn" class="btn btn-success" disabled>
            开始导入
        </button>
    </div>
    
    <div id="import-result" class="import-result" style="display: none;">
        <h4>导入结果</h4>
        <div class="result-stats">
            <div class="stat-item">
                <span class="stat-label">总记录:</span>
                <span class="stat-value" id="import-total">0</span>
            </div>
            <div class="stat-item success">
                <span class="stat-label">成功:</span>
                <span class="stat-value" id="import-success">0</span>
            </div>
            <div class="stat-item error">
                <span class="stat-label">失败:</span>
                <span class="stat-value" id="import-failed">0</span>
            </div>
        </div>
        
        <div id="import-errors" class="import-errors" style="display: none;">
            <h5>错误详情</h5>
            <ul id="error-list"></ul>
        </div>
    </div>
</div>
```

### JavaScript 实现

```javascript
// 下载模板
document.getElementById('download-template-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/v1/jobs/import-template', {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '岗位导入模板.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        showToast('下载模板失败', 'error');
    }
});

// 文件选择
document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const importBtn = document.getElementById('import-btn');
    
    if (file) {
        // 验证文件大小（10MB）
        if (file.size > 10 * 1024 * 1024) {
            showToast('文件大小超过限制（最大 10MB）', 'error');
            e.target.value = '';
            importBtn.disabled = true;
            return;
        }
        
        // 验证文件类型
        const validTypes = ['xlsx', 'xls', 'csv'];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExt)) {
            showToast('不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件', 'error');
            e.target.value = '';
            importBtn.disabled = true;
            return;
        }
        
        importBtn.disabled = false;
    } else {
        importBtn.disabled = true;
    }
});

// 执行导入
document.getElementById('import-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('请选择要导入的文件', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showToast('正在导入...', 'info');
        
        const response = await fetch('/api/v1/jobs/batch-import', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.code === 200) {
            const { total, success, failed, errors } = result.data;
            
            // 显示结果
            document.getElementById('import-result').style.display = 'block';
            document.getElementById('import-total').textContent = total;
            document.getElementById('import-success').textContent = success;
            document.getElementById('import-failed').textContent = failed;
            
            // 显示错误详情
            const errorsDiv = document.getElementById('import-errors');
            const errorList = document.getElementById('error-list');
            
            if (errors && errors.length > 0) {
                errorsDiv.style.display = 'block';
                errorList.innerHTML = errors.map(err => 
                    `<li>第 ${err.row} 行: ${err.error}</li>`
                ).join('');
            } else {
                errorsDiv.style.display = 'none';
            }
            
            if (failed === 0) {
                showToast(`导入成功！共导入 ${success} 条记录`, 'success');
                loadJobs(1); // 刷新岗位列表
            } else {
                showToast(`导入完成，成功 ${success} 条，失败 ${failed} 条`, 'warning');
            }
        } else {
            showToast(result.msg || '导入失败', 'error');
        }
    } catch (error) {
        showToast('导入失败: ' + error.message, 'error');
    }
    
    // 清理
    fileInput.value = '';
    document.getElementById('import-btn').disabled = true;
});
```

### CSS 样式

```css
.batch-import-section {
    background: var(--bg-card);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
}

.import-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.import-result {
    margin-top: 20px;
    padding: 15px;
    background: var(--bg-hover);
    border-radius: 6px;
}

.result-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.stat-label {
    font-size: 14px;
    color: var(--text-secondary);
}

.stat-value {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-primary);
}

.stat-item.success .stat-value {
    color: var(--success-color);
}

.stat-item.error .stat-value {
    color: var(--danger-color);
}

.import-errors {
    margin-top: 15px;
    padding: 10px;
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid var(--danger-color);
    border-radius: 4px;
}

.import-errors h5 {
    margin: 0 0 10px 0;
    color: var(--danger-color);
}

.import-errors ul {
    margin: 0;
    padding-left: 20px;
}

.import-errors li {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 5px;
}
```

## 测试计划

### 单元测试

1. **Excel 解析测试**
   - 测试正常数据解析
   - 测试空行处理
   - 测试数据类型转换

2. **CSV 解析测试**
   - 测试正常 CSV 文件
   - 测试分隔符识别
   - 测试特殊字符处理

3. **数据验证测试**
   - 测试必填字段验证
   - 测试长度限制验证
   - 测试格式验证

### 集成测试

1. **API 接口测试**
   - 测试文件上传
   - 测试文件大小限制
   - 测试文件类型验证

2. **数据库测试**
   - 测试批量插入
   - 测试事务回滚
   - 测试并发导入

### 测试用例

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    
    #[test]
    fn test_parse_excel_row() {
        let row = vec![
            DataType::String("测试岗位".to_string()),
            DataType::String("描述".to_string()),
            DataType::Empty,
        ];
        
        let job = parse_excel_row(&row, 2).unwrap();
        assert_eq!(job.name, "测试岗位");
        assert_eq!(job.description, Some("描述".to_string()));
    }
    
    #[test]
    fn test_job_validation() {
        let mut job = JobImportData {
            name: "".to_string(),
            description: None,
            company: None,
            industry: None,
            category: None,
            location: None,
            salary_range: None,
            skills: None,
            certificates: None,
            soft_skills: None,
            requirements: None,
            growth_potential: None,
        };
        
        assert!(job.validate().is_err());
    }
}
```

## 注意事项

### 1. 性能优化

- **批处理大小**: 建议每批处理 100-500 条记录
- **事务处理**: 使用数据库事务确保数据一致性
- **并发控制**: 限制同时导入的文件数量
- **缓存**: 对常用查询结果进行缓存

### 2. 安全性

- **文件类型验证**: 不仅检查扩展名，还要检查文件头
- **大小限制**: 限制上传文件大小（建议 10MB）
- **内容扫描**: 检查文件内容是否包含恶意代码
- **权限控制**: 确保只有授权用户可以导入数据

### 3. 错误处理

- **详细错误信息**: 记录每一条失败的记录及原因
- **部分成功**: 允许部分记录失败，继续处理其他记录
- **事务回滚**: 如果大量失败，考虑回滚整个导入
- **日志记录**: 记录完整的导入过程，便于调试

### 4. 用户体验

- **进度提示**: 显示导入进度（对于大文件）
- **模板下载**: 提供标准导入模板
- **预览功能**: 导入前允许预览数据
- **验证提示**: 实时显示数据验证结果

### 5. 扩展性

- **自定义字段**: 支持添加自定义导入字段
- **模板配置**: 允许用户自定义模板格式
- **数据映射**: 支持灵活的字段映射
- **批量更新**: 支持更新现有记录而不仅仅是插入

## 后续优化方向

1. **支持更多格式**: 如 JSON、XML
2. **导入历史**: 记录每次导入的详细信息
3. **定时导入**: 支持定时任务批量导入
4. **数据清洗**: 提供数据清洗和标准化功能
5. **导入预览**: 导入前预览数据和验证结果

## 参考资料

- [calamine 文档](https://docs.rs/calamite/)
- [rust_xlsxwriter 文档](https://docs.rs/rust_xlsxwriter/)
- [csv 文档](https://docs.rs/csv/)
- [actix-web 文档](https://actix.rs/)

## 版本历史

- v1.0 (2026-04-16): 初始版本，支持基础批量导入功能