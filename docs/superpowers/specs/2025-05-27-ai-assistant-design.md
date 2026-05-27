# AI对话中心设计文档

## 概述

在项目中新增统一的"AI对话中心"页面，整合普通AI求职助手和面试模式，提供双模式切换的对话体验。

## 两种模式

### 普通模式（AI求职助手）
- 用户可自由创建多个对话，提问关于求职的问题
- 对话历史持久化保留
- SSE流式输出AI回复

### 面试模式
- 面试模拟：保留现有面试功能，迁移至新页面
- 面试回顾：选择历史面试，AI帮用户总结表现、给出改进建议
- 历史面试记录查看

## 数据模型

### 复用现有表

**chat_groups** — 新增 chat_type 枚举值：
- `'ai_assistant'`：普通模式对话
- `'interview_review'`：面试回顾对话（新增，含 `interview_session_id` 外键信息）

**chat_messages** — 新增 sender_type 枚举值：
- `'assistant'`：AI回复

### interview_groups 扩展字段

在 `chat_groups` 表新增字段：
- `interview_session_id` (BIGINT, DEFAULT NULL) — 关联面试记录，仅 `chat_type='interview_review'` 时有值

### 系统提示词

普通模式固定系统提示词为求职顾问角色，覆盖求职指导、简历撰写、面试技巧等领域。

面试回顾模式系统提示词包含面试对话历史摘要，帮用户分析表现和改进建议。

## 后端 API

### 普通模式（5个端点）

| 方法 | 路径 | 功能 |
|---|---|---|
| POST | `/api/v1/ai/conversations` | 创建AI对话 |
| GET | `/api/v1/ai/conversations` | 列出用户的所有AI对话 |
| PUT | `/api/v1/ai/conversations/:id` | 重命名对话 |
| DELETE | `/api/v1/ai/conversations/:id` | 删除对话 |
| POST | `/api/v1/ai/conversations/:id/messages` | 发送消息（SSE流式返回AI回复） |

### 面试回顾模式（2个端点）

| 方法 | 路径 | 功能 |
|---|---|---|
| POST | `/api/v1/ai/conversations/:id/review` | 为指定面试创建回顾对话 |
| GET | `/api/v1/ai/conversations/:id/messages` | 获取对话历史（通用，含普通和回顾） |

### SSE流式输出

发送消息时：
1. 用户消息存入 `chat_messages`（sender_type='student'）
2. 从数据库加载该对话所有历史消息，构建 messages 数组
3. 在前面插入系统提示词
4. 调用 DeepSeek API 流式返回
5. SSE流结束后，将AI完整回复存入 `chat_messages`（sender_type='assistant'）

## 前端

### 路由与导航

- 新增路由 `/ai-assistant`
- 侧边栏新增"AI对话"入口
- 原面试独立入口（`/interview`）迁移至此页面的面试模式标签

### 页面结构

```
/ai-assistant
├── 顶部模式切换标签：普通模式 | 面试模式
├── 左侧面板
│   ├── 普通模式：对话列表（新建对话 + 历史对话列表，支持重命名/删除）
│   └── 面试模式：面试记录列表（历史面试 + 开始新面试按钮）
└── 右侧面板
    ├── 普通模式：聊天气泡界面（用户/AI气泡，SSE逐字流式输出）
    └── 面试模式：
        ├── 进行中面试：面试对话UI
        └── 面试回顾：AI分析与改进建议对话
```

### 组件拆分

- `AIAssistantPage` — 主页面，模式切换
- `ConversationList` — 对话列表侧边栏（创建、重命名、删除）
- `ChatView` — 聊天界面（消息列表 + 输入框）
- `MessageBubble` — 单条消息气泡
- `ChatInput` — 消息输入区域（支持发送+流式加载状态）
- `InterviewList` — 面试记录列表
- `InterviewReview` — 面试回顾对话

### Zustand Store

```typescript
useAIChatStore {
  conversations: Conversation[]     // 对话列表
  currentConversationId: number | null
  messages: Message[]               // 当前对话消息
  isStreaming: boolean              // SSE流式状态
  mode: 'normal' | 'interview'     // 当前模式
  
  // Actions
  loadConversations()
  createConversation()
  renameConversation(id, name)
  deleteConversation(id)
  selectConversation(id)
  sendMessage(content)
  loadMessages(conversationId)
}
```

### SSE处理

复用现有 `fetchSSE` 模式：
- 用户发送消息后，POST到 `/api/v1/ai/conversations/:id/messages`
- 响应为 SSE 流
- 前端逐字更新AI回复气泡内容
- SSE流结束后，AI完整消息存入消息列表

## 实施优先级

1. 后端：数据模型 + API端点 + SSE流式
2. 前端：普通模式完整流程（创建对话→发送消息→接收流式回复→历史）
3. 前端：对话管理（重命名、删除）
4. 前端：面试模式迁移 + 面试回顾