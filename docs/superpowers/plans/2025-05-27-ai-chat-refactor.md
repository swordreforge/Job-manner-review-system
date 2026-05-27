# AI Chat 模块重构实施方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 /interview 路由更名为 /ai-chat，新增独立普通对话模块，改造面试表以存储对话历史，重构 UI 为类 ChatGPT 的工作区域布局。

**Architecture:** 前端路由从独立全屏页面改为 MainLayout 内嵌页面，UI 采用左右分栏（会话列表 + 聊天区）的 ChatGPT 风格。后端在现有 AI Conversation API 基础上新增普通对话(chat)类型的完整 CRUD，Interview 表增加 conversation 关联字段。普通对话与面试对话共享 AI Conversation 基础设施但各自独立模块。

**Tech Stack:** React 19, Vite 8, Ant Design v6, Tailwind CSS v4, Zustand, go-zero, MySQL, SSE

---

## 现状分析（代码库探究结果）

### 当前存在的两套并行系统

| 维度 | Legacy Interview (旧) | AIAssistant (新) |
|------|----------------------|-------------------|
| 前端路由 | `/interview`（独立全屏，不在 MainLayout 内） | **无路由**（代码存在但未挂载） |
| 前端组件 | `pages/Interview/index.tsx`（1255行单体） | `pages/AIAssistant/`（拆分组件：ChatView, ChatInput, MessageBubble, ConversationList） |
| 状态管理 | 全部 local useState | zustand `useAIChatStore` |
| API 调用 | `interviewApi.*`（7个端点） | `aiApi.*`（6个端点） |
| 后端入口 | `/api/v1/interview/*`（独立 handler/logic） | `/api/v1/ai/conversations/*`（独立 handler/logic） |
| 数据存储 | `interview_sessions` + `interview_messages`（独立表） | `chat_groups`（chat_type=ai_assistant/interview_review）+ `chat_messages` |
| 流式通信 | SSE via `interviewApi.chatStream()` | SSE via `aiApi.sendMessageStream()` |
| 语音录音 | 支持（PCM + Whisper） | 不支持 |
| 导航入口 | 无侧边栏入口，从首页卡片跳转 | 无任何入口 |

### 后端数据库表结构

**interview_sessions 表：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT(20) PK | 自增ID |
| user_id | BIGINT(20) | 用户ID |
| student_id | BIGINT(20) | 学生ID（可空） |
| mode | VARCHAR(50) | practice/assessment |
| status | VARCHAR(50) | running/completed/cancelled |
| total_questions | INT | 总问题数 |
| current_question | INT | 当前题号 |
| average_score | DECIMAL(5,2) | 平均分 |
| max_score | DECIMAL(5,2) | 最高分 |
| min_score | DECIMAL(5,2) | 最低分 |
| duration_seconds | INT | 时长 |
| created_at/updated_at/completed_at | BIGINT(20) | 时间戳 |

**interview_messages 表：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT(20) PK | 消息ID |
| session_id | BIGINT(20) FK | 关联 session |
| role | VARCHAR(20) | user/assistant |
| content | TEXT | 消息内容 |
| question_type | VARCHAR(50) | self_intro/project/technical/hr |
| score | DECIMAL(5,2) | 评分（AI消息） |
| feedback | TEXT | 反馈（AI消息） |
| created_at | BIGINT(20) | 时间戳 |

**chat_groups 表（AI 对话复用）：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT(20) PK | 自增ID |
| school_id | BIGINT(20) | 学校ID |
| name | VARCHAR(100) | 会话名 |
| chat_type | VARCHAR(20) | direct/ai_assistant/interview_review |
| created_by | BIGINT(20) | 创建者 |
| interview_session_id | BIGINT(20) | 关联面试session（可空） |
| created_at/updated_at | BIGINT(20) | 时间戳 |

**chat_messages 表（AI 对话复用）：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT(20) PK | 消息ID |
| group_id | BIGINT(20) | 会话组ID |
| sender_id | BIGINT(20) | 发送者ID（0=assistant） |
| sender_type | VARCHAR(20) | teacher/student/assistant |
| sender_name | VARCHAR(100) | 发送者名称 |
| content | TEXT | 消息内容 |
| created_at | BIGINT(20) | 时间戳 |

### 前端路由（App.tsx）

当前 `/interview` 是独立路由，不在 MainLayout 内：
```tsx
<Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
```

侧边栏导航（useNavItems.ts）没有 Interview 或 AI 入口。

### 前端 API 层（api/index.ts）

已存在的 AI 对话 API：
```typescript
aiApi.createConversation({ name, chatType, mode })  // POST /ai/conversations
aiApi.listConversations()                            // GET  /ai/conversations
aiApi.renameConversation(id, { name })                // PUT  /ai/conversations/:id
aiApi.deleteConversation(id)                          // DELETE /ai/conversations/:id
aiApi.getMessages(id)                                 // GET  /ai/conversations/:id/messages
aiApi.sendMessageStream(id, content, onEvent, onError) // POST /ai/conversations/:id/messages (SSE)
```

### 后端 AI Logic 关键发现

`internal/logic/ai/sendmessagelogic.go`（425行）已有两个分支：
- `sendMessageAssistant`：普通 AI 对话，调用 `systemPrompt`（"职途助手"）
- `sendMessageInterview`：面试模式，调用 `getInterviewSystemPrompt(mode)`

`internal/logic/ai/createconversationlogic.go`（161行）：
- `chatType=ai_assistant`：创建普通对话
- `chatType=interview_review`：创建对话 + 创建 `interview_sessions` 行 + 关联

`internal/logic/ai/helpers.go`：
- `systemPrompt`：普通对话的系统提示词
- `getInterviewSystemPrompt(mode)`：面试模式的系统提示词
- `extractTextFromPartialJSON`：流式 JSON 解析器

---

## 变更规划总览

### 四大需求拆解

| # | 需求 | 涉及范围 | 复杂度 |
|---|------|----------|--------|
| R1 | /interview → /ai-chat 路由更名 | 前端路由、导航、API前缀（可选） | 低 |
| R2 | Interview 表存储对话历史 | 后端模型、数据库迁移、API逻辑 | 中 |
| R3 | 新增独立普通对话模式 | 前端新组件、后端新类型/提示词 | 中 |
| R4 | UI 改造为 ChatGPT 风格工作区 | 前端大改、布局重构 | 高 |

### 关键设计决策（需确认）

**D1: 是否保留 Legacy Interview 页面？**
- 方案A：完全替换 `/interview` 为新的 `/ai-chat`，删除旧代码
- 方案B：保留 `/interview` 做兼容重定向到 `/ai-chat`
- **推荐：方案A**，因为 AIAssistant 组件已经功能更完整

**D2: chat_messages 是否要增加 score/feedback 字段？**
- 当前 `chat_messages` 没有 `score` 和 `feedback` 字段，但面试模式需要评分
- 方案A：在 `chat_messages` 表加 `score`/`feedback` 列，面试对话和普通对话统一用 `chat_messages`
- 方案B：面试消息仍双写 `interview_messages`，普通对话只用 `chat_messages`
- **推荐：方案A**，统一存储更简洁，避免双写复杂度

**D3: 前端路由是否放在 MainLayout 内？**
- 当前 `/interview` 是全屏独立路由（无侧边栏）
- 方案A：放在 MainLayout 内，有侧边栏和顶栏，类似 ChatGPT 的工作区布局
- 方案B：保持全屏独立路由
- **推荐：方案A**，符合"工作区域"的 UI 需求，也便于侧边栏导航

**D4: 普通对话是否复用现有 AI Conversation API？**
- 现有 `aiApi` 已支持 `chatType=ai_assistant` 创建普通对话
- 方案A：直接复用，前端新增模式切换 UI
- 方案B：新建独立的 `/ai/chat` 端点，与面试模块完全解耦
- **推荐：方案A**，后端已经支持，只需前端整合

**D5: 侧边栏导航入口放在哪里？**
- 当前学生导航分组：常用（首页、岗位、消息）、职业发展（规划、简历）、个人中心（资料）
- 方案A：在"常用"组加"AI 助手"入口
- 方案B：新增"AI 助手"独立分组
- **推荐：方案B**，突出 AI 功能的独立性

---

## Task 1: 路由更名 /interview → /ai-chat

**Files:**
- Modify: `high-school-worker-design-forend/src/App.tsx`（路由定义）
- Modify: `high-school-worker-design-forend/src/hooks/useNavItems.ts`（导航配置）
- Modify: `high-school-worker-design-forend/src/pages/Interview/index.tsx`（删除或重定向）
- Create: `high-school-worker-design-forend/src/pages/AIChat/`（新页面目录）

### Step 1.1: 创建 AIChat 页面入口

创建 `high-school-worker-design-forend/src/pages/AIChat/index.tsx`，将现有的 `AIAssistant` 组件重命名/重导出：

```tsx
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const AIChatContent = lazy(() => import('../AIAssistant'));

const AIChatPage: React.FC = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-full"><Spin size="large" /></div>}>
    <AIChatContent />
  </Suspense>
);

export default AIChatPage;
```

> 注意：这是临时桥接方案。后续 Task 4 会全面重构该页面。

### Step 1.2: 修改 App.tsx 路由

在 `App.tsx` 中：
- 删除 `/interview` 路由
- 在 `MainLayout` 内新增 `/ai-chat` 路由：
```tsx
<Route path="/ai-chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
```
- 路由放在 MainLayout 子路由组中（有侧边栏和顶栏）

### Step 1.3: 更新导航配置

在 `useNavItems.ts` 中新增学生导航分组：

```typescript
{
  label: 'AI 助手',
  items: [
    {
      key: 'ai-chat',
      label: 'AI 对话',
      icon: 'smart_toy',
      path: '/ai-chat',
    },
  ],
},
```

放在"常用"和"职业发展"之间。

### Step 1.4: 全局搜索替换 interview 路由引用

搜索所有前端代码中对 `/interview` 路径的引用（如首页卡片跳转），替换为 `/ai-chat`。

涉及文件：
- `pages/Home/` 中的面试跳转链接
- 任何其他引用 `/interview` 路径的组件

### Step 1.5: 验证

- 启动前端 `npm run dev`
- 确认侧边栏出现"AI 对话"入口
- 确认点击后进入 `/ai-chat` 页面且布局在 MainLayout 内
- 确认旧的 `/interview` 路径不再可访问

---

## Task 2: 数据库表字段改造

**Files:**
- Modify: `career.go`（autoMigrate 函数，增加字段）
- Modify: `internal/model/` 下的 AI 对话相关 model
- Modify: `internal/types/types.go`（类型定义）

### Step 2.1: chat_messages 表增加 score 和 feedback 字段

在 `career.go` 的 `autoMigrate` 函数中，修改 `chat_messages` 表的建表 SQL，增加：

```sql
ALTER TABLE chat_messages ADD COLUMN score DECIMAL(5,2) DEFAULT NULL COMMENT '评分（面试模式，AI回复）' AFTER content;
ALTER TABLE chat_messages ADD COLUMN feedback TEXT DEFAULT NULL COMMENT '反馈内容（面试模式，AI回复）' AFTER score;
```

或在初始化建表 SQL 中直接加入：
```sql
score DECIMAL(5,2) DEFAULT NULL COMMENT '评分（面试模式，AI回复）',
feedback TEXT DEFAULT NULL COMMENT '反馈内容（面试模式，AI回复）',
```

同时需要在 Go model 中对应更新。**由于这个项目使用 autoMigrate 做建表而非框架 ORM 自动迁移 ALTER，需要手动写 ALTER 或在 autoMigrate 中加兼容逻辑。**

### Step 2.2: 更新 Go Model

修改 `internal/model/chat_messages_model.go`（如果存在）或对应的 model 文件，在 `ChatMessages` struct 中增加：

```go
Score    sql.NullFloat64 `db:"score"`
Feedback sql.NullString  `db:"feedback"`
```

### Step 2.3: 更新前端类型定义

在 `high-school-worker-design-forend/src/types/index.ts` 中，更新 `AIMessage` 接口：

```typescript
interface AIMessage {
  id: number;
  groupId: number;
  senderId: number;
  senderType: 'student' | 'teacher' | 'assistant';
  senderName: string;
  content: string;
  score?: number;       // 新增
  feedback?: string;     // 新增
  createdAt: number;
}
```

### Step 2.4: 更新后端 types.go

在 `internal/types/types.go` 中更新 `AIMessage` struct：

```go
type AIMessage struct {
    Id         int64          `json:"id"`
    GroupId    int64          `json:"groupId"`
    SenderId   int64          `json:"senderId"`
    SenderType string         `json:"senderType"`
    SenderName string         `json:"senderName"`
    Content    string         `json:"content"`
    Score      float64        `json:"score,omitempty"`
    Feedback   string         `json:"feedback,omitempty"`
    CreatedAt  int64          `json:"createdAt"`
}
```

### Step 2.5: 更新后端消息返回逻辑

修改 `internal/logic/ai/listmessageslogic.go`，在返回消息列表时读取 `score` 和 `feedback` 字段。

修改 `internal/logic/ai/sendmessagelogic.go`，在面试模式的 `sendMessageInterview` 中保存 `score` 和 `feedback` 到 `chat_messages` 表（当前只保存到 `interview_messages`，需要双写）。

### Step 2.6: 数据库迁移脚本

在 `career.go` 的 autoMigrate 中增加 ALTER 语句（兼容已有数据库）：

```go
// 为 chat_messages 增加 score 和 feedback 字段（兼容已有数据库）
db.Exec("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS score DECIMAL(5,2) DEFAULT NULL COMMENT '评分'")
db.Exec("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT NULL COMMENT '反馈内容'")
```

> MySQL 不支持 `IF NOT EXISTS` 在 ALTER COLUMN 上，需要用 Go 代码检查字段是否存在后再执行 ALTER。或使用 `db.Migrator().HasColumn()` 检查。

### Step 2.7: 验证

- 启动后端 `go run career.go -f etc/career-api.yaml -skip-all`
- 检查 `chat_messages` 表是否新增了 `score` 和 `feedback` 列
- 通过 API 创建面试对话，发送消息，验证 score/feedback 是否正确存储和返回

---

## Task 3: 新增独立普通对话模式

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/AIAssistant/index.tsx`（模式切换逻辑）
- Modify: `high-school-worker-design-forend/src/stores/index.ts`（useAIChatStore）
- Modify: `high-school-worker-design-forend/src/api/index.ts`（如需新端点）
- Modify: `internal/logic/ai/createconversationlogic.go`（确认普通对话创建逻辑）
- Modify: `internal/logic/ai/sendmessagelogic.go`（确认普通对话消息逻辑）

### Step 3.1: 确认后端普通对话逻辑

后端 `createconversationlogic.go` 已支持 `chatType=ai_assistant` 创建普通对话。`sendmessagelogic.go` 已有 `sendMessageAssistant` 函数处理普通对话消息。

**需要确认的点：**
- 普通对话的系统提示词是否需要优化（当前是"职途助手"）
- 普通对话是否需要新的会话类型（当前用 `ai_assistant`，是否需要新增 `ai_chat`）

### Step 3.2: 前端模式切换 UI 优化

在 AIAssistant 页面的模式切换（Segmented）中：
- "普通模式" → 创建 `chatType=ai_assistant` 的对话
- "面试模式" → 创建 `chatType=interview_review` 的对话

确认切换逻辑正确，两种模式创建对话时传递正确的 `chatType`。

### Step 3.3: 普通对话独立状态管理

在 `useAIChatStore` 中，当前 `mode` 状态只影响 UI 显示。确认：
- 切换模式时清空当前会话选择
- 普通模式下不显示评分/面试相关 UI
- 会话列表根据当前模式过滤（`ai_assistant` vs `interview_review`）

### Step 3.4: 普通对话系统提示词

确认后端 `helpers.go` 中 `systemPrompt` 变量的内容是否适合独立普通对话场景。如需定制化提示词，可以在创建对话时通过 API 传递 `systemPrompt` 参数，或根据 `chatType` 选择不同提示词。

### Step 3.5: 验证

- 创建普通对话，发送消息，验证 AI 回复是否正常
- 切换到面试模式，创建面试对话，验证评分流程是否正常
- 验证两种模式的对话互不干扰

---

## Task 4: UI 布局改造为 ChatGPT 风格工作区

**Files:**
- Rewrite: `high-school-worker-design-forend/src/pages/AIChat/index.tsx`
- Rewrite: `high-school-worker-design-forend/src/pages/AIChat/components/ConversationList.tsx`
- Rewrite: `high-school-worker-design-forend/src/pages/AIChat/components/ChatView.tsx`
- Rewrite: `high-school-worker-design-forend/src/pages/AIChat/components/ChatInput.tsx`
- Rewrite: `high-school-worker-design-forend/src/pages/AIChat/components/MessageBubble.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIChat/components/ModeSwitcher.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIChat/components/EmptyState.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIChat/components/InterviewScoreBar.tsx`

### Step 4.1: 整体布局设计

采用 ChatGPT 风格的工作区布局（在 MainLayout 内）：

```
┌────────────────────────────────────────────────────────┐
│  TopAppBar (56px)                                       │
├──────────┬─────────────────────────────────────────────┤
│          │  模式切换栏  [普通对话] [面试模式]              │
│ 会话列表  │─────────────────────────────────────────────│
│ (280px)  │                                             │
│          │  消息区域                                    │
│ ┌──────┐ │                                             │
│ │新建  │ │  [AI头像] 消息气泡                           │
│ │对话  │ │          评分/反馈标签                       │
│ └──────┘ │                                             │
│          │                                             │
│ 对话1    │  [用户头像] 消息气泡                          │
│ 对话2    │                                             │
│ 对话3    │                                             │
│          │─────────────────────────────────────────────│
│          │  输入框                    [发送] [🎤录音]     │
└──────────┴─────────────────────────────────────────────┘
```

### Step 4.2: 创建新的 AIChat 页面组件

从现有的 `AIAssistant` 组件迁移，创建独立的 `AIChat` 页面：

```
pages/AIChat/
  ├── index.tsx              # 页面主容器
  ├── components/
  │   ├── ConversationList.tsx  # 左侧会话列表
  │   ├── ChatView.tsx          # 右侧聊天区
  │   ├── ChatInput.tsx         # 输入框（含录音按钮）
  │   ├── MessageBubble.tsx     # 消息气泡
  │   ├── ModeSwitcher.tsx     # 模式切换组件
  │   ├── EmptyState.tsx        # 空状态引导
  │   └── InterviewScoreBar.tsx # 面试评分条
  └── styles/
      └── chat.css              # 页面特有样式
```

### Step 4.3: ConversationList 组件改造

- 固定宽度 280px 左侧栏
- 顶部"新建对话"按钮（普通模式）/ "新建面试"按钮（面试模式）
- 会话列表按时间倒序，显示：会话名称、最后一条消息摘要、时间戳
- 面试会话显示状态标签（进行中/已完成/已取消）和分数
- 选中态高亮（MD3 primary-container 色）
- 右键/更多菜单：重命名、删除
- 移动端：可折叠 Drawer

### Step 4.4: ChatView 组件改造

- 顶部栏：当前会话名称 + 模式标签 + 面试控制按钮
- 消息区域：自适应滚动，新消息自动滚到底部
- AI 消息：左侧对齐，圆形图标（psychology/smart_toy），MD3 surface-container-low 背景
- 用户消息：右侧对齐，MD3 primary 背景 + 白色文字
- 流式消息：逐字显示 + 打字光标动画
- 面试模式下 AI 消息显示评分和反馈标签

### Step 4.5: ChatInput 组件改造

- 输入框：自适应高度 textarea（最小1行，最大6行）
- 发送按钮：主色调，回车发送，Shift+回车换行
- 录音按钮：面试模式下显示麦克风图标（复用旧 Interview 页面的录音逻辑）
- 禁用态：流式响应进行中时禁用输入和发送
- 附件按钮（预留，暂不实现）

### Step 4.6: ModeSwitcher 组件

- 使用 Ant Design `Segmented` 组件
- 两个模式：普通对话（smart_toy 图标）、面试模式（psychology 图标）
- 切换时：
  - 清空当前选中会话
  - 根据新模式过滤会话列表
  - 重置相关状态

### Step 4.7: EmptyState 组件

- 无选中会话时显示
- 居中大图标 + "开始新对话" 引导文字
- 快速开始建议卡片（如："帮我分析职业方向"、"模拟面试练习"等）

### Step 4.8: MD3 暗色模式适配

所有新组件使用 MD3 CSS 变量：
- 背景：`var(--md-sys-color-surface-container-low)` 
- 文字：`var(--md-sys-color-on-surface)`
- 主色：`var(--md-sys-color-primary)`
- 容器：`var(--md-sys-color-surface-container)`
- 轮廓：`var(--md-sys-color-outline-variant)`

确保暗色模式下所有元素正确响应 `data-theme="dark"`。

### Step 4.9: 录音功能迁移

从旧 Interview 页面（`pages/Interview/index.tsx`）提取录音相关逻辑：
- MediaRecorder + PCM 转换逻辑
- Whisper API 调用（`VITE_VOICE_API_BASE_URL/transcribe`）
- 录音状态管理（recording、processing）
- 按钮状态切换（麦克风 → 录音中动画）

迁移到 `ChatInput.tsx` 中，仅在面试模式下显示录音按钮。

### Step 4.10: 验证

- 在桌面端验证：左侧会话列表 + 右侧聊天区的两栏布局
- 在移动端验证：会话列表折叠为 Drawer，聊天区占满
- 验证普通对话和面试模式切换功能
- 验证暗色模式下所有元素显示正确
- 验证流式消息逐字显示
- 验证面试模式录音功能
- `npm run lint` 通过

---

## Task 5: 清理遗留代码

**Files:**
- Delete: `high-school-worker-design-forend/src/pages/Interview/index.tsx`
- Delete: `high-school-worker-design-forend/src/pages/Interview/FloatingPolygons.css`
- Remove: `App.tsx` 中 Interview 页面的 lazy import
- Decide: 后端 `/api/v1/interview/*` 7个端点是否保留（如旧前端已不再使用可标记废弃）

### Step 5.1: 删除旧 Interview 前端页面

删除 `pages/Interview/` 整个目录，移除 App.tsx 中的 lazy import 和路由定义。

### Step 5.2: 后端 Interview API 决策

**后端 Interview API 有两条路径：**
1. `/api/v1/interview/*`（7个端点）— 旧 Interview 页面专用
2. `/api/v1/ai/conversations/*`（6个端点）— 新 AI Assistant 页面使用

由于新 AIChat 页面将继续使用 `/ai/conversations` 端点，旧的 `/interview` 端点暂时可以保留（不影响功能），但建议标记为 deprecated。

### Step 5.3: 验证

- `npm run lint` 通过
- `npm run build` 通过
- 功能回归：AI 对话、面试模式、普通模式全部正常

---

## 风险与注意事项

1. **数据库迁移**：`chat_messages` 表加字段需要处理已有数据，score/feedback 对历史消息为 NULL
2. **SSE 流式响应**：面试模式和普通模式共用 `sendMessageStream`，但分支逻辑不同，需确保互不干扰
3. **路由切换**：从独立全屏路由改为 MainLayout 内嵌路径，需确认布局不会破坏（高度计算、滚动区域）
4. **录音功能**：从旧页面迁移录音逻辑时注意浏览器权限和 PCM 编码兼容性
5. **状态管理**：useAIChatStore 同时管理普通对话和面试对话，需确保模式切换时状态清理干净
6. **移动端适配**：ChatGPT 风格两栏布局在移动端需要折叠为 Drawer，需全面测试

---

## 执行顺序建议

Task 1 → Task 2 → Task 3 → Task 4 → Task 5

每个 Task 完成后提交一次，确保可以随时回退。Task 4 是最大的前端改动，建议在 Task 1-3 全部验证通过后再开始。