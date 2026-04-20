# 数据导出为 XLSX 功能设计

## 概述

在现有数据导入功能基础上，为岗位、学生、学校三个实体添加数据导出为 xlsx 的功能。导出文件格式与导入模板一致，确保导出的数据可以直接再导入。

## 架构

### 后端端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/jobs/export` | GET | 导出全部岗位数据为 xlsx |
| `/api/v1/students/export` | GET | 导出全部学生数据为 xlsx |
| `/api/v1/schools/export` | GET | 导出全部学校数据为 xlsx |

### 流程

1. 前端点击"导出"按钮
2. 浏览器直接请求 `/export` 端点
3. 后端查询全部数据 → 用 `rust_xlsxwriter` 生成 xlsx → 流式返回文件
4. 浏览器自动下载文件

## 导出字段（与导入模板一致）

### 岗位（18列）

| 列序 | 中文列头 | 对应字段 |
|------|---------|---------|
| 1 | 岗位名称 | name |
| 2 | 岗位详情 | job_detail |
| 3 | 公司名称 | company |
| 4 | 所属行业 | industry |
| 5 | 类别 | category |
| 6 | 地点 | location |
| 7 | 薪资范围 | salary_range |
| 8 | 岗位编码 | job_code |
| 9 | 公司规模 | company_scale |
| 10 | 公司类型(融资状态) | company_funding_status |
| 11 | 公司详情 | company_description |
| 12 | 岗位来源地址 | source_url |
| 13 | 更新日期 | update_date |
| 14 | 技能要求 | skills |
| 15 | 证书要求 | certificates |
| 16 | 软技能 | soft_skills |
| 17 | 岗位要求 | requirements |
| 18 | 成长潜力 | growth_potential |

### 学生（10列）

| 列序 | 中文列头 | 对应字段 |
|------|---------|---------|
| 1 | 姓名 | name |
| 2 | 学历 | education |
| 3 | 专业 | major |
| 4 | 毕业年份 | graduation_year (i64 → String) |
| 5 | 技能 | skills |
| 6 | 证书 | certificates |
| 7 | 软技能 | soft_skills |
| 8 | 实习经历 | internship |
| 9 | 项目经验 | projects |
| 10 | 备注 | (留空，与模板一致) |

### 学校（5列）

| 列序 | 中文列头 | 对应字段 |
|------|---------|---------|
| 1 | 学校名称 | name |
| 2 | 地址 | address |
| 3 | 联系人 | contact_person |
| 4 | 联系电话 | contact_phone |
| 5 | 联系邮箱 | contact_email |

## 实现细节

### 后端

- 每个实体的 handler 中新增 `export` 函数
- 使用现有的 `rust_xlsxwriter` 库生成 xlsx
- 查询所有数据（不分页），使用 `list_all` 或新增无分页查询方法
- 设置响应头：`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 设置 `Content-Disposition: attachment; filename="{entity}_export.xlsx"`
- 数据库字段值 `None` 写入为空字符串
- `graduation_year` (i64) 转为字符串写入

### 前端

- 在每个实体的管理页面添加"导出"按钮（与导入按钮相邻）
- 点击按钮触发浏览器下载，使用隐藏 `<a>` 标签或 `window.open`
- 下载文件名格式：`{entity}_export.xlsx`

### 路由注册

在 `src/routes.rs` 中为每个实体添加 export 路由。

## 技术依赖

- `rust_xlsxwriter`（已有）— 生成 xlsx 文件
- 无新增依赖

## 文件变更清单

- `src/handlers/job.rs` — 新增 `export_jobs` handler
- `src/handlers/student.rs` — 新增 `export_students` handler
- `src/handlers/school.rs` — 新增 `export_schools` handler
- `src/db/job.rs` — 新增 `list_all_jobs` 查询（无分页）
- `src/db/student.rs` — 新增 `list_all_students` 查询（无分页）
- `src/db/school.rs` — 新增 `list_all_schools` 查询（无分页）
- `src/routes.rs` — 注册 3 个 export 路由
- `template/index.html` — 添加导出按钮
- `template/app.js` — 添加导出按钮事件处理