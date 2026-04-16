# Teacher-App 学校管理和岗位批量导入功能实现计划

## 概述

为 teacher-app (Rust 后端) 添加学校代码创建和岗位批量导入功能，使教师端能够独立管理学校和岗位数据。

## 功能范围

### 1. 学校管理功能
- 创建学校（自动生成学校代码）
- 查询学校列表
- 更新学校信息
- 启用/禁用学校
- 查询学校详情

### 2. 岗位批量导入功能
- Excel 文件上传解析
- 批量创建岗位
- 导入结果反馈
- 错误处理和验证

---

## 一、学校管理功能设计

### 1.1 数据模型

#### School 模型 (`src/models/school.rs`)
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct School {
    pub id: i64,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub status: String,  // active, inactive, suspended
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SchoolResponse {
    pub id: i64,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct CreateSchoolRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: String,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct UpdateSchoolRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: Option<String>,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SchoolQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
    pub status: Option<String>,
}
```

### 1.2 API 接口设计

#### 路由配置
```rust
// 在 routes.rs 中添加
.service(
    web::scope("/schools")
        .wrap(crate::middleware::AuthMiddleware)
        // 创建学校
        .route("", web::post().to(crate::handlers::school::create))
        // 学校列表
        .route("", web::get().to(crate::handlers::school::list))
        // 学校详情
        .route("/{id}", web::get().to(crate::handlers::school::get))
        // 更新学校
        .route("/{id}", web::put().to(crate::handlers::school::update))
        // 删除学校
        .route("/{id}", web::delete().to(crate::handlers::school::delete))
        // 启用/禁用学校
        .route("/{id}/status", web::patch().to(crate::handlers::school::update_status)),
)
```

#### API 接口说明

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/v1/schools` | 创建学校 | 需要认证 |
| GET | `/api/v1/schools` | 学校列表 | 需要认证 |
| GET | `/api/v1/schools/{id}` | 学校详情 | 需要认证 |
| PUT | `/api/v1/schools/{id}` | 更新学校 | 需要认证 |
| DELETE | `/api/v1/schools/{id}` | 删除学校 | 需要认证 |
| PATCH | `/api/v1/schools/{id}/status` | 启用/禁用学校 | 需要认证 |

### 1.3 核心逻辑

#### 学校代码生成规则
- 格式：`SCH` + 年份后两位 + 4位随机数
- 示例：`SCH240001`, `SCH240012`
- 确保唯一性，生成后检查是否已存在

#### Handler 实现 (`src/handlers/school.rs`)

```rust
use actix_web::{web, HttpResponse};
use sqlx::MySqlPool;
use validator::Validate;

use crate::models::school::*;
use crate::utils::response::*;

// 创建学校
pub async fn create(
    pool: web::Data<MySqlPool>,
    req: web::Json<CreateSchoolRequest>,
) -> HttpResponse {
    // 验证请求
    if let Err(errors) = req.validate() {
        return error_response(400, format!("参数验证失败: {:?}", errors));
    }

    // 生成学校代码
    let school_code = generate_school_code(&pool).await;

    // 创建学校
    let now = chrono::Utc::now().timestamp();
    let result = sqlx::query(
        "INSERT INTO schools (name, code, address, contact_person, contact_phone, contact_email, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)"
    )
    .bind(&req.name)
    .bind(&school_code)
    .bind(&req.address)
    .bind(&req.contact_person)
    .bind(&req.contact_phone)
    .bind(&req.contact_email)
    .bind(now)
    .bind(now)
    .execute(pool.as_ref())
    .await;

    match result {
        Ok(_) => success_response(school_code, "学校创建成功"),
        Err(e) => error_response(500, format!("创建学校失败: {}", e)),
    }
}

// 生成学校代码
async fn generate_school_code(pool: &MySqlPool) -> String {
    let year = chrono::Utc::now().format("%y").to_string();
    let mut random_num;

    loop {
        random_num = rand::random::<u32>() % 10000;
        let code = format!("SCH{}{:04}", year, random_num);

        // 检查代码是否已存在
        let exists = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM schools WHERE code = ?"
        )
        .bind(&code)
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        if exists == 0 {
            return code;
        }
    }
}

// 学校列表
pub async fn list(
    pool: web::Data<MySqlPool>,
    query: web::Query<SchoolQuery>,
) -> HttpResponse {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);
    let offset = (page - 1) * page_size;

    let mut sql = "SELECT * FROM schools WHERE 1=1".to_string();
    let mut params = Vec::new();

    if let Some(keyword) = &query.keyword {
        sql.push_str(" AND name LIKE ?");
        params.push(format!("%{}%", keyword));
    }

    if let Some(status) = &query.status {
        sql.push_str(" AND status = ?");
        params.push(status.clone());
    }

    sql.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
    params.push(page_size.to_string());
    params.push(offset.to_string());

    // 查询数据
    let schools = sqlx::query_as::<_, School>(&sql)
        .bind_all(&params)
        .fetch_all(pool.as_ref())
        .await;

    match schools {
        Ok(list) => success_response(list, "查询成功"),
        Err(e) => error_response(500, format!("查询失败: {}", e)),
    }
}

// 学校详情
pub async fn get(
    pool: web::Data<MySqlPool>,
    path: web::Path<i64>,
) -> HttpResponse {
    let school_id = path.into_inner();

    let result = sqlx::query_as::<_, School>(
        "SELECT * FROM schools WHERE id = ?"
    )
    .bind(school_id)
    .fetch_optional(pool.as_ref())
    .await;

    match result {
        Ok(Some(school)) => success_response(school, "查询成功"),
        Ok(None) => error_response(404, "学校不存在"),
        Err(e) => error_response(500, format!("查询失败: {}", e)),
    }
}

// 更新学校
pub async fn update(
    pool: web::Data<MySqlPool>,
    path: web::Path<i64>,
    req: web::Json<UpdateSchoolRequest>,
) -> HttpResponse {
    let school_id = path.into_inner();

    if let Err(errors) = req.validate() {
        return error_response(400, format!("参数验证失败: {:?}", errors));
    }

    let now = chrono::Utc::now().timestamp();
    let mut updates = Vec::new();
    let mut params = Vec::new();

    if let Some(name) = &req.name {
        updates.push("name = ?");
        params.push(name.clone());
    }
    if let Some(address) = &req.address {
        updates.push("address = ?");
        params.push(address.clone());
    }
    if let Some(contact_person) = &req.contact_person {
        updates.push("contact_person = ?");
        params.push(contact_person.clone());
    }
    if let Some(contact_phone) = &req.contact_phone {
        updates.push("contact_phone = ?");
        params.push(contact_phone.clone());
    }
    if let Some(contact_email) = &req.contact_email {
        updates.push("contact_email = ?");
        params.push(contact_email.clone());
    }
    if let Some(status) = &req.status {
        updates.push("status = ?");
        params.push(status.clone());
    }

    if updates.is_empty() {
        return error_response(400, "没有更新字段");
    }

    updates.push("updated_at = ?");
    params.push(now.to_string());

    let sql = format!("UPDATE schools SET {} WHERE id = ?", updates.join(", "));
    params.push(school_id.to_string());

    let result = sqlx::query(&sql)
        .bind_all(&params)
        .execute(pool.as_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => success_response(true, "更新成功"),
        Ok(_) => error_response(404, "学校不存在"),
        Err(e) => error_response(500, format!("更新失败: {}", e)),
    }
}

// 删除学校
pub async fn delete(
    pool: web::Data<MySqlPool>,
    path: web::Path<i64>,
) -> HttpResponse {
    let school_id = path.into_inner();

    // 检查是否有关联的教师或学生
    let teacher_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM teachers WHERE school_id = ?"
    )
    .bind(school_id)
    .fetch_one(pool.as_ref())
    .await
    .unwrap_or(0);

    if teacher_count > 0 {
        return error_response(400, "该学校下存在教师，无法删除");
    }

    let result = sqlx::query("DELETE FROM schools WHERE id = ?")
        .bind(school_id)
        .execute(pool.as_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => success_response(true, "删除成功"),
        Ok(_) => error_response(404, "学校不存在"),
        Err(e) => error_response(500, format!("删除失败: {}", e)),
    }
}

// 更新学校状态
pub async fn update_status(
    pool: web::Data<MySqlPool>,
    path: web::Path<i64>,
    req: web::Json<serde_json::Value>,
) -> HttpResponse {
    let school_id = path.into_inner();

    let status = req.get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("active");

    if !["active", "inactive", "suspended"].contains(&status) {
        return error_response(400, "无效的状态值");
    }

    let now = chrono::Utc::now().timestamp();

    let result = sqlx::query(
        "UPDATE schools SET status = ?, updated_at = ? WHERE id = ?"
    )
    .bind(status)
    .bind(now)
    .bind(school_id)
    .execute(pool.as_ref())
    .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => success_response(true, "状态更新成功"),
        Ok(_) => error_response(404, "学校不存在"),
        Err(e) => error_response(500, format!("更新失败: {}", e)),
    }
}
```

---

## 二、岗位批量导入功能设计

### 2.1 Excel 文件格式

#### 模板格式
| 岗位名称 | 描述 | 公司 | 行业 | 类别 | 地点 | 薪资范围 | 技能要求 | 证书要求 | 软技能 | 岗位要求 | 成长潜力 |
|---------|------|------|------|------|------|----------|----------|----------|--------|----------|----------|
| Golang后端开发工程师 | 负责公司后端服务开发 | 字节跳动 | 技术 | 开发 | 北京 | 15000-30000 | Golang,MySQL,Redis | 无 | 团队协作 | 3年经验 | 极高 |
| Java开发工程师 | 负责企业级应用后端开发 | 阿里巴巴 | 技术 | 开发 | 杭州 | 12000-25000 | Java,Spring,MySQL | 无 | 沟通能力 | 3年经验 | 高 |

### 2.2 数据模型

#### 导入请求模型
```rust
#[derive(Debug, Deserialize)]
pub struct BatchImportJobsRequest {
    pub file: String,  // Base64 编码的 Excel 文件
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub total: u32,
    pub success: u32,
    pub failed: u32,
    pub errors: Vec<ImportError>,
}

#[derive(Debug, Serialize)]
pub struct ImportError {
    pub row: u32,
    pub message: String,
}
```

### 2.3 API 接口设计

#### 路由配置
```rust
// 在 jobs 路由组中添加
.route("/batch-import", web::post().to(crate::handlers::job::batch_import))
.route("/import-template", web::get().to(crate::handlers::job::download_template))
```

#### API 接口说明

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/v1/jobs/batch-import` | 批量导入岗位 | 需要认证 |
| GET | `/api/v1/jobs/import-template` | 下载导入模板 | 需要认证 |

### 2.4 核心逻辑

#### 依赖添加
在 `Cargo.toml` 中添加：
```toml
calamine = "0.24"  # Excel 文件解析
base64 = "0.22"    # Base64 解码
```

#### Handler 实现

```rust
use calamine::{Reader, open_workbook, Xlsx};
use base64::{Engine as _, engine::general_purpose};
use std::io::Cursor;

// 批量导入岗位
pub async fn batch_import(
    pool: web::Data<MySqlPool>,
    req: web::Json<BatchImportJobsRequest>,
) -> HttpResponse {
    // 解码 Base64 文件
    let file_data = match general_purpose::STANDARD.decode(&req.file) {
        Ok(data) => data,
        Err(e) => return error_response(400, format!("文件解码失败: {}", e)),
    };

    // 解析 Excel 文件
    let cursor = Cursor::new(file_data);
    let mut workbook: Xlsx<_> = match open_workbook(cursor) {
        Ok(wb) => wb,
        Err(e) => return error_response(400, format!("打开 Excel 文件失败: {}", e)),
    };

    // 读取第一个工作表
    let range = match workbook.worksheet_range_at(0) {
        Some(r) => r,
        None => return error_response(400, "工作表为空"),
    };

    let rows = match range {
        Ok(r) => r,
        Err(e) => return error_response(400, format!("读取工作表失败: {}", e)),
    };

    // 解析数据
    let mut total = 0u32;
    let mut success = 0u32;
    let mut failed = 0u32;
    let mut errors = Vec::new();
    let now = chrono::Utc::now().timestamp();

    // 跳过标题行，从第二行开始
    for (idx, row) in rows.rows().skip(1).enumerate() {
        total += 1;
        let row_num = (idx + 2) as u32;

        // 解析行数据
        let job = match parse_job_row(row) {
            Ok(j) => j,
            Err(e) => {
                failed += 1;
                errors.push(ImportError {
                    row: row_num,
                    message: e,
                });
                continue;
            }
        };

        // 插入数据库
        let result = sqlx::query(
            "INSERT INTO jobs (name, description, company, industry, category, location, salary_range, skills, certificates, soft_skills, requirements, growth_potential, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&job.name)
        .bind(&job.description)
        .bind(&job.company)
        .bind(&job.industry)
        .bind(&job.category)
        .bind(&job.location)
        .bind(&job.salary_range)
        .bind(&job.skills)
        .bind(&job.certificates)
        .bind(&job.soft_skills)
        .bind(&job.requirements)
        .bind(&job.growth_potential)
        .bind(now)
        .bind(now)
        .execute(pool.as_ref())
        .await;

        match result {
            Ok(_) => success += 1,
            Err(e) => {
                failed += 1;
                errors.push(ImportError {
                    row: row_num,
                    message: format!("插入数据库失败: {}", e),
                });
            }
        }
    }

    let result = ImportResult {
        total,
        success,
        failed,
        errors,
    };

    success_response(result, "导入完成")
}

// 解析单行数据
fn parse_job_row(row: &[calamine::DataType]) -> Result<CreateJobRequest, String> {
    if row.len() < 12 {
        return Err("列数不足，需要12列".to_string());
    }

    let get_string = |idx: usize| -> Option<String> {
        row.get(idx)
            .and_then(|cell| cell.get_string())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    };

    let name = get_string(0).ok_or("岗位名称不能为空")?;
    let description = get_string(1);
    let company = get_string(2);
    let industry = get_string(3);
    let category = get_string(4);
    let location = get_string(5);
    let salary_range = get_string(6);
    let skills = get_string(7);
    let certificates = get_string(8);
    let soft_skills = get_string(9);
    let requirements = get_string(10);
    let growth_potential = get_string(11);

    Ok(CreateJobRequest {
        name,
        description,
        company,
        industry,
        category,
        location,
        salary_range,
        skills,
        certificates,
        soft_skills,
        requirements,
        growth_potential,
    })
}

// 下载导入模板
pub async fn download_template() -> HttpResponse {
    // 生成 Excel 模板
    let mut workbook = rust_xlsxwriter::Workbook::new();
    let worksheet = workbook.add_worksheet().unwrap();

    // 添加标题行
    let headers = vec![
        "岗位名称", "描述", "公司", "行业", "类别", "地点",
        "薪资范围", "技能要求", "证书要求", "软技能", "岗位要求", "成长潜力"
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string(0, col as u16, header).unwrap();
    }

    // 添加示例数据
    let example = vec![
        "Golang后端开发工程师", "负责公司后端服务开发", "字节跳动", "技术", "开发",
        "北京", "15000-30000", "Golang,MySQL,Redis", "无", "团队协作", "3年经验", "极高"
    ];

    for (col, value) in example.iter().enumerate() {
        worksheet.write_string(1, col as u16, value).unwrap();
    }

    // 生成文件
    let mut buffer = Vec::new();
    workbook.save_to(&mut buffer).unwrap();

    // 返回文件
    HttpResponse::Ok()
        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .append_header(("Content-Disposition", "attachment; filename=job_import_template.xlsx"))
        .body(buffer)
}
```

---

## 三、实现步骤

### 阶段一：学校管理功能
1. ✅ 创建 `src/models/school.rs` - 定义学校数据模型
2. ✅ 创建 `src/handlers/school.rs` - 实现学校 CRUD Handler
3. ✅ 在 `src/models/mod.rs` 中添加学校模块导出
4. ✅ 在 `src/handlers/mod.rs` 中添加学校模块导出
5. ✅ 在 `src/routes.rs` 中添加学校路由配置
6. ✅ 在 `Cargo.toml` 中添加 validator 依赖（如果未添加）
7. ✅ 测试学校管理接口

### 阶段二：岗位批量导入功能
1. ✅ 在 `Cargo.toml` 中添加 calamine 和 base64 依赖
2. ✅ 在 `src/models/job.rs` 中添加批量导入相关模型
3. ✅ 在 `src/handlers/job.rs` 中实现批量导入 Handler
4. ✅ 在 `src/routes.rs` 中添加批量导入路由
5. ✅ 添加 rust_xlsxwriter 依赖（用于生成模板）
6. ✅ 实现模板下载功能
7. ✅ 测试批量导入功能

### 阶段三：测试和文档
1. ✅ 编写单元测试
2. ✅ 编写 API 文档
3. ✅ 创建使用示例
4. ✅ 性能测试

---

## 四、测试计划

### 学校管理功能测试
- [ ] 创建学校 - 正常情况
- [ ] 创建学校 - 名称长度验证
- [ ] 创建学校 - 学校代码唯一性验证
- [ ] 查询学校列表 - 分页
- [ ] 查询学校列表 - 关键词搜索
- [ ] 查询学校列表 - 状态过滤
- [ ] 查询学校详情 - 存在的学校
- [ ] 查询学校详情 - 不存在的学校
- [ ] 更新学校 - 部分字段更新
- [ ] 更新学校 - 全部字段更新
- [ ] 删除学校 - 存在的学校
- [ ] 删除学校 - 有关联教师时拒绝删除
- [ ] 更新学校状态 - 有效状态
- [ ] 更新学校状态 - 无效状态

### 岗位批量导入测试
- [ ] 上传 Excel 文件 - 正常导入
- [ ] 上传 Excel 文件 - 空文件
- [ ] 上传 Excel 文件 - 格式错误
- [ ] 上传 Excel 文件 - 缺少列
- [ ] 上传 Excel 文件 - 必填字段为空
- [ ] 上传 Excel 文件 - 大批量数据（1000+条）
- [ ] 下载模板 - 正常下载
- [ ] 导入结果统计 - 全部成功
- [ ] 导入结果统计 - 部分失败
- [ ] 导入结果统计 - 全部失败

---

## 五、注意事项

### 学校代码生成
- 确保代码唯一性
- 考虑并发情况下的冲突
- 代码格式统一

### Excel 文件解析
- 处理大文件性能问题
- 支持多种 Excel 格式（.xlsx, .xls）
- 详细的错误信息反馈

### 数据验证
- 必填字段验证
- 数据格式验证
- 业务逻辑验证

### 权限控制
- 所有接口需要认证
- 考虑是否需要管理员权限
- 记录操作日志

---

## 六、API 使用示例

### 创建学校
```bash
curl -X POST http://localhost:8080/api/v1/schools \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "北京市第一中学",
    "address": "北京市东城区",
    "contact_person": "张老师",
    "contact_phone": "010-12345678",
    "contact_email": "contact@school1.edu.cn"
  }'
```

### 查询学校列表
```bash
curl -X GET "http://localhost:8080/api/v1/schools?page=1&page_size=10&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 批量导入岗位
```bash
curl -X POST http://localhost:8080/api/v1/jobs/batch-import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file": "UEsDBBQABgAIAAAAIQ..."
  }'
```

### 下载导入模板
```bash
curl -X GET http://localhost:8080/api/v1/jobs/import-template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o job_import_template.xlsx
```

---

## 七、后续优化方向

1. **学校管理优化**
   - 添加学校图标上传功能
   - 添加学校详细信息页面
   - 添加学校统计数据（学生数、教师数等）

2. **批量导入优化**
   - 支持更多文件格式（CSV、JSON）
   - 添加导入预览功能
   - 支持异步大批量导入
   - 添加导入进度查询

3. **功能扩展**
   - 学校数据导出功能
   - 岗位数据导出功能
   - 数据批量修改功能
   - 数据备份和恢复

4. **性能优化**
   - 添加数据缓存
   - 优化查询性能
   - 支持异步处理
   - 添加队列机制

---

## 八、时间估算

| 功能 | 预计时间 |
|------|---------|
| 学校管理功能 | 2-3 天 |
| 岗位批量导入功能 | 2-3 天 |
| 测试和文档 | 1-2 天 |
| **总计** | **5-8 天** |

---

## 九、依赖清单

### 新增依赖
```toml
calamine = "0.24"           # Excel 文件解析
base64 = "0.22"             # Base64 编解码
rust_xlsxwriter = "0.78"    # Excel 文件生成
```

### 现有依赖
```toml
actix-web = "4.9"           # Web 框架
sqlx = "0.8"                # 数据库驱动
serde = "1.0"               # 序列化/反序列化
validator = "0.18"          # 数据验证
chrono = "0.4"              # 时间处理
rand = "0.8"                # 随机数生成
```

---

## 十、参考资料

- [Actix-Web 官方文档](https://actix.rs/)
- [SQLx 官方文档](https://docs.rs/sqlx/)
- [Calamine Excel 解析库](https://docs.rs/calamine/)
- [Rust XLSX Writer](https://docs.rs/rust_xlsxwriter/)
- [Validator 验证库](https://docs.rs/validator/)