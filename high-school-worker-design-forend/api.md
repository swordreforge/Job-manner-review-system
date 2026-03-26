# Career API 接口文档

Base URL: `/api/v1`

## 目录

- [通用接口](#通用接口)
- [用户接口](#用户接口)
- [学生接口](#学生接口)
- [职位接口](#职位接口)
- [匹配接口](#匹配接口)
- [职业报告接口](#职业报告接口)
- [职业路径图接口](#职业路径图接口)

---

## 通用接口

### 健康检查

**GET** `/health`

返回示例:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## 用户接口

### 用户注册

**POST** `/user/register`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| email | string | 是 | 邮箱 |
| phone | string | 否 | 手机号 |

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "test",
    "email": "test@example.com",
    "phone": "13800138000",
    "role": "student",
    "createdAt": 1704067200
  }
}
```

### 用户登录

**POST** `/user/login`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": 1706745600,
    "userId": 1
  }
}
```

### 获取用户信息

**GET** `/user/info`

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "test",
    "email": "test@example.com",
    "phone": "13800138000",
    "role": "student",
    "createdAt": 1704067200
  }
}
```

### 更新用户信息

**PUT** `/user/info`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |

返回: 同获取用户信息

---

## 学生接口

### 创建学生档案

**POST** `/students`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 姓名 |
| education | string | 否 | 学历 |
| major | string | 否 | 专业 |
| graduationYear | int | 否 | 毕业年份 |
| skills | array | 否 | 技能列表 |
| certificates | array | 否 | 证书列表 |
| softSkills | object | 否 | 软技能 |
| internship | array | 否 | 实习经历 |
| projects | array | 否 | 项目经验 |

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

### 更新学生档案

**PUT** `/students`

请求体: 同创建，增加 `id` 字段

### 获取学生档案

**GET** `/students/:id`

### 删除学生档案

**DELETE** `/students/:id`

### 列表学生档案

**GET** `/students`

查询参数:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| pageSize | int | 10 | 每页数量 |
| major | string | - | 专业筛选 |
| education | string | - | 学历筛选 |

### 上传简历生成档案

**POST** `/students/resume`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fileContent | string | 是 | 文件内容(base64) |
| fileName | string | 是 | 文件名 |

### AI生成学生能力档案

**POST** `/students/generate`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resumeContent | string | 是 | 简历内容 |

### 获取当前学生档案

**GET** `/students/me`

---

## 职位接口

### 创建职位

**POST** `/jobs`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 职位名称 |
| description | string | 否 | 职位描述 |
| company | string | 否 | 公司 |
| industry | string | 否 | 行业 |
| location | string | 否 | 工作地点 |
| salaryRange | string | 否 | 薪资范围 |
| skills | array | 否 | 技能要求 |
| certificates | array | 否 | 证书要求 |
| softSkills | object | 否 | 软技能要求 |
| requirements | object | 否 | 任职要求 |

### 更新职位

**PUT** `/jobs`

请求体: 同创建，增加 `id` 字段

### 获取职位

**GET** `/jobs/:id`

### 删除职位

**DELETE** `/jobs/:id`

### 列表职位

**GET** `/jobs`

查询参数:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| pageSize | int | 10 | 每页数量 |
| industry | string | - | 行业筛选 |
| name | string | - | 职位名称筛选 |

### AI生成职位档案

**POST** `/jobs/generate`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| positionName | string | 是 | 职位名称 |
| industry | string | 否 | 行业 |
| rawData | string | 否 | 原始数据 |

---

## 匹配接口

### 匹配学生与单个职位

**POST** `/match`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | int64 | 是 | 学生ID |
| jobId | int64 | 是 | 职位ID |

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "jobId": 1,
    "jobName": "软件工程师",
    "overallScore": 85.5,
    "skillsMatch": 90.0,
    "certsMatch": 80.0,
    "softSkillsMatch": 85.0,
    "experienceMatch": 75.0,
    "gapAnalysis": [...]
  }
}
```

### 匹配学生与多个职位

**POST** `/match/jobs`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | int64 | 是 | 学生ID |
| page | int | - | 页码 |
| pageSize | int | - | 每页数量 |
| minScore | float64 | - | 最低分数 |
| industry | string | - | 行业筛选 |

### 获取匹配分数

**GET** `/match/:studentId/:jobId/score`

### 获取推荐职位

**GET** `/match/:studentId/recommend`

查询参数同列表请求

---

## 职业报告接口

### 生成职业发展报告

**POST** `/reports/generate`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | int64 | 是 | 学生ID |
| targetJobId | int64 | 否 | 目标职位ID |
| options | object | 否 | 选项 |

options:
| 字段 | 类型 | 说明 |
|------|------|------|
| includeGapAnalysis | bool | 包含差距分析 |
| includeActionPlan | bool | 包含行动计划 |
| detailedLevel | int | 详细程度 |

### 获取报告

**GET** `/reports/:id`

### 更新报告

**PUT** `/reports`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int64 | 是 | 报告ID |
| title | string | 否 | 标题 |
| content | string | 否 | 内容 |
| status | string | 否 | 状态 |

### 删除报告

**DELETE** `/reports/:id`

### 列表报告

**GET** `/reports`

查询参数:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| pageSize | int | 10 | 每页数量 |
| studentId | int64 | - | 学生ID |
| status | string | - | 状态筛选 |

### 导出报告

**POST** `/reports/export`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reportId | int64 | 是 | 报告ID |
| format | string | 是 | 格式(pdf\|docx\|json) |

### 优化报告

**POST** `/reports/polish`

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reportId | int64 | 是 | 报告ID |
| level | string | 是 | 优化级别(light\|normal\|thorough) |

### 检查报告完整性

**GET** `/reports/:id/completeness`

### 获取我的报告

**GET** `/reports/me`

---

## 职业路径图接口

### 获取晋升路径

**GET** `/jobs/:id/promotion-path`

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "jobId": 1,
    "jobName": "软件工程师",
    "nextJobs": [...]
  }
}
```

### 获取转职路径

**GET** `/jobs/:id/transfer-paths`

返回:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "fromJob": { ... },
      "toJob": { ... },
      "matchScore": 75.0,
      "transferSkills": [...],
      "learningPath": [...]
    }
  ]
}
```

### 获取所有路径

**GET** `/jobs/:id/all-paths`

### 获取相关职位

**GET** `/jobs/:id/related`

查询参数:
| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 类型(promotion\|transfer\|related) |

---

## 通用响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

### 错误响应
```json
{
  "code": 1001,
  "msg": "错误信息"
}
```

### 分页响应
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 100,
    "list": [...]
  }
}
```
