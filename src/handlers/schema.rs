use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, Column};

/// 表信息
#[derive(Debug, Clone, Serialize)]
pub struct TableInfo {
    pub table_name: String,
    pub table_comment: Option<String>,
    pub engine: Option<String>,
    pub row_count: Option<i64>,
    pub created_time: Option<String>,
}

/// 字段信息
#[derive(Debug, Clone, Serialize)]
pub struct ColumnInfo {
    pub column_name: String,
    pub data_type: String,
    pub is_nullable: String,
    pub column_key: String,
    pub column_default: Option<String>,
    pub extra: String,
    pub column_comment: Option<String>,
    pub ordinal_position: u32,
    pub referenced_table: Option<String>,
    pub referenced_column: Option<String>,
}

/// 添加字段请求
#[derive(Debug, Deserialize)]
pub struct AddColumnRequest {
    pub table_name: String,
    pub column_name: String,
    pub column_type: String,
    pub is_nullable: Option<bool>,
    pub default_value: Option<String>,
    pub comment: Option<String>,
    pub after_column: Option<String>,
}

/// 修改字段请求
#[derive(Debug, Deserialize)]
pub struct ModifyColumnRequest {
    pub table_name: String,
    pub old_column_name: String,
    pub new_column_name: Option<String>,
    pub column_type: Option<String>,
    pub is_nullable: Option<bool>,
    pub default_value: Option<String>,
    pub comment: Option<String>,
}

/// 删除字段请求
#[derive(Debug, Deserialize)]
pub struct DeleteColumnRequest {
    pub table_name: String,
    pub column_name: String,
}

/// 获取所有表
pub async fn list_tables(state: web::Data<crate::state::AppState>) -> impl Responder {
    let pool = state.mysql_db();
    
    // 查询所有表及其信息
    let query = r#"
        SELECT 
            TABLE_NAME as table_name,
            TABLE_COMMENT as table_comment,
            ENGINE as engine,
            CREATE_TIME as created_time
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
    "#;

    let tables_result = sqlx::query(query)
        .fetch_all(pool)
        .await;

    match tables_result {
        Ok(rows) => {
            let mut tables = Vec::new();
            
            for row in rows {
                let table_name: String = row.get("table_name");
                let table_comment: Option<String> = row.get("table_comment");
                let engine: Option<String> = row.get("engine");
                let created_time: Option<String> = row.try_get("created_time").ok();
                
                // 查询表的行数
                let count_query = format!("SELECT COUNT(*) as count FROM `{}`", table_name);
                let row_count: Option<i64> = match sqlx::query(&count_query)
                    .fetch_one(pool)
                    .await
                {
                    Ok(count_row) => Some(count_row.get("count")),
                    Err(_) => None,
                };
                
                tables.push(TableInfo {
                    table_name,
                    table_comment,
                    engine,
                    row_count,
                    created_time,
                });
            }
            
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "success",
                "data": {
                    "items": tables,
                    "total": tables.len()
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to list tables: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to list tables: {}", e),
                "data": null
            }))
        }
    }
}

/// 获取表结构
pub async fn get_table_schema(
    state: web::Data<crate::state::AppState>,
    table_name: web::Path<String>,
) -> impl Responder {
    let pool = state.mysql_db();
    let table_name = table_name.into_inner();
    
    // 验证表名
    if !is_valid_identifier(&table_name) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name",
            "data": null
        }));
    }
    
    // 查询表是否存在
    let check_query = r#"
        SELECT COUNT(*) as count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    "#;
    
    let exists = match sqlx::query(check_query)
        .bind(&table_name)
        .fetch_one(pool)
        .await
    {
        Ok(row) => {
            let count: i64 = row.get("count");
            count > 0
        }
        Err(e) => {
            log::error!("Failed to check table existence: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to check table existence: {}", e),
                "data": null
            }));
        }
    };
    
    if !exists {
        return HttpResponse::NotFound().json(serde_json::json!({
            "code": 404,
            "message": format!("Table '{}' not found", table_name),
            "data": null
        }));
    }
    
    // 查询表结构
    let query = r#"
        SELECT 
            COLUMN_NAME as column_name,
            COLUMN_TYPE as data_type,
            IS_NULLABLE as is_nullable,
            COLUMN_KEY as column_key,
            COLUMN_DEFAULT as column_default,
            EXTRA as extra,
            COLUMN_COMMENT as column_comment,
            ORDINAL_POSITION as ordinal_position
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    "#;
    
    match sqlx::query(query)
        .bind(&table_name)
        .fetch_all(pool)
        .await
    {
        Ok(rows) => {
            let columns: Vec<ColumnInfo> = rows.iter().map(|row| {
                let get_string = |col: &str| -> String {
                    row.try_get::<String, _>(col).unwrap_or_else(|_| {
                        row.try_get::<Vec<u8>, _>(col)
                            .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
                            .unwrap_or_default()
                    })
                };

                ColumnInfo {
                    column_name: get_string("column_name"),
                    data_type: get_string("data_type"),
                    is_nullable: get_string("is_nullable"),
                    column_key: get_string("column_key"),
                    column_default: row.try_get::<String, _>("column_default").ok().or_else(|| {
                        row.try_get::<Vec<u8>, _>("column_default")
                            .map(|b| String::from_utf8_lossy(&b).into_owned())
                            .ok()
                    }),
                    extra: get_string("extra"),
                    column_comment: row.try_get::<String, _>("column_comment").ok().or_else(|| {
                        row.try_get::<Vec<u8>, _>("column_comment")
                            .map(|b| String::from_utf8_lossy(&b).into_owned())
                            .ok()
                    }),
                    ordinal_position: row.try_get("ordinal_position").unwrap_or(0),
                    referenced_table: None,
                    referenced_column: None,
                }
            }).collect();
            
            let mut columns_with_fk = columns;
            
            let fk_query = r#"
                SELECT 
                    COLUMN_NAME as column_name,
                    REFERENCED_TABLE_NAME as referenced_table,
                    REFERENCED_COLUMN_NAME as referenced_column
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                AND REFERENCED_TABLE_NAME IS NOT NULL
            "#;
            
            if let Ok(fk_rows) = sqlx::query(fk_query)
                .bind(&table_name)
                .fetch_all(pool)
                .await
            {
                for fk_row in fk_rows {
                    let col_name: String = fk_row.try_get("column_name").unwrap_or_default();
                    let ref_table: Option<String> = fk_row.try_get("referenced_table").ok();
                    let ref_col: Option<String> = fk_row.try_get("referenced_column").ok();
                    
                    if let Some(col) = columns_with_fk.iter_mut().find(|c| c.column_name == col_name) {
                        col.referenced_table = ref_table;
                        col.referenced_column = ref_col;
                    }
                }
            }
            
            let columns = columns_with_fk;
            
            // 获取表的CREATE语句
            let create_table_query = format!("SHOW CREATE TABLE `{}`", table_name);
            let create_statement = match sqlx::query(&create_table_query)
                .fetch_one(pool)
                .await
            {
                Ok(row) => {
                    // SHOW CREATE TABLE 返回两列：Table (index 0) 和 Create Table (index 1)
                    // 使用索引访问避免列名包含空格导致的 ColumnNotFound 错误
                    row.try_get::<String, _>(1).unwrap_or_else(|_| String::new())
                }
                Err(_) => String::new(),
            };
            
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "success",
                "data": {
                    "table_name": table_name,
                    "columns": columns,
                    "create_statement": create_statement
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to get table schema: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to get table schema: {}", e),
                "data": null
            }))
        }
    }
}

/// 添加字段
pub async fn add_column(
    state: web::Data<crate::state::AppState>,
    req: Result<web::Json<AddColumnRequest>, actix_web::Error>,
) -> impl Responder {
    // 处理JSON反序列化错误
    let req = match req {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to deserialize add column request: {}", e);
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "Invalid request format. Please check your JSON data.",
                "data": null
            }));
        }
    };
    
    let pool = state.mysql_db();
    
    // 验证表名和字段名
    if !is_valid_identifier(&req.table_name) || !is_valid_identifier(&req.column_name) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name or column name",
            "data": null
        }));
    }
    
    // 构建ALTER TABLE语句
    let nullable = req.is_nullable.unwrap_or(true);
    let null_constraint = if nullable { "NULL" } else { "NOT NULL" };
    
    let mut alter_sql = format!(
        "ALTER TABLE `{}` ADD COLUMN `{}` {} {}",
        req.table_name, req.column_name, req.column_type, null_constraint
    );
    
    // 添加默认值
    if let Some(default) = &req.default_value {
        if !default.is_empty() {
            alter_sql.push_str(&format!(" DEFAULT '{}'", escape_sql_string(default)));
        }
    }
    
    // 添加注释
    if let Some(comment) = &req.comment {
        if !comment.is_empty() {
            alter_sql.push_str(&format!(" COMMENT '{}'", escape_sql_string(comment)));
        }
    }
    
    // 添加插入位置
    if let Some(after) = &req.after_column {
        if !after.is_empty() {
            alter_sql.push_str(&format!(" AFTER `{}`", after));
        }
    }
    
    log::info!("Executing SQL: {}", alter_sql);
    
    match sqlx::query(&alter_sql)
        .execute(pool)
        .await
    {
        Ok(_) => {
            log::info!("Column '{}' added to table '{}'", req.column_name, req.table_name);
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Column added successfully",
                "data": {
                    "table_name": req.table_name,
                    "column_name": req.column_name
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to add column: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to add column: {}", e),
                "data": null
            }))
        }
    }
}

/// 修改字段
pub async fn modify_column(
    state: web::Data<crate::state::AppState>,
    req: Result<web::Json<ModifyColumnRequest>, actix_web::Error>,
) -> impl Responder {
    // 处理JSON反序列化错误
    let req = match req {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to deserialize modify column request: {}", e);
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "Invalid request format. Please check your JSON data.",
                "data": null
            }));
        }
    };
    
    let pool = state.mysql_db();
    
    // 验证表名和字段名
    if !is_valid_identifier(&req.table_name) || !is_valid_identifier(&req.old_column_name) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name or column name",
            "data": null
        }));
    }
    
    // 构建ALTER TABLE语句
    let new_column_name = req.new_column_name.as_ref().unwrap_or(&req.old_column_name);
    let column_type = req.column_type.as_ref().map(|s| s.as_str()).unwrap_or("VARCHAR(255)");
    let nullable = req.is_nullable.unwrap_or(true);
    let null_constraint = if nullable { "NULL" } else { "NOT NULL" };
    
    let mut alter_sql = format!(
        "ALTER TABLE `{}` CHANGE COLUMN `{}` `{}` {} {}",
        req.table_name, req.old_column_name, new_column_name, column_type, null_constraint
    );
    
    // 添加默认值
    if let Some(default) = &req.default_value {
        if !default.is_empty() {
            alter_sql.push_str(&format!(" DEFAULT '{}'", escape_sql_string(default)));
        }
    }
    
    // 添加注释
    if let Some(comment) = &req.comment {
        if !comment.is_empty() {
            alter_sql.push_str(&format!(" COMMENT '{}'", escape_sql_string(comment)));
        }
    }
    
    log::info!("Executing SQL: {}", alter_sql);
    
    match sqlx::query(&alter_sql)
        .execute(pool)
        .await
    {
        Ok(_) => {
            log::info!("Column '{}' modified in table '{}'", req.old_column_name, req.table_name);
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Column modified successfully",
                "data": {
                    "table_name": req.table_name,
                    "old_column_name": req.old_column_name,
                    "new_column_name": new_column_name
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to modify column: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to modify column: {}", e),
                "data": null
            }))
        }
    }
}

/// 删除字段
pub async fn delete_column(
    state: web::Data<crate::state::AppState>,
    req: Result<web::Json<DeleteColumnRequest>, actix_web::Error>,
) -> impl Responder {
    // 处理JSON反序列化错误
    let req = match req {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to deserialize delete column request: {}", e);
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "Invalid request format. Please check your JSON data.",
                "data": null
            }));
        }
    };
    
    let pool = state.mysql_db();
    
    // 验证表名和字段名
    if !is_valid_identifier(&req.table_name) || !is_valid_identifier(&req.column_name) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name or column name",
            "data": null
        }));
    }
    
    let alter_sql = format!(
        "ALTER TABLE `{}` DROP COLUMN `{}`",
        req.table_name, req.column_name
    );
    
    log::info!("Executing SQL: {}", alter_sql);
    
    match sqlx::query(&alter_sql)
        .execute(pool)
        .await
    {
        Ok(_) => {
            log::info!("Column '{}' deleted from table '{}'", req.column_name, req.table_name);
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Column deleted successfully",
                "data": {
                    "table_name": req.table_name,
                    "column_name": req.column_name
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to delete column: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to delete column: {}", e),
                "data": null
            }))
        }
    }
}

/// 执行自定义SQL
#[derive(Debug, Deserialize)]
pub struct ExecuteSqlRequest {
    pub sql: String,
}

pub async fn execute_sql(
    state: web::Data<crate::state::AppState>,
    req: web::Json<ExecuteSqlRequest>,
) -> impl Responder {
    let pool = state.mysql_db();
    let sql = req.sql.trim();
    
    // 安全检查：只允许执行ALTER、CREATE、DROP语句
    let upper_sql = sql.to_uppercase();
    if !upper_sql.starts_with("ALTER") && !upper_sql.starts_with("CREATE") && !upper_sql.starts_with("DROP") {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Only ALTER, CREATE, DROP statements are allowed",
            "data": null
        }));
    }
    
    match sqlx::query(sql)
        .execute(pool)
        .await
    {
        Ok(result) => {
            log::info!("SQL executed successfully: {}", sql);
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "SQL executed successfully",
                "data": {
                    "rows_affected": result.rows_affected()
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to execute SQL: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to execute SQL: {}", e),
                "data": null
            }))
        }
    }
}

/// 验证标识符是否有效（防止SQL注入）
fn is_valid_identifier(name: &str) -> bool {
    if name.is_empty() || name.len() > 64 {
        return false;
    }
    
    // 只允许字母、数字、下划线
    name.chars().all(|c| c.is_alphanumeric() || c == '_')
}

/// 转义SQL字符串
fn escape_sql_string(s: &str) -> String {
    s.replace('\'', "''")
}

/// 查询表数据请求
#[derive(Debug, Deserialize)]
pub struct QueryTableDataRequest {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub order_by: Option<String>,
    pub order_direction: Option<String>,
    pub where_clause: Option<String>,
}

/// 查询表数据
pub async fn query_table_data(
    state: web::Data<crate::state::AppState>,
    table_name: web::Path<String>,
    query: web::Query<QueryTableDataRequest>,
) -> impl Responder {
    let pool = state.mysql_db();
    let table_name = table_name.into_inner();
    
    // 验证表名
    if !is_valid_identifier(&table_name) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name",
            "data": null
        }));
    }
    
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);
    let offset = (page - 1) * page_size;
    
    // 构建WHERE子句
    let where_clause = if let Some(clause) = &query.where_clause {
        if clause.trim().is_empty() {
            String::new()
        } else {
            format!("WHERE {}", clause)
        }
    } else {
        String::new()
    };
    
    // 构建ORDER BY子句
    let order_clause = if let Some(column) = &query.order_by {
        if is_valid_identifier(column) {
            let direction = query.order_direction.as_ref()
                .map(|d| d.as_str())
                .unwrap_or("ASC");
            format!("ORDER BY {} {}", column, direction)
        } else {
            String::new()
        }
    } else {
        String::new()
    };
    
    // 构建COUNT查询
    let count_query = format!(
        "SELECT COUNT(*) as total FROM `{}` {}",
        table_name, where_clause
    );
    
    // 构建数据查询
    let data_query = format!(
        "SELECT * FROM `{}` {} {} LIMIT {} OFFSET {}",
        table_name, where_clause, order_clause, page_size, offset
    );
    
    // 执行COUNT查询
    let total = match sqlx::query(&count_query)
        .fetch_one(pool)
        .await
    {
        Ok(row) => {
            row.get::<i64, _>("total")
        }
        Err(e) => {
            log::error!("Failed to count rows: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to count rows: {}", e),
                "data": null
            }));
        }
    };
    
    // 执行数据查询
    match sqlx::query(&data_query)
        .fetch_all(pool)
        .await
    {
        Ok(rows) => {
            let mut data = Vec::new();
            for row in rows {
                let mut row_data = serde_json::Map::new();
                
                // 获取所有列的名称
                let columns: Vec<String> = row.columns()
                    .iter()
                    .map(|col| col.name().to_string())
                    .collect();
                
                // 为每列获取值
                for col_name in &columns {
                    // 尝试多种类型获取值
                    let value: Option<String> = 
                        // 首先尝试作为字符串获取
                        row.try_get::<String, _>(col_name.as_str())
                            .ok()
                            .or_else(|| {
                                // 尝试作为整数获取
                                row.try_get::<i64, _>(col_name.as_str())
                                    .ok()
                                    .map(|v| v.to_string())
                            })
                            .or_else(|| {
                                // 尝试作为浮点数获取
                                row.try_get::<f64, _>(col_name.as_str())
                                    .ok()
                                    .map(|v| v.to_string())
                            })
                            .or_else(|| {
                                // 尝试作为布尔值获取
                                row.try_get::<bool, _>(col_name.as_str())
                                    .ok()
                                    .map(|v| v.to_string())
                            });
                    
                    row_data.insert(col_name.clone(), json!(value));
                }
                
                data.push(serde_json::Value::Object(row_data));
            }
            
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "success",
                "data": {
                    "items": data,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": ((total + page_size as i64 - 1) / page_size as i64) as u64
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to query table data: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to query table data: {}", e),
                "data": null
            }))
        }
    }
}

/// 插入数据请求
#[derive(Debug, Deserialize)]
pub struct InsertDataRequest {
    pub table_name: String,
    pub data: serde_json::Value,
}

/// 插入数据
pub async fn insert_data(
    state: web::Data<crate::state::AppState>,
    req: web::Json<InsertDataRequest>,
) -> impl Responder {
    let pool = state.mysql_db();
    
    // 验证表名
    if !is_valid_identifier(&req.table_name) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name",
            "data": null
        }));
    }
    
    // 验证数据
    if let Some(data_map) = req.data.as_object() {
        if data_map.is_empty() {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "Data cannot be empty",
                "data": null
            }));
        }
        
        // 获取表结构以获取列名
        let columns_query = format!(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{}'",
            req.table_name
        );
        
        let table_columns: Vec<String> = match sqlx::query(&columns_query)
            .fetch_all(pool)
            .await
        {
            Ok(rows) => {
                rows.iter()
                    .filter_map(|row| row.try_get::<String, _>("COLUMN_NAME").ok())
                    .collect()
            }
            Err(e) => {
                log::error!("Failed to get table columns: {}", e);
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "code": 500,
                    "message": format!("Failed to get table columns: {}", e),
                    "data": null
                }));
            }
        };
        
        // 验证列名并构建INSERT语句
        let mut valid_columns = Vec::new();
        let mut valid_values = Vec::new();
        
        for (key, value) in data_map {
            if table_columns.contains(&key) && is_valid_identifier(&key) {
                valid_columns.push(format!("`{}`", key));
                
                // 转义值
                let value_str = match value {
                    serde_json::Value::String(s) => format!("'{}'", escape_sql_string(s)),
                    serde_json::Value::Number(n) => n.to_string(),
                    serde_json::Value::Bool(b) => if *b { "1".to_string() } else { "0".to_string() },
                    serde_json::Value::Null => "NULL".to_string(),
                    _ => {
                        log::warn!("Unsupported value type for column: {}", key);
                        continue;
                    }
                };
                valid_values.push(value_str);
            }
        }
        
        if valid_columns.is_empty() {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "No valid columns found in data",
                "data": null
            }));
        }
        
        let insert_sql = format!(
            "INSERT INTO `{}` ({}) VALUES ({})",
            req.table_name,
            valid_columns.join(", "),
            valid_values.join(", ")
        );
        
        match sqlx::query(&insert_sql)
            .execute(pool)
            .await
        {
            Ok(result) => {
                log::info!("Inserted {} rows into table '{}'", result.rows_affected(), req.table_name);
                HttpResponse::Ok().json(serde_json::json!({
                    "code": 200,
                    "message": "Data inserted successfully",
                    "data": {
                        "rows_affected": result.rows_affected()
                    }
                }))
            }
            Err(e) => {
                log::error!("Failed to insert data: {}", e);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "code": 500,
                    "message": format!("Failed to insert data: {}", e),
                    "data": null
                }))
            }
        }
    } else {
        HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Data must be an object",
            "data": null
        }))
    }
}

/// 更新数据请求
#[derive(Debug, Deserialize)]
pub struct UpdateDataRequest {
    pub table_name: String,
    pub where_column: String,
    pub where_value: String,
    pub data: serde_json::Value,
}

/// 更新数据
pub async fn update_data(
    state: web::Data<crate::state::AppState>,
    req: web::Json<UpdateDataRequest>,
) -> impl Responder {
    let pool = state.mysql_db();
    
    // 验证表名和where列名
    if !is_valid_identifier(&req.table_name) || !is_valid_identifier(&req.where_column) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name or where column name",
            "data": null
        }));
    }
    
    // 验证数据
    if let Some(data_map) = req.data.as_object() {
        if data_map.is_empty() {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "Data cannot be empty",
                "data": null
            }));
        }
        
        // 构建SET子句
        let mut set_clauses = Vec::new();
        
        for (key, value) in data_map {
            if is_valid_identifier(&key) {
                let value_str = match value {
                    serde_json::Value::String(s) => format!("'{}'", escape_sql_string(s)),
                    serde_json::Value::Number(n) => n.to_string(),
                    serde_json::Value::Bool(b) => if *b { "1".to_string() } else { "0".to_string() },
                    serde_json::Value::Null => "NULL".to_string(),
                    _ => {
                        log::warn!("Unsupported value type for column: {}", key);
                        continue;
                    }
                };
                set_clauses.push(format!("`{}` = {}", key, value_str));
            }
        }
        
        if set_clauses.is_empty() {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": "No valid columns found in data",
                "data": null
            }));
        }
        
        let update_sql = format!(
            "UPDATE `{}` SET {} WHERE `{}` = '{}'",
            req.table_name,
            set_clauses.join(", "),
            req.where_column,
            escape_sql_string(&req.where_value)
        );
        
        match sqlx::query(&update_sql)
            .execute(pool)
            .await
        {
            Ok(result) => {
                log::info!("Updated {} rows in table '{}'", result.rows_affected(), req.table_name);
                HttpResponse::Ok().json(serde_json::json!({
                    "code": 200,
                    "message": "Data updated successfully",
                    "data": {
                        "rows_affected": result.rows_affected()
                    }
                }))
            }
            Err(e) => {
                log::error!("Failed to update data: {}", e);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "code": 500,
                    "message": format!("Failed to update data: {}", e),
                    "data": null
                }))
            }
        }
    } else {
        HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Data must be an object",
            "data": null
        }))
    }
}

/// 删除数据请求
#[derive(Debug, Deserialize)]
pub struct DeleteDataRequest {
    pub table_name: String,
    pub where_column: String,
    pub where_value: String,
}

/// 删除数据
pub async fn delete_data(
    state: web::Data<crate::state::AppState>,
    req: web::Json<DeleteDataRequest>,
) -> impl Responder {
    let pool = state.mysql_db();
    
    // 验证表名和where列名
    if !is_valid_identifier(&req.table_name) || !is_valid_identifier(&req.where_column) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "Invalid table name or where column name",
            "data": null
        }));
    }
    
    let delete_sql = format!(
        "DELETE FROM `{}` WHERE `{}` = '{}'",
        req.table_name,
        req.where_column,
        escape_sql_string(&req.where_value)
    );
    
    match sqlx::query(&delete_sql)
        .execute(pool)
        .await
    {
        Ok(result) => {
            log::info!("Deleted {} rows from table '{}'", result.rows_affected(), req.table_name);
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Data deleted successfully",
                "data": {
                    "rows_affected": result.rows_affected()
                }
            }))
        }
        Err(e) => {
            log::error!("Failed to delete data: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to delete data: {}", e),
                "data": null
            }))
        }
    }
}