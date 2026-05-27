# Career Planning Assistant — Design Spec

## Overview

Add a standalone conversational AI career planning assistant, independent of the existing interview feature. Students can freely ask career-related questions and receive personalized advice based on their profile, Holland test results, and job match data.

## Approach

**Method A: Conversation Memory + System Prompt Injection**

- Each chat request loads the user's student data (skills, Holland results, match data) into the system prompt
- Conversation history is loaded from DB and prepended to messages array
- Backend uses existing `AIProvider.ChatStream()` for SSE streaming output
- Frontend creates a new `/assistant` page with chat UI

## Data Model

### `assistant_conversations`

| Column      | Type                         | Constraints                          |
|-------------|------------------------------|--------------------------------------|
| id          | bigint                       | PK, auto_increment                   |
| user_id     | bigint                       | FK → users.id, NOT NULL             |
| title       | varchar(255)                 | Default "新对话", auto-generated after first message |
| track       | enum('bigtech', 'gov')       | NOT NULL, from UI store              |
| created_at  | timestamp                    |                                      |
| updated_at  | timestamp                    |                                      |

### `assistant_messages`

| Column          | Type                         | Constraints                          |
|-----------------|------------------------------|--------------------------------------|
| id              | bigint                       | PK, auto_increment                   |
| conversation_id | bigint                       | FK → assistant_conversations.id, NOT NULL, CASCADE DELETE |
| role            | enum('user', 'assistant', 'system') | NOT NULL                     |
| content         | text                          | NOT NULL                            |
| created_at      | timestamp                     |                                      |

- One user can have multiple conversations
- Sidebar shows conversation list with create/switch/delete
- `track` field lets AI know which track context to use (bigtech/gov)

## API Endpoints

All endpoints are under `/api/v1/assistant/`.

| Method | Path                                              | Description                  |
|--------|----------------------------------------------------|------------------------------|
| POST   | /assistant/conversations                           | Create new conversation      |
| GET    | /assistant/conversations                           | List my conversations        |
| DELETE | /assistant/conversations/:id                       | Delete conversation           |
| GET    | /assistant/conversations/:id/messages              | Get conversation messages     |
| POST   | /assistant/conversations/:id/chat                 | SSE stream chat              |

### Chat Flow

1. Frontend creates a conversation → gets `conversation_id`
2. User sends a message → `POST /chat` with SSE stream
3. Backend loads user's student profile, Holland results, match data → injects into system prompt
4. Backend loads conversation history from `assistant_messages` → prepends to messages array
5. Calls `AIProvider.ChatStream()` → SSE stream response
6. After stream ends, saves assistant reply to `assistant_messages`
7. After first message, auto-generates conversation title via AI

## Frontend Design

### Routing

- New route: `/assistant` → `AssistantPage`
- Navigation: Added to "常用" nav group with `RobotOutlined` icon

### Page Layout

```
┌──────────────┬─────────────────────────────────┐
│  会话列表      │  对话区域                        │
│              │                                 │
│  + 新对话     │  [AI 气泡] 你好！我是职业规划...   │
│              │                                 │
│  ▸ 大厂方向   │  [用户气泡] 我适合做什么方向？    │
│  ▸ 国企方向   │                                 │
│  ▸ 技能提升   │  ┌──────────────────────────┐   │
│              │  │ 输入框              发送 ▶ │   │
│              │  └──────────────────────────┘   │
└──────────────┴─────────────────────────────────┘
```

### Interactions

- Create conversation → API call → new session appears in sidebar
- Send message → SSE stream → typewriter effect (reuse Interview page chunk parsing)
- Auto-update conversation title after first message
- Switching track (bigtech/gov) creates a new conversation
- Markdown rendering for AI replies (tables, lists, etc.)
- Empty state: 3 quick question cards ("分析我的职业匹配度", "推荐职业路径", "制定学习计划")

### Frontend Module

- New file: `forend/src/pages/Assistant/index.tsx`
- API module: add `assistantApi` to `forend/src/api/index.ts`

## Backend Design

### New Files

- `internal/model/assistant_conversations_model.go` — CRUD for conversations
- `internal/model/assistant_messages_model.go` — CRUD for messages
- `internal/handler/assistant/` — HTTP handlers
- `internal/logic/assistant/` — Business logic
- `api/assistant.api` — API definition file

### System Prompt Structure

```
你是一个面向高中生的职业规划助手。以下是该学生的信息：

【学生档案】
- 姓名：{name}
- 专业：{major}
- 学历：{education}
- 技能：{skills}
- 软技能：{soft_skills}
- 证书：{certificates}
- 实习经历：{internship}
- 项目经历：{projects}

【霍兰德测试结果】
- 职业代码：{career_code}
- 适合职业：{suitable_jobs}

【岗位匹配分析】
{top_match_jobs_with_scores}

请基于以上信息，为学生提供个性化的职业规划建议。当前方向：{track_description}。
回答应简洁实用，适合高中生理解。
```

### Title Generation

After the first user message, make a separate lightweight AI call to generate a short title (max 20 chars) from the user's message. Update the conversation's `title` field.

## Key Implementation Notes

- Reuse `AIProvider.ChatStream()` interface for streaming; do NOT create a separate AI call implementation like interview does
- Reuse the SSE chunk parsing pattern from Interview frontend for typewriter effect
- Conversation deletion cascades to messages (DB-level ON DELETE CASCADE)
- The `track` field on conversation is set at creation time from the current UI store track value
- Response should support Markdown rendering