# 面试模块API功能规范文档

## 1. 概述

本文档描述了面试模块的完整API功能规范，包括数据库设计、API接口定义、鉴权机制和实现细节。

## 2. 数据库设计

### 2.1 面试会话表 (interview_sessions)

```sql
CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '面试会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID，关联users表',
    student_id BIGINT COMMENT '学生ID，关联students表',
    mode VARCHAR(50) NOT NULL COMMENT '面试模式：practice-练习模式, assessment-评估模式',
    status VARCHAR(50) NOT NULL DEFAULT 'running' COMMENT '状态：running-进行中, completed-已完成, cancelled-已取消',
    total_questions INT DEFAULT 0 COMMENT '总问题数',
    current_question INT DEFAULT 0 COMMENT '当前问题序号',
    average_score DECIMAL(5,2) DEFAULT 0 COMMENT '平均分数',
    max_score DECIMAL(5,2) DEFAULT 0 COMMENT '最高分数',
    min_score DECIMAL(5,2) DEFAULT 0 COMMENT '最低分数',
    duration_seconds INT DEFAULT 0 COMMENT '面试时长（秒）',
    created_at BIGINT NOT NULL COMMENT '创建时间',
    updated_at BIGINT NOT NULL COMMENT '更新时间',
    completed_at BIGINT COMMENT '完成时间',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_student (student_id),
    KEY idx_status (status),
    KEY idx_created (created_at),
    CONSTRAINT fk_interview_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试会话表';
```

### 2.2 面试对话记录表 (interview_messages)

```sql
CREATE TABLE IF NOT EXISTS interview_messages (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    session_id BIGINT NOT NULL COMMENT '会话ID，关联interview_sessions表',
    role VARCHAR(20) NOT NULL COMMENT '角色：user-用户, assistant-AI面试官',
    content TEXT NOT NULL COMMENT '消息内容',
    question_type VARCHAR(50) COMMENT '问题类型：self_intro-自我介绍, project-项目经验, technical-技术问题, hr-人事问题',
    score DECIMAL(5,2) COMMENT '评分（仅AI回复时有效）',
    feedback TEXT COMMENT '反馈内容（仅AI回复时有效）',
    created_at BIGINT NOT NULL COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_role (role),
    KEY idx_created (created_at),
    CONSTRAINT fk_interview_message_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试对话记录表';
```

### 2.3 面试评估报告表 (interview_reports)

```sql
CREATE TABLE IF NOT EXISTS interview_reports (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '报告ID',
    session_id BIGINT NOT NULL COMMENT '会话ID，关联interview_sessions表',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    overall_score DECIMAL(5,2) NOT NULL COMMENT '综合评分',
    skill_score DECIMAL(5,2) COMMENT '技能评分',
    communication_score DECIMAL(5,2) COMMENT '沟通能力评分',
    logic_score DECIMAL(5,2) COMMENT '逻辑思维评分',
    confidence_score DECIMAL(5,2) COMMENT '自信程度评分',
    strengths JSON COMMENT '优势分析',
    weaknesses JSON COMMENT '劣势分析',
    improvement_suggestions JSON COMMENT '改进建议',
    summary TEXT COMMENT '总结',
    created_at BIGINT NOT NULL COMMENT '创建时间',
    updated_at BIGINT NOT NULL COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY idx_session (session_id),
    KEY idx_user (user_id),
    KEY idx_score (overall_score),
    CONSTRAINT fk_interview_report_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试评估报告表';
```

## 3. API接口定义

### 3.1 启动面试会话

**接口：** `POST /api/v1/interview/start`

**鉴权：** 需要登录

**请求参数：**
```json
{
  "mode": "practice",  // 面试模式：practice-练习模式, assessment-评估模式
  "studentId": 123     // 可选，学生ID
}
```

**响应数据：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "userId": 100,
    "studentId": 123,
    "mode": "practice",
    "status": "running",
    "totalQuestions": 0,
    "currentQuestion": 0,
    "averageScore": 0,
    "createdAt": 1234567890,
    "firstQuestion": "请先做一个简单的自我介绍"
  }
}
```

### 3.2 面试对话（流式输出）

**接口：** `POST /api/v1/interview/chat-stream`

**鉴权：** 需要登录（支持URL参数传递token）

**请求参数：**
```json
{
  "sessionId": 1,      // 会话ID
  "message": "我是张三，计算机专业大三学生..."
}
```

**响应格式：** SSE (Server-Sent Events)

**事件类型：**
1. `question` - 下一个问题
2. `score` - 评分
3. `feedback` - 反馈
4. `session_update` - 会话状态更新
5. `done` - 对话结束

**示例响应：**
```
event: question
data: {"content":"你在项目中遇到过什么技术难题？"}

event: score
data: {"value":85}

event: feedback
data: {"content":"回答清晰，但可以增加量化数据"}

event: session_update
data: {"sessionId":1,"currentQuestion":2,"averageScore":85}

event: done
data: {"message":"对话结束"}
```

### 3.3 获取面试历史

**接口：** `GET /api/v1/interview/history`

**鉴权：** 需要登录

**查询参数：**
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `status`: 状态过滤（可选）
- `mode`: 模式过滤（可选）

**响应数据：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 25,
    "list": [
      {
        "id": 1,
        "userId": 100,
        "studentId": 123,
        "mode": "practice",
        "status": "completed",
        "averageScore": 85.5,
        "totalQuestions": 5,
        "durationSeconds": 300,
        "createdAt": 1234567890,
        "completedAt": 1234568190
      }
    ]
  }
}
```

### 3.4 获取面试详情

**接口：** `GET /api/v1/interview/:id`

**鉴权：** 需要登录

**响应数据：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "userId": 100,
    "studentId": 123,
    "mode": "practice",
    "status": "completed",
    "totalQuestions": 5,
    "currentQuestion": 5,
    "averageScore": 85.5,
    "maxScore": 92,
    "minScore": 78,
    "durationSeconds": 300,
    "createdAt": 1234567890,
    "completedAt": 1234568190,
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "我是张三...",
        "createdAt": 1234567891
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "请介绍一下你的项目经验",
        "questionType": "project",
        "score": 85,
        "feedback": "回答清晰",
        "createdAt": 1234567895
      }
    ]
  }
}
```

### 3.5 获取面试评估报告

**接口：** `GET /api/v1/interview/:id/report`

**鉴权：** 需要登录

**响应数据：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "sessionId": 1,
    "userId": 100,
    "overallScore": 85.5,
    "skillScore": 88,
    "communicationScore": 82,
    "logicScore": 87,
    "confidenceScore": 85,
    "strengths": [
      "技术基础扎实",
      "项目经验丰富",
      "表达能力清晰"
    ],
    "weaknesses": [
      "缺乏量化数据",
      "可以更主动提问"
    ],
    "improvementSuggestions": [
      "在回答中增加具体的数据和成果",
      "准备更多项目细节",
      "提升面试沟通技巧"
    ],
    "summary": "整体表现优秀，技术能力和项目经验都符合岗位要求。建议在面试中更加注重量化成果的展示，提升沟通的主动性。",
    "createdAt": 1234568190
  }
}
```

### 3.6 结束面试会话

**接口：** `POST /api/v1/interview/:id/end`

**鉴权：** 需要登录

**请求参数：**
```json
{
  "reason": "user_completed"  // 结束原因：user_completed-用户完成, timeout-超时, cancelled-取消
}
```

**响应数据：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "status": "completed",
    "averageScore": 85.5,
    "durationSeconds": 300,
    "completedAt": 1234568190
  }
}
```

### 3.7 删除面试会话

**接口：** `DELETE /api/v1/interview/:id`

**鉴权：** 需要登录

**响应数据：**
```json
{
  "code": 0,
  "msg": "success"
}
```

## 4. 鉴权机制

### 4.1 Token验证

所有面试API都需要用户登录，通过JWT Token进行鉴权。

**Token获取方式：**
- 用户登录接口：`POST /api/v1/user/login`
- 返回JWT Token

**Token传递方式：**
1. **HTTP Header**（推荐）：
   ```
   Authorization: Bearer <token>
   ```

2. **URL参数**（用于SSE流式连接）：
   ```
   /api/v1/interview/chat-stream?token=<token>
   ```

### 4.2 权限控制

- 普通用户：只能访问自己的面试记录
- 管理员：可以访问所有用户的面试记录

### 4.3 用户ID注入

鉴权通过后，会在请求上下文中注入：
- `userId`: 用户ID
- `username`: 用户名
- `role`: 用户角色

## 5. AI服务集成

### 5.1 AI提供商

使用DeepSeek API作为AI服务提供商。

### 5.2 API配置

```go
APIProvider: {
    ApiKey:  "DEEPSEEK_API_KEY",  // 从环境变量读取
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com/v1",
    Timeout: 60
}
```

### 5.3 系统提示词

面试官角色设定：
```
你是一名专业的面试官，负责评估候选人的能力和潜力。

你的任务是：
1. 根据用户的回答，提出相关的面试问题
2. 对用户的回答进行评分（0-100分）
3. 提供具体的反馈和改进建议

评分标准：
- 技术能力（30分）：技术深度、广度、应用能力
- 沟通表达（30分）：表达能力、逻辑清晰度
- 项目经验（25分）：项目质量、责任范围
- 综合素质（15分）：学习能力、团队合作等

面试阶段：
1. 自我介绍
2. 项目经验
3. 技术深度
4. 场景问题
5. 薪资期望（可选）

请严格按照JSON格式返回：
{
  "question": "下一个问题",
  "score": 分数,
  "feedback": "反馈建议",
  "questionType": "问题类型",
  "sessionEnd": false  // 是否结束会话
}
```

## 6. 错误处理

### 6.1 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

### 6.2 错误响应格式

```json
{
  "code": 400,
  "msg": "invalid request parameters"
}
```

## 7. 性能要求

### 7.1 响应时间

- 启动面试：< 500ms
- 获取历史：< 300ms
- 获取详情：< 500ms

### 7.2 流式输出

- 首字延迟：< 2s
- 输出速率：> 10字符/秒

### 7.3 并发支持

- 支持至少100个并发面试会话

## 8. 测试配置

### 8.1 测试API密钥

在测试环境使用硬编码的DeepSeek API密钥。

### 8.2 测试场景

1. **基本流程测试**
   - 启动面试
   - 多轮对话
   - 结束面试
   - 查看历史

2. **边界测试**
   - 超长消息
   - 特殊字符
   - 快速连续请求

3. **异常测试**
   - 无效Token
   - 会话不存在
   - API调用失败

## 9. 后续扩展

### 9.1 功能扩展

- 多种面试模式（技术、HR、综合）
- 语音面试
- 视频面试
- 面试回放
- AI面试官个性化

### 9.2 数据分析

- 面试能力趋势分析
- 同类岗位对比
- 改进建议推荐

## 10. 附录

### 10.1 数据库索引

```sql
-- 面试会话表索引
CREATE INDEX idx_interview_user_status ON interview_sessions(user_id, status);
CREATE INDEX idx_interview_created ON interview_sessions(created_at DESC);

-- 面试消息表索引
CREATE INDEX idx_interview_message_session_created ON interview_messages(session_id, created_at);

-- 面试报告表索引
CREATE INDEX idx_interview_report_user_score ON interview_reports(user_id, overall_score DESC);
```

### 10.2 数据清理策略

- 保留最近90天的面试记录
- 自动删除超过90天的未完成会话
- 归档超过1年的已完成会话