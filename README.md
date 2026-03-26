# Career Planning API

基于 go-zero 的高性能大学生职业规划智能体 API，支持 DeepSeek AI 能力。

## 快速开始

### 1. 安装依赖

```bash
go mod tidy
```

### 2. 配置

编辑 `etc/career-api.yaml`:

```yaml
AI:
  ApiKey: your-deepseek-api-key
  Model: deepseek-chat
  BaseURL: https://api.deepseek.com/v1
  Timeout: 60
```

### 3. 启动服务

```bash
go build -o career-api .
./career-api -f etc/career-api.yaml
```

服务将在 `http://localhost:8888` 启动。

---

## API 文档

### 健康检查

```bash
GET /health
```

**响应:**
```json
{"status":"ok","version":"1.0.0"}
```

---

### 岗位管理

#### 生成岗位画像 (AI)

```bash
POST /api/v1/jobs/generate
Content-Type: application/json

{
  "positionName": "Golang Backend Engineer",
  "industry": "Technology",
  "rawData": "optional additional job description"
}
```

**响应:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 123456789,
    "name": "Golang Backend Engineer",
    "description": "# Job Profile...\n\n## Key Responsibilities\n- Design, develop...",
    "industry": "Technology",
    "skills": [
      {"name": "Go", "level": 4, "required": true},
      {"name": "Docker", "level": 3, "required": false}
    ],
    "softSkills": {
      "innovation": 4,
      "learning": 5,
      "pressure": 4,
      "communication": 4,
      "teamwork": 5
    }
  }
}
```

#### 获取岗位列表

```bash
GET /api/v1/jobs?page=1&pageSize=10&industry=Technology
```

#### 获取单个岗位

```bash
GET /api/v1/jobs/:id
```

#### 创建岗位

```bash
POST /api/v1/jobs
Content-Type: application/json

{
  "name": "Software Engineer",
  "industry": "Technology",
  "location": "Beijing",
  "salaryRange": "20k-40k"
}
```

#### 更新岗位

```bash
PUT /api/v1/jobs
Content-Type: application/json

{
  "id": 123,
  "name": "Senior Software Engineer"
}
```

#### 删除岗位

```bash
DELETE /api/v1/jobs/:id
```

---

### 岗位图谱

#### 获取晋升路径

```bash
GET /api/v1/jobs/:id/promotion-path
```

**响应:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "jobId": 1,
    "jobName": "Software Engineer",
    "nextJobs": [
      {"id": 2, "name": "Senior Software Engineer", "level": 2},
      {"id": 3, "name": "Tech Lead", "level": 3}
    ]
  }
}
```

#### 获取换岗路径

```bash
GET /api/v1/jobs/:id/transfer-paths
```

#### 获取所有路径

```bash
GET /api/v1/jobs/:id/all-paths
```

#### 获取相关岗位

```bash
GET /api/v1/jobs/:id/related?type=related
```

---

### 学生画像

#### 创建学生画像

```bash
POST /api/v1/students
Content-Type: application/json

{
  "name": "张三",
  "education": "本科",
  "major": "计算机科学",
  "graduationYear": 2025,
  "skills": [
    {"name": "Go", "level": 4, "years": 2},
    {"name": "Python", "level": 3, "years": 1}
  ],
  "certificates": [
    {"name": "AWS认证", "level": "助理级", "year": 2024}
  ],
  "softSkills": {
    "innovation": 4,
    "learning": 5,
    "pressure": 4,
    "communication": 4,
    "teamwork": 5
  },
  "internship": [
    {"company": "某科技公司", "position": "后端实习生", "duration": 3}
  ]
}
```

#### 上传简历生成画像 (AI)

```bash
POST /api/v1/students/resume
Content-Type: application/json

{
  "fileContent": "简历文本内容...",
  "fileName": "resume.pdf"
}
```

#### 获取学生画像

```bash
GET /api/v1/students/:id
```

#### 获取当前用户画像

```bash
GET /api/v1/students/me
```

#### 获取学生列表

```bash
GET /api/v1/students?page=1&pageSize=10&major=计算机科学
```

---

### 人岗匹配

#### 匹配单个岗位

```bash
POST /api/v1/match
Content-Type: application/json

{
  "studentId": 1,
  "jobId": 1
}
```

**响应:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "jobId": 1,
    "jobName": "Software Engineer",
    "overallScore": 78.5,
    "skillsMatch": 82.0,
    "certsMatch": 65.0,
    "softSkillsMatch": 85.0,
    "experienceMatch": 70.0,
    "gapAnalysis": [
      {
        "attribute": "Go Programming",
        "required": 4,
        "current": 3,
        "gapPercent": 25,
        "suggestion": "Practice Go concurrency patterns"
      }
    ]
  }
}
```

#### 匹配多个岗位

```bash
POST /api/v1/match/jobs
Content-Type: application/json

{
  "studentId": 1,
  "page": 1,
  "pageSize": 10,
  "minScore": 60,
  "industry": "Technology"
}
```

#### 获取推荐岗位

```bash
GET /api/v1/match/:studentId/recommend?page=1&pageSize=10
```

---

### 职业报告

#### 生成职业发展报告 (AI)

```bash
POST /api/v1/reports/generate
Content-Type: application/json

{
  "studentId": 1,
  "targetJobId": 1,
  "options": {
    "includeGapAnalysis": true,
    "includeActionPlan": true,
    "detailedLevel": 2
  }
}
```

#### 获取报告

```bash
GET /api/v1/reports/:id
```

#### 更新报告

```bash
PUT /api/v1/reports
Content-Type: application/json

{
  "id": 1,
  "title": "我的职业规划报告",
  "content": "报告内容...",
  "status": "draft"
}
```

#### 列表报告

```bash
GET /api/v1/reports?page=1&pageSize=10&studentId=1
```

#### 导出报告

```bash
POST /api/v1/reports/export
Content-Type: application/json

{
  "reportId": 1,
  "format": "pdf"
}
```

#### 润色报告 (AI)

```bash
POST /api/v1/reports/polish
Content-Type: application/json

{
  "reportId": 1,
  "level": "normal"
}
```

#### 检查报告完整性

```bash
GET /api/v1/reports/:id/completeness
```

#### 获取我的报告

```bash
GET /api/v1/reports/me
```

---

### 用户认证

#### 注册

```bash
POST /api/v1/user/register
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "password123",
  "email": "zhangsan@example.com"
}
```

#### 登录

```bash
POST /api/v1/user/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "password123"
}
```

#### 获取用户信息

```bash
GET /api/v1/user/info
```

#### 更新用户信息

```bash
PUT /api/v1/user/info
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "13800138000"
}
```

---

## 项目结构

```
career-api/
├── api/                    # API 定义文件
│   ├── career.api         # 主 API (导入其他模块)
│   ├── job.api           # 岗位相关 API
│   ├── graph.api         # 岗位图谱 API
│   ├── student.api       # 学生画像 API
│   ├── match.api         # 人岗匹配 API
│   └── report.api        # 职业报告 API
├── cmd/                   # 命令行工具
│   └── test-ai/          # AI 连接测试
├── common/                # 公共模块
│   ├── errors/           # 错误码定义
│   ├── middleware/       # 中间件
│   └── pkg/              # AI Provider
├── etc/                   # 配置文件
│   └── career-api.yaml
├── internal/             # 内部模块
│   ├── config/           # 配置定义
│   ├── handler/         # HTTP 处理器
│   ├── logic/            # 业务逻辑
│   ├── svc/              # 服务上下文
│   └── types/            # 请求/响应类型
└── career.go             # 程序入口
```

---

## 技术栈

- **框架**: go-zero
- **AI**: DeepSeek API (OpenAI compatible)
- **配置**: YAML
- **日志**: JSON logs with trace ID

---

## 配置说明

```yaml
Name: career-api
Host: 0.0.0.0
Port: 8888
Mode: dev  # dev | test | prod

Timeout: 120000  # 请求超时(ms)

Mysql:
  DataSource: user:password@tcp(host:port)/dbname

Redis:
  Host: localhost:6379

AI:
  Provider: deepseek
  ApiKey: your-api-key
  Model: deepseek-chat
  BaseURL: https://api.deepseek.com/v1
  Timeout: 60

RateLimit:
  TokensPerSecond: 100
  Burst: 200
```

---

## 测试 AI 连接

```bash
go run cmd/test-ai/main.go
```

需要设置环境变量:
```bash
export DEEPSEEK_API_KEY="your-api-key"
go run cmd/test-ai/main.go
```
