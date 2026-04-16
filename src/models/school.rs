use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 学校数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct School {
    pub id: i64,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 学校响应模型（简化版）
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

impl From<School> for SchoolResponse {
    fn from(school: School) -> Self {
        SchoolResponse {
            id: school.id,
            name: school.name,
            code: school.code,
            address: school.address,
            contact_person: school.contact_person,
            contact_phone: school.contact_phone,
            contact_email: school.contact_email,
            status: school.status,
            created_at: school.created_at,
        }
    }
}

/// 创建学校请求
#[derive(Debug, Deserialize, validator::Validate)]
pub struct CreateSchoolRequest {
    #[validate(length(min = 2, max = 100, message = "学校名称长度必须在2-100字符之间"))]
    pub name: String,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
}

/// 更新学校请求
#[derive(Debug, Deserialize, validator::Validate)]
pub struct UpdateSchoolRequest {
    #[validate(length(min = 2, max = 100, message = "学校名称长度必须在2-100字符之间"))]
    pub name: Option<String>,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub status: Option<String>,
}

/// 学校查询参数
#[derive(Debug, Deserialize)]
pub struct SchoolQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
    pub status: Option<String>,
}

/// 学校列表响应
#[derive(Debug, Serialize)]
pub struct SchoolListResponse {
    pub total: i64,
    pub page: u64,
    pub page_size: u64,
    pub list: Vec<SchoolResponse>,
}

/// 批量导入学校请求
#[derive(Debug, Deserialize)]
pub struct BatchImportSchoolsRequest {
    pub file: String,  // Base64 编码的 Excel 文件
}

/// 批量导入学校结果
#[derive(Debug, Serialize)]
pub struct SchoolImportResult {
    pub total: u32,
    pub success: u32,
    pub failed: u32,
    pub errors: Vec<SchoolImportError>,
}

/// 批量导入学校错误
#[derive(Debug, Serialize)]
pub struct SchoolImportError {
    pub row: u32,
    pub message: String,
}