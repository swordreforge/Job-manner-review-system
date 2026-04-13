use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::Row;

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
                let created_time: Option<chrono::NaiveDateTime> = row.get("created_time");
                
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
                    created_time: created_time.map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string()),
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
                ColumnInfo {
                    column_name: row.get("column_name"),
                    data_type: row.get("data_type"),
                    is_nullable: row.get("is_nullable"),
                    column_key: row.get("column_key"),
                    column_default: row.get("column_default"),
                    extra: row.get("extra"),
                    column_comment: row.get("column_comment"),
                    ordinal_position: row.get("ordinal_position"),
                }
            }).collect();
            
            // 获取表的CREATE语句
            let create_table_query = format!("SHOW CREATE TABLE `{}`", table_name);
            let create_statement = match sqlx::query(&create_table_query)
                .fetch_one(pool)
                .await
            {
                Ok(row) => {
                    row.get::<String, _>("Create Table")
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
    req: web::Json<AddColumnRequest>,
) -> impl Responder {
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
        alter_sql.push_str(&format!(" DEFAULT '{}'", escape_sql_string(default)));
    }
    
    // 添加注释
    if let Some(comment) = &req.comment {
        alter_sql.push_str(&format!(" COMMENT '{}'", escape_sql_string(comment)));
    }
    
    // 添加位置
    if let Some(after) = &req.after_column {
        alter_sql.push_str(&format!(" AFTER `{}`", after));
    } else {
        alter_sql.push_str(" FIRST");
    }
    
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
    req: web::Json<ModifyColumnRequest>,
) -> impl Responder {
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
        alter_sql.push_str(&format!(" DEFAULT '{}'", escape_sql_string(default)));
    }
    
    // 添加注释
    if let Some(comment) = &req.comment {
        alter_sql.push_str(&format!(" COMMENT '{}'", escape_sql_string(comment)));
    }
    
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
    req: web::Json<DeleteColumnRequest>,
) -> impl Responder {
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