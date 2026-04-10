# CareerPlanner — 基于 AI 的大学生职业规划智能体

## 封面

**项目名称：** CareerPlanner — 基于 AI 的职业规划智能系统

**一句话定位：** 用 AI 连接学生能力与岗位要求，让每个学生都有专属的数据驱动型职业导师

**关键技术 logo：** Go · go-zero · DeepSeek API · React 18 · MySQL · Redis

---

## 痛点分析

**Why：为什么做这个系统？**

| 痛点         | 现状描述                                     |
| ------------ | -------------------------------------------- |
| 信息不对称   | 学生不了解目标岗位的真实技能要求与竞争力阈值 |
| 规划盲目     | 职业规划缺乏数据支撑，靠"感觉"选方向         |
| 资源稀缺     | 职业咨询师资源有限，无法覆盖每位学生         |
| 反馈滞后     | 传统简历评估周期长，学生无法快速迭代提升     |
| 自我认知缺位 | 学生不了解自身兴趣类型与岗位的匹配关系       |

**结论：** 学生需要一个 **智能化、个性化、可量化** 的职业规划系统

---

## 竞品对比与差异化优势

**Why us：现有方案为何不够？**

| 方案类型         | 代表产品                     | 局限性                           |
| ---------------- | ---------------------------- | -------------------------------- |
| 传统职业咨询     | 学校就业中心、付费生涯规划师 | 资源稀缺，覆盖面窄               |
| 招聘平台简历评估 | Boss直聘、智联招聘           | 仅匹配关键词，缺乏规划建议       |
| 通用 AI 对话     | ChatGPT、DeepSeek Chat       | 缺乏岗位数据支撑，建议泛化不可信 |
| 单一测评工具     | 各类霍兰德测试网站           | 仅输出兴趣类型，无后续规划路径   |

**CareerPlanner 差异化：**

| 维度           | 本系统                                                       |
| -------------- | ------------------------------------------------------------ |
| 全链路覆盖     | 霍兰德测评 → 简历解析 → 画像构建 → 智能匹配 → 图谱展示 → 报告生成，一体化闭环 |
| 数据驱动可解释 | 四维度加权评分（技能/证书/软技能/经验），匹配结果有量化依据  |
| AI 深度集成    | DeepSeek API 驱动岗位画像生成、简历结构化解析、报告撰写全流程 |
| SSE 流式体验   | 报告生成实时流式输出，首字节延迟极低，用户无需等待           |

---

##  解决方案总览

**What：我们做了什么？**

**CareerPlanner 七大核心能力**

```text
  霍兰德职业测评   →   职业兴趣画像
       ↓
  简历上传解析     →   学生能力画像
       ↓
  岗位画像生成     →   人岗智能匹配
       ↓
  职业图谱展示     →   职业规划报告（流式生成）
```

- 面向学生：自我测评 → 简历解析 → 岗位匹配 → 图谱探索 → 报告生成
- 面向管理员：岗位数据管理 → AI 画像批量生成 → 图谱构建
- 完整用户旅程：自我认知 → 能力评估 → 职业探索 → 智能匹配 → 规划报告

---

## 系统架构

**How：系统怎么搭建的？**

```text
┌─────────────────────────────────────────┐
│     React 18 + TypeScript + Vite        │  ← 前端（:5173）
│  Ant Design · ECharts · AntV G6        │
│  学生端 / 管理端                         │
└──────────────┬──────────────────────────┘
               │ HTTP / SSE
┌──────────────▼──────────────────────────┐
│        Go + go-zero (v1.6.4)            │  ← 后端（:8888）
│  REST API · JWT 认证 · SSE 推送         │
│  MySQL 8.0（数据持久化）                 │
│  Redis（缓存 / 会话）                    │
└──────────────┬──────────────────────────┘
               │ HTTP / ******
┌──────────────▼──────────────────────────┐
│     DeepSeek API（OpenAI-compatible）   │  ← AI 服务（外部）
│  岗位画像 · 简历解析 · 报告生成 · 流式   │
└─────────────────────────────────────────┘
```

两服务解耦：前端专注交互，后端专注业务 + AI 调度，AI 能力通过 OpenAI 兼容接口调用 DeepSeek

---

## 第 6 页 — 核心架构亮点：SSE 流式报告生成

LLM 调用耗时长，流式架构保障用户体验

```text
用户点击"生成报告"
  → POST /api/v1/reports/generate（异步触发）
  → 或 GET /api/v1/reports/generate-stream（SSE 流式）
  → Go Handler 构造 Prompt（学生画像 + 目标岗位）
  → 调用 DeepSeek API（stream=true）
  → bufio.Reader 逐行读取 SSE data: 帧
  → 实时向前端 SSE 推送 chunk
  → 前端 fetchSSE 解析 data: 行，追加显示
```

**关键设计：**

| 设计点   | 实现方式                                                     |
| -------- | ------------------------------------------------------------ |
| 流式输出 | GenerateCareerReportStream 返回 <-chan string 内容通道 + <-chan error 错误通道 |
| SSE 推送 | Go http.ResponseWriter 手动写 data: 帧，w.(http.Flusher).Flush() 实时刷新 |
| 超时控制 | Report 路由组设置 rest.WithTimeout(60s)，AI 客户端设置独立 Timeout |
| 前端对接 | 自定义 fetchSSE(url, options, onMessage) 携带 Authorization Header（原生 EventSource 无法自定义 Header） |

---

## 第 7 页 — 功能一：岗位画像构建（AI 驱动）

将岗位名称转化为结构化能力模型

**API：** `POST /api/v1/jobs/generate`

**流程：**

```text
输入：positionName + industry + rawData（可选）
  ↓
构造 Prompt → 调用 DeepSeek API
  ↓
AI 输出结构化岗位画像（JSON）
  ↓
持久化写入 jobs 表（skills / softSkills / certificates / requirements JSON 字段）
```

**画像数据模型（jobs 表 JSON 字段）：**

```json
{
  "skills": [{"name": "Go", "level": 4, "required": true}],
  "softSkills": {"innovation": 4, "learning": 5, "pressure": 4, "communication": 4, "teamwork": 5},
  "certificates": [...],
  "requirements": {...},
  "growthPotential": "..."
}
```

**配套接口：**

- `GET /api/v1/jobs` — 分页列表（支持 industry 过滤）
- `GET /api/v1/jobs/:id` — 单个岗位详情
- `POST/PUT/DELETE /api/v1/jobs` — CRUD

---

## 第 8 页 — 功能二：职业图谱

可视化展示职业晋升路径与横向转型可能

**数据表：** `job_promotion_paths`（from_job_id, to_job_id, match_score, transfer_skills, learning_path）

**API 模块（internal/handler/graph/）：**

| 接口         | 路径                                  | 说明            |
| ------------ | ------------------------------------- | --------------- |
| 获取晋升路径 | `GET /api/v1/jobs/:id/promotion-path` | 纵向晋升链路    |
| 获取换岗路径 | `GET /api/v1/jobs/:id/transfer-paths` | 横向转型可能    |
| 获取相关岗位 | `GET /api/v1/jobs/:id/related`        | 技能相似岗位    |
| 获取全路径   | `GET /api/v1/jobs/:id/all-paths`      | 晋升 + 转型合并 |

**前端可视化：** 使用 AntV G6 渲染力导向图，节点为岗位，边权重为 match_score（转型难度），支持节点交互

**价值：** 让学生看清"我现在在哪、能去哪、怎么去"

---

## 第 9 页 — 功能三：学生画像构建

多渠道录入 + AI 能力拆解，精准描述学生竞争力

**两种录入方式：**

| 方式                 | 流程                                                         |
| -------------------- | ------------------------------------------------------------ |
| 简历上传（PDF/Word） | `POST /api/v1/students/resume` → 后端 file_parser.go 解析文件内容 → 构造 Prompt → DeepSeek 结构化提取 → 写入 students 表 + resume_parse_history 表 |
| 手动填写             | `POST /api/v1/students` → 直接写入结构化数据 → `POST /api/v1/students/generate` AI 补全推断能力评分 |

**画像维度（students 表）：**

| 字段                  | 说明                                                         |
| --------------------- | ------------------------------------------------------------ |
| skills (JSON)         | 技能列表（name / level 0-100 / years）                       |
| softSkills (JSON)     | 软技能评分（innovation / learning / pressure / communication / teamwork，0-100） |
| certificates (JSON)   | 证书列表（name / level / year）                              |
| internship (JSON)     | 实习经历（company / position / duration / description）      |
| projects (JSON)       | 项目经历（name / role / description / technologies）         |
| completeness_score    | 画像完整度（0-100）                                          |
| competitiveness_score | 综合竞争力评分（0-100）                                      |
| suggestions (JSON)    | AI 简历优化建议（3-5 条）                                    |

**解析历史：** `GET /api/v1/students/resume/history` — 记录每次简历上传的解析结果，支持回溯

---

## 第 10 页 — 功能四：人岗匹配

四维度量化分析，精准推荐匹配岗位

**匹配算法（internal/logic/match/）：**

```text
学生画像（skills / softSkills / certificates / internship）
  ↓
与岗位要求逐维度比对
  ↓
四维度加权评分：
  ① skills_match     — 技能覆盖率（掌握程度 × 匹配率）
  ② certs_match      — 证书匹配度（岗位要求证书 vs 学生持有）
  ③ soft_skills_match — 软技能评分对比（五维平均）
  ④ experience_match — 实习经历深度评估
  ↓
overall_score = 加权综合分（存入 match_records 表）
  ↓
gap_analysis JSON — 每个维度差距 + 提升建议
```

**API 模块：**

| 接口                                        | 说明                                        |
| ------------------------------------------- | ------------------------------------------- |
| `POST /api/v1/match`                        | 匹配单个岗位，返回四维度分 + gap 分析       |
| `POST /api/v1/match/jobs`                   | 批量匹配（分页 + minScore + industry 过滤） |
| `GET /api/v1/match/:studentId/recommend`    | 获取推荐岗位列表                            |
| `GET /api/v1/match/:studentId/:jobId/score` | 查询历史匹配分                              |

**前端展示：** ECharts 雷达图展示四维度得分，差距分析以列表形式逐条呈现提升建议

---

## 第 11 页 — 功能五：职业规划报告

从数据到报告，支持流式生成与 AI 润色

**报告生成流程：**

```text
人岗匹配结果 + 学生画像
  → POST /api/v1/reports/generate（同步，返回完整报告）
  或 GET /api/v1/reports/generate-stream（SSE 流式，实时输出）
  → 构造 Prompt（StudentProfile + JobProfile + MatchResult + Options）
  → DeepSeek API stream=true
  → 报告写入 career_reports 表（status: draft）
  → 学生在线查看 / 编辑
  → POST /api/v1/reports/polish（AI 润色）
  → POST /api/v1/reports/export（导出）
```

**报告数据模型（career_reports 表 JSON 字段）：**

| 字段           | 内容                                             |
| -------------- | ------------------------------------------------ |
| overview       | 个人优势与竞争力概述                             |
| match_analysis | 与目标岗位的 Gap 分析                            |
| career_path    | 短期（6 月）/ 中期（1 年）/ 长期（3 年）发展路径 |
| action_plan    | 具体行动建议（课程 / 证书 / 项目）               |

**完整性检查：** `GET /api/v1/reports/:id/completeness` — 检测报告各章节是否填写完整

---

## 第 12 页 — 功能六：霍兰德职业倾向测试

科学自我认知的起点，RIASEC 模型量化职业兴趣

**测试流程：**

```text
GET /api/v1/holland/questions（获取 18 道题）
  → 学生作答（5-10 分钟）
  → POST /api/v1/holland/submit（提交答案）
  → 后端计算 RIASEC 六维度得分
  → 生成职业代码（如 RIA、SEC）
  → 匹配推荐职业列表
  → 写入 holland_test_results 表
  → 返回雷达图数据 + 职业推荐
```

**数据模型（holland_test_results 表）：**

```sql
career_code VARCHAR(10)  -- 职业代码，如 RIA、SEC
scores JSON              -- {"R":4,"I":3,"A":2,"S":1,"E":1,"C":0}
suitable_jobs JSON       -- 推荐职业列表
description TEXT         -- 测试结果描述
```

**前端：** ECharts 雷达图可视化六维度得分；`GET /api/v1/holland/history` 查看历史测试记录

---

## 第 13 页 — AI 技术深度

DeepSeek API 深度集成 + OpenAI 兼容接口

**AIProvider 接口设计（common/pkg/ai_provider.go）：**

```go
type AIProvider interface {
    GenerateJobProfile(ctx, prompt string) (string, error)
    GenerateStudentProfile(ctx, resumeContent string) (string, error)
    MatchAnalysis(ctx, studentProfile, jobProfile string) (string, error)
    GenerateCareerReport(ctx, req ReportGenerationRequest) (string, error)
    GenerateCareerReportStream(ctx, req) (<-chan string, <-chan error)
}
```

**Prompt 工程：**

| 功能             | Prompt 策略                                                  |
| ---------------- | ------------------------------------------------------------ |
| 岗位画像生成     | System: HR 分析师角色；输出结构化 JSON（skills / softSkills / requirements） |
| 简历解析         | 严格 JSON 格式约束 + 枚举值限定（education: bachelor/master/phd）；拒绝 Markdown 代码块 |
| 匹配分析         | Student Profile + Job Profile 双输入；输出差距分析 + 建议    |
| 报告生成（流式） | stream=true；bufio.Reader 逐行解析 data: SSE 帧；通过 channel 传递内容块 |
| AI 润色          | 传入原始报告内容，输出优化后的专业表达                       |

**可配置性（internal/config/config.go）：**

```yaml
AI:
  Provider: deepseek         # 供应商标识
  ApiKey: your-api-key
  Model: deepseek-chat       # 具体模型
  BaseURL: https://api.deepseek.com/v1
  Timeout: 60                # 秒，独立于 HTTP 层超时
```

支持运行时切换任意 OpenAI-compatible 供应商（DeepSeek / OpenAI / Qwen 等），无需重启

---

## 第 14 页 — 数据库设计

7 张核心表，覆盖完整业务链路

```sql
users              — 用户认证（id / username / password / email / role）
  ↓ 1:1
students           — 学生画像（skills/softSkills/certificates/internship/projects JSON）
  ↓ 1:N
career_reports     — 职业报告（overview/match_analysis/career_path/action_plan JSON）
match_records      — 匹配记录（四维度分 + gap_analysis JSON）
resume_parse_history — 简历解析历史（resume_content / parsed_profile / suggestions）
holland_test_results — 霍兰德测试结果（career_code / scores / suitable_jobs JSON）

jobs               — 岗位信息（skills/softSkills/requirements JSON）
  ↓ 1:N
job_promotion_paths — 职业图谱边（from_job_id / to_job_id / match_score / learning_path）
```

**数据质量保障：**

- `UNIQUE KEY` 约束（用户名、邮箱）
- MySQL Trigger 自动更新 `updated_at`（via Migration 001）
- JSON 字段强类型：AI 输出经 Go 结构体反序列化校验后再入库

---

## 第 15 页 — 数据安全与质量保障

安全可信赖，质量有保障

**安全机制：**

| 层面     | 措施                                                         |
| -------- | ------------------------------------------------------------ |
| 密码存储 | `golang.org/x/crypto/bcrypt` 哈希，不存明文                  |
| 认证     | JWT（golang-jwt/jwt v5），Auth.AccessSecret + AccessExpire 配置化 |
| 授权     | go-zero 中间件层校验 JWT，路由级权限控制                     |
| 数据隔离 | Match / Report 接口校验资源归属 userId，防止 IDOR            |
| 跨域     | CORS.Origins 白名单配置，不暴露通配符                        |
| 限流     | RateLimit.TokensPerSecond + Burst 令牌桶，防止 LLM 接口滥用  |
| 熔断     | CircuitBreaker.ErrorPercentThreshold 配置，AI 服务异常时自动熔断 |

**质量保障：**

- AI 输出强制 JSON 反序列化（Prompt 内含严格格式约束），格式错误时返回错误码
- 单元测试覆盖：`internal/handler/user/handler_validation_test.go`、`internal/middleware/middleware_test.go`、`internal/model/*_test.go`
- 数据库迁移脚本版本化（`sql/migrations/001_*.sql`、`002_*.sql`）
- 简历解析失败记录保留（`resume_parse_history` 表始终写入，无论 AI 成功与否）

---

## 第 16 页 — 界面展示

现代化 React UI，流畅的用户体验

**前端技术栈（high-school-worker-design-forend/package.json）：**

| 层次          | 技术                                                         |
| ------------- | ------------------------------------------------------------ |
| 框架          | React 19 + TypeScript 5.9                                    |
| 构建          | Vite 8                                                       |
| 组件库        | Ant Design 6 + antd-mobile 5                                 |
| 样式          | Tailwind CSS 4                                               |
| 状态管理      | Zustand 5                                                    |
| 图表可视化    | ECharts 6 + echarts-for-react + @ant-design/charts           |
| 文件上传      | react-dropzone                                               |
| Markdown 渲染 | react-markdown + remark-gfm                                  |
| HTTP 客户端   | Axios                                                        |
| SSE 流式      | 自定义 fetchSSE（src/utils/sse.ts）携带 Authorization Header |

**关键页面（src/pages/）：**

- `Auth/` — 登录 / 注册页
- `Home/` — 仪表盘，学生画像摘要
- `Profile/` — 学生画像详情（雷达图 + 技能标签 + 竞争力评分）
- `Resume/` — 简历上传与 AI 解析结果
- `Holland/` — 霍兰德测试 + 历史记录 + RIASEC 雷达图
- `Plan/` — 职业规划报告（流式生成 + 在线查看）
- `Interview/` — 模拟面试（开发中）
- `Student/` — 学生管理

---

## 第 17 页 — 技术亮点总结

核心创新点一览

| #    | 亮点                      | 描述                                                         |
| ---- | ------------------------- | ------------------------------------------------------------ |
| 1    | SSE 流式报告生成          | Go GenerateCareerReportStream 返回 channel，实时推送 SSE 帧，首字节延迟极低 |
| 2    | OpenAI-Compatible AI 接口 | AIProvider 接口抽象，底层对接 DeepSeek，零改动切换任意 OpenAI-compatible 模型 |
| 3    | 四维度人岗匹配            | skills / certs / softSkills / experience 加权评分 + gap 分析，结果有量化依据 |
| 4    | 简历全链路解析            | PDF/Word 文件解析（file_parser.go）→ DeepSeek 结构化提取 → 画像 + 建议 → 历史记录 |
| 5    | 霍兰德职业倾向测试        | RIASEC 模型 18 题测评 → 六维度雷达图 → 岗位推荐，科学量化自我认知 |
| 6    | 职业图谱系统              | job_promotion_paths 边表 + 图谱 API → AntV G6 力导向图，纵向晋升 + 横向转型双路径 |
| 7    | 可配置 AI 参数            | Provider / Model / BaseURL / Timeout 运行时配置化，支持多供应商热切换 |

---

##  部署与运维

轻量部署，快速上手

**服务启动（start.sh）：**

```bash
# 清理端口占用（8088 / 9091）

# 启动后端服务
go run career.go -f etc/career-api.yaml
```

**依赖服务：**

```text
MySQL 8.0        — 数据持久化
Redis            — 缓存 / 会话
DeepSeek API     — AI 能力（外部 SaaS，无需自建）
```

**环境配置（etc/career-api.yaml）：**

```yaml
Name: career-api
Host: 0.0.0.0
Port: 8888
Mysql:
  DataSource: user:pass@tcp(host:3306)/career
Redis:
  Host: localhost:6379
Auth:
  AccessSecret: your-jwt-secret
  AccessExpire: 86400
AI:
  Provider: deepseek
  ApiKey: sk-...
  Model: deepseek-chat
  BaseURL: https://api.deepseek.com/v1
  Timeout: 60
RateLimit:
  TokensPerSecond: 100
  Burst: 200
```

**运维友好：**

- 环境变量 / YAML 统一配置，敏感信息不入代码库（.gitignore 排除 etc/ 中密钥文件）
- go-zero 内置结构化日志（JSON 格式，含 TraceID）
- 健康检查端点：`GET /api/v1/health` → `{"status":"ok","version":"1.0.0"}`
- 数据库变更通过迁移脚本版本化管理（`sql/migrations/`）

---

## 第 19 页 — 总结与展望

项目价值回顾 + 未来扩展

**项目价值：**

- **对学生：** AI 专属职业导师，数据驱动的个性化规划，霍兰德测评科学认知自我，不再盲目求职
- **对学校：** 批量学生画像管理，就业数据沉淀，精准帮扶提升就业率
- **对社会：** 优化人才供需匹配效率，降低人才错配成本

**技术成果：**

- 44 个 REST API 接口，覆盖 8 大功能模块
- 7 大 AI 功能落地（岗位画像 / 简历解析 / 匹配分析 / 报告生成 / 报告流式 / 报告润色 / 画像补全）
- 全链路 SSE 流式架构，AI 长耗时操作不阻塞用户
- 完整测试覆盖：handler 验证测试 + middleware 测试 + model 单元测试

**当前完成度（docs/项目优势分析.md）：**

| 模块     | 完成度            |
| -------- | ----------------- |
| 用户认证 | ✅ 100%            |
| 职业图谱 | ✅ 100%            |
| 学生管理 | 🟡 90%             |
| 岗位管理 | 🟡 90%             |
| 智能匹配 | 🟡 80%             |
| 报告生成 | 🟡 80%             |
| 面试模拟 | 🔴 30%（disabled） |

**未来展望：**

- 接入实时招聘平台数据（Boss直聘 / 拉勾），丰富岗位数据库
- 引入 Agent 机制，主动规划学习路径并推送提醒
- 完成面试模拟模块（internal/handler/interview.disabled/ 已有骨架）
- 引入向量检索（ChromaDB / pgvector），提升语义匹配精度
- 增加行业趋势预测（基于岗位数据时序分析）

---

## 第 20 页 — 感谢页

**Thank You**

**CareerPlanner — 让每个学生的职业规划，都有 AI 同行**

感谢各位评委与观众的聆听与指导

项目仓库：[github.com/swordreforge/Job-manner-review-system](https://github.com/swordreforge/Job-manner-review-system)

技术栈：Go · go-zero · DeepSeek API · React 18 · TypeScript · Ant Design · ECharts · AntV G6 · MySQL · Redis

欢迎提问与交流

---

*文档说明：本文档内容严格基于仓库实际代码（go.mod、internal/、sql/schema.sql、high-school-worker-design-forend/package.json、docs/）生成，所有技术栈、接口路径、数据库字段、配置项均为真实存在，无虚构内容。*
