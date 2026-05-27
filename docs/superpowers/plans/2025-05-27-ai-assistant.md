# AI助手功能 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在侧边栏新增"AI对话"独立页面，支持普通模式（AI求职助手对话，SSE流式输出，历史保留）和面试模式（现有面试功能迁移+新增面试回顾）。

**Architecture:** 复用现有 `chat_groups`/`chat_messages` 表，新增 `chat_type='ai_assistant'` 和 `sender_type='assistant'`。后端新增 `/api/v1/ai/conversations` 端点组，使用 DeepSeek SSE 流式输出。前端新增 `/ai-assistant` 路由页面，zustand store 管理状态。

**Tech Stack:** Go (go-zero), React 19, Ant Design v6, Zustand, Tailwind CSS v4, SSE

---

## Task 1: 后端 — 数据库迁移

**Files:**
- Modify: `career.go` (autoMigrate 函数)

- [ ] **Step 1: 修改 chat_groups 表创建 SQL，添加 interview_session_id 列**

在 `career.go` 的 `autoMigrate` 函数中，找到 `chat_groups` 表的 `createSQL`，在 `updated_at` 后面添加 `interview_session_id` 列：

```sql
interview_session_id BIGINT(20) DEFAULT NULL COMMENT '关联的面试记录ID',
```

同时修改 `chat_messages` 表的 `sender_type` 注释，从 `teacher, student` 改为 `teacher, student, assistant`。

- [ ] **Step 2: 修改 `chat_groups` 表的 `chat_type` 注释**

从 `direct(一对一)` 改为 `direct(一对一), ai_assistant(AI助手), interview_review(面试回顾)`。

- [ ] **Step 3: 在 `syncTableByBuiltinSchema` 调用后，添加 ALTER TABLE 语句来为已有表增加新列**

在 `autoMigrate` 函数的循环之后（所有表创建/同步完成后），添加迁移逻辑：

```go
// 迁移：为 chat_groups 添加 interview_session_id 列（如果不存在）
var colExists bool
row := db.QueryRow("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_groups' AND COLUMN_NAME = 'interview_session_id'")
row.Scan(&colExists)
if !colExists {
    if _, err := db.Exec("ALTER TABLE chat_groups ADD COLUMN interview_session_id BIGINT(20) DEFAULT NULL COMMENT '关联的面试记录ID'"); err != nil {
        fmt.Printf("[DB-SYNC] 添加 interview_session_id 列失败: %v\n", err)
    } else {
        fmt.Println("[DB-SYNC] 已为 chat_groups 添加 interview_session_id 列")
    }
}
```

- [ ] **Step 4: 启动服务验证迁移**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go run career.go -f etc/career-api.yaml -skip-all`

---

## Task 2: 后端 — 添加请求/响应类型

**Files:**
- Modify: `internal/types/types.go`

- [ ] **Step 1: 在 types.go 末尾添加 AI 对话相关类型**

在 `types.go` 文件末尾（`ReadMessageReq` 之后）添加：

```go
// AI 对话相关请求和响应类型

type CreateAIConversationReq struct {
	Name string `json:"name,optional"`
}

type AIConversation struct {
	Id            int64  `json:"id"`
	SchoolId      int64  `json:"schoolId"`
	Name          string `json:"name"`
	ChatType      string `json:"chatType"`
	InterviewSessionId int64 `json:"interviewSessionId,omitempty"`
	CreatedBy     int64  `json:"createdBy"`
	CreatedAt     int64  `json:"createdAt"`
	UpdatedAt     int64  `json:"updatedAt"`
	LastMessage   string `json:"lastMessage,omitempty"`
}

type SendAIMessageReq struct {
	Content string `json:"content" validate:"required,min=1"`
}

type AIMessage struct {
	Id         int64  `json:"id"`
	GroupId    int64  `json:"groupId"`
	SenderId   int64  `json:"senderId"`
	SenderType string `json:"senderType"`
	SenderName string `json:"senderName"`
	Content    string `json:"content"`
	CreatedAt  int64  `json:"createdAt"`
}

type RenameAIConversationReq struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

type CreateInterviewReviewReq struct {
	InterviewSessionId int64  `json:"interviewSessionId" validate:"required,gt=0"`
	Name                string `json:"name,optional"`
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./internal/types/`

---

## Task 3: 后端 — 扩展 AIProvider 接口，添加 Chat 方法

**Files:**
- Modify: `common/pkg/ai_provider.go`

- [ ] **Step 1: 在 AIProvider 接口添加 ChatStream 方法**

在 `AIProvider` 接口中添加：

```go
ChatStream(ctx context.Context, messages []ChatMessage) (<-chan string, <-chan error)
```

- [ ] **Step 2: 实现 ChatStream 方法在 OpenAIProvider**

在 `ai_provider.go` 文件末尾添加实现。该方法复用现有的 SSE 流式调用模式（参考 `GenerateCareerReportStream`），但接受通用的 `[]ChatMessage` 参数：

```go
func (p *OpenAIProvider) ChatStream(ctx context.Context, messages []ChatMessage) (<-chan string, <-chan error) {
	contentChan := make(chan string, 100)
	errChan := make(chan error, 1)

	go func() {
		defer close(contentChan)
		defer close(errChan)

		apiReq := OpenAIRequest{
			Model:       p.model,
			Messages:    messages,
			MaxTokens:   4000,
			Temperature: 0.7,
			Stream:      true,
		}

		body, err := json.Marshal(apiReq)
		if err != nil {
			errChan <- fmt.Errorf("marshal request failed: %v", err)
			return
		}

		c := &http.Client{Timeout: p.timeout}
		httpReq, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
		if err != nil {
			errChan <- fmt.Errorf("create request failed: %v", err)
			return
		}

		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)
		httpReq.Header.Set("Accept", "text/event-stream")

		resp, err := c.Do(httpReq)
		if err != nil {
			errChan <- fmt.Errorf("http request failed: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			respBody, _ := io.ReadAll(resp.Body)
			errChan <- fmt.Errorf("AI API error: status=%d, body=%s", resp.StatusCode, string(respBody))
			return
		}

		reader := bufio.NewReader(resp.Body)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				if err != io.EOF {
					errChan <- fmt.Errorf("read stream failed: %v", err)
				}
				break
			}

			line = strings.TrimSpace(line)
			if line == "" || line == "data: [DONE]" {
				continue
			}

			if !strings.HasPrefix(line, "data: ") {
				continue
			}

			data := strings.TrimPrefix(line, "data: ")
			var streamResp struct {
				Choices []StreamChoice `json:"choices"`
				Error   *AIError       `json:"error,omitempty"`
			}

			if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
				logx.Errorf("unmarshal stream data failed: %v", err)
				continue
			}

			if streamResp.Error != nil {
				errChan <- fmt.Errorf("AI API error: %s", streamResp.Error.Message)
				return
			}

			if len(streamResp.Choices) > 0 {
				content := streamResp.Choices[0].Delta.Content
				if content != "" {
					contentChan <- content
				}
				if streamResp.Choices[0].FinishReason != nil {
					break
				}
			}
		}
	}()

	return contentChan, errChan
}
```

- [ ] **Step 3: 验证编译**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./common/pkg/`

---

## Task 4: 后端 — 创建 AI 对话 Logic 层

**Files:**
- Create: `internal/logic/ai/createconversationlogic.go`
- Create: `internal/logic/ai/listconversationslogic.go`
- Create: `internal/logic/ai/renameconversationlogic.go`
- Create: `internal/logic/ai/deleteconversationlogic.go`
- Create: `internal/logic/ai/sendmessagelogic.go`
- Create: `internal/logic/ai/listmessageslogic.go`
- Create: `internal/logic/ai/helpers.go`

- [ ] **Step 1: 创建 helpers.go**

创建 `internal/logic/ai/helpers.go`，包含通用辅助函数（参考 `internal/logic/chat/helpers.go`）：

```go
package ai

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type currentUser struct {
	id   int64
	role string
	name string
}

func resolveCurrentUser(ctx context.Context) (currentUser, error) {
	userID, ok := ctx.Value("userId").(int64)
	if !ok || userID <= 0 {
		return currentUser{}, &apperrors.CodeError{Code: apperrors.CodeUnauthorized, Msg: "unauthorized"}
	}
	role, _ := ctx.Value("role").(string)
	if role == "" {
		role = "student"
	}
	name, _ := ctx.Value("userName").(string)
	if name == "" {
		name = "用户"
	}
	return currentUser{id: userID, role: role, name: name}, nil
}

func rawDB(ctx context.Context, svcCtx *svc.ServiceContext) (*sql.DB, error) {
	db, err := svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}
	return db, nil
}

func getUserSchoolID(ctx context.Context, db *sql.DB, userID int64) (int64, error) {
	var schoolID sql.NullInt64
	if err := db.QueryRowContext(ctx, `SELECT school_id FROM users WHERE id = ? LIMIT 1`, userID).Scan(&schoolID); err != nil {
		return 0, fmt.Errorf("school not found")
	}
	if !schoolID.Valid || schoolID.Int64 <= 0 {
		return 0, fmt.Errorf("school not found")
	}
	return schoolID.Int64, nil
}

func nowUnix() int64 {
	return time.Now().Unix()
}

const systemPrompt = `你是一名专业的求职顾问AI助手，名为"职途助手"。你的职责是：

1. 求职指导：帮助用户了解不同行业、岗位的发展前景和要求
2. 简历优化：帮助用户完善简历内容，突出个人优势
3. 面试技巧：提供面试准备建议，模拟面试场景
4. 职业规划：帮助用户制定短期和长期职业目标
5. 行业动态：分享行业趋势和就业市场信息

回答要求：
- 使用中文回复
- 给出具体、可操作的建议
- 如果用户的问题不明确，适当追问
- 保持友好、专业的语气
- 不要编造虚假信息，如果不确定，坦诚说明`
```

- [ ] **Step 2: 创建 createconversationlogic.go**

```go
package ai

import (
	"context"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type CreateAIConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateAIConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateAIConversationLogic {
	return &CreateAIConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateAIConversationLogic) CreateAIConversation(req *types.CreateAIConversationReq) (*types.AIConversation, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	schoolID, err := getUserSchoolID(l.ctx, db, user.id)
	if err != nil {
		schoolID = 0
	}

	name := req.Name
	if name == "" {
		name = "新对话"
	}

	now := nowUnix()

	result, err := db.ExecContext(l.ctx,
		`INSERT INTO chat_groups (school_id, name, chat_type, created_by, created_at, updated_at)
		 VALUES (?, ?, 'ai_assistant', ?, ?, ?)`,
		schoolID, name, user.id, now, now)
	if err != nil {
		logx.Errorf("create AI conversation failed: %v", err)
		return nil, &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "创建对话失败"}
	}

	groupId, _ := result.LastInsertId()

	// 创建者自动加入成员
	_, err = db.ExecContext(l.ctx,
		`INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
		 VALUES (?, ?, ?, ?, 'owner', ?)`,
		groupId, user.id, normalizeUserType(user.role), user.name, now)
	if err != nil {
		logx.Errorf("create AI conversation member failed: %v", err)
	}

	return &types.AIConversation{
		Id:         groupId,
		SchoolId:   schoolID,
		Name:       name,
		ChatType:   "ai_assistant",
		CreatedBy:  user.id,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}
```

注意：需要在 helpers.go 末尾也加 `normalizeUserType` 函数（直接复制 chat/helpers.go 中的即可）。

- [ ] **Step 3: 创建 listconversationslogic.go**

```go
package ai

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"
)

type ListAIConversationsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListAIConversationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAIConversationsLogic {
	return &ListAIConversationsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListAIConversationsLogic) ListAIConversations() ([]*types.AIConversation, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(l.ctx, `
		SELECT g.id, g.school_id, g.name, g.chat_type, g.interview_session_id, g.created_by, g.created_at, g.updated_at,
		       COALESCE((SELECT cm.content FROM chat_messages cm WHERE cm.group_id = g.id ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1), '') AS last_message
		FROM chat_groups g
		JOIN chat_group_members m ON g.id = m.group_id
		WHERE m.user_id = ? AND m.user_type = ? AND g.chat_type IN ('ai_assistant', 'interview_review')
		ORDER BY g.updated_at DESC
	`, user.id, normalizeUserType(user.role))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []*types.AIConversation
	for rows.Next() {
		var c types.AIConversation
		var interviewSessionId sql.NullInt64
		if err := rows.Scan(&c.Id, &c.SchoolId, &c.Name, &c.ChatType, &interviewSessionId, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt, &c.LastMessage); err != nil {
			continue
		}
		if interviewSessionId.Valid {
			c.InterviewSessionId = interviewSessionId.Int64
		}
		conversations = append(conversations, &c)
	}

	return conversations, nil
}
```

注意需要在文件顶部 `import` 中加 `"database/sql"`。

- [ ] **Step 4: 创建 renameconversationlogic.go**

```go
package ai

import (
	"context"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type RenameAIConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRenameAIConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RenameAIConversationLogic {
	return &RenameAIConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RenameAIConversationLogic) RenameAIConversation(conversationId int64, req *types.RenameAIConversationReq) (*types.AIConversation, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	// 验证用户是成员
	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		return nil, &apperrors.CodeError{Code: apperrors.CodeNotFound, Msg: "对话不存在"}
	}

	now := nowUnix()
	_, err = db.ExecContext(l.ctx,
		`UPDATE chat_groups SET name = ?, updated_at = ? WHERE id = ?`,
		req.Name, now, conversationId)
	if err != nil {
		return nil, &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "重命名失败"}
	}

	var c types.AIConversation
	row := db.QueryRowContext(l.ctx,
		`SELECT id, school_id, name, chat_type, COALESCE(interview_session_id, 0), created_by, created_at, updated_at FROM chat_groups WHERE id = ?`,
		conversationId)
	if err := row.Scan(&c.Id, &c.SchoolId, &c.Name, &c.ChatType, &c.InterviewSessionId, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}

	return &c, nil
}
```

- [ ] **Step 5: 创建 deleteconversationlogic.go**

```go
package ai

import (
	"context"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
)

type DeleteAIConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteAIConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteAIConversationLogic {
	return &DeleteAIConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteAIConversationLogic) DeleteAIConversation(conversationId int64) error {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return err
	}

	// 验证用户是成员
	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		return &apperrors.CodeError{Code: apperrors.CodeNotFound, Msg: "对话不存在"}
	}

	// 删除消息
	_, _ = db.ExecContext(l.ctx, `DELETE FROM chat_messages WHERE group_id = ?`, conversationId)
	// 删除成员
	_, _ = db.ExecContext(l.ctx, `DELETE FROM chat_group_members WHERE group_id = ?`, conversationId)
	// 删除群组
	_, err = db.ExecContext(l.ctx, `DELETE FROM chat_groups WHERE id = ?`, conversationId)
	if err != nil {
		return &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "删除失败"}
	}

	return nil
}
```

- [ ] **Step 6: 创建 listmessageslogic.go**

```go
package ai

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"
)

type ListAIMessagesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListAIMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAIMessagesLogic {
	return &ListAIMessagesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListAIMessagesLogic) ListAIMessages(conversationId int64) ([]*types.AIMessage, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	// 验证用户是成员
	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		return nil, &apperrors.CodeError{Code: apperrors.CodeNotFound, Msg: "对话不存在"}
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT id, group_id, sender_id, sender_type, sender_name, content, created_at
		 FROM chat_messages
		 WHERE group_id = ?
		 ORDER BY created_at ASC, id ASC`, conversationId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*types.AIMessage
	for rows.Next() {
		var msg types.AIMessage
		if err := rows.Scan(&msg.Id, &msg.GroupId, &msg.SenderId, &msg.SenderType, &msg.SenderName, &msg.Content, &msg.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, &msg)
	}

	return messages, nil
}
```

- [ ] **Step 7: 创建 sendmessagelogic.go（核心 SSE 流式逻辑）**

```go
package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SendAIMessageLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendAIMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendAIMessageLogic {
	return &SendAIMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendAIMessageLogic) SendMessage(w http.ResponseWriter, conversationId int64, req *types.SendAIMessageReq) {
	// 设置SSE响应头
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "SSE not supported",
		})
		return
	}

	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "internal error",
		})
		return
	}

	// 验证用户是对话成员
	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeNotFound,
			"msg":  "对话不存在",
		})
		return
	}

	// 保存用户消息
	now := nowUnix()
	result, err := db.ExecContext(l.ctx,
		`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		conversationId, user.id, normalizeUserType(user.role), user.name, req.Content, now)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "保存消息失败",
		})
		return
	}
	userMsgId, _ := result.LastInsertId()

	// 发送用户消息确认
	l.sendSSEEvent(w, flusher, "user_message", map[string]interface{}{
		"id":         userMsgId,
		"groupId":    conversationId,
		"senderId":   user.id,
		"senderType": normalizeUserType(user.role),
		"senderName": user.name,
		"content":    req.Content,
		"createdAt":  now,
	})

	// 加载历史消息，构建AI消息列表
	messages := []pkg.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT sender_type, content FROM chat_messages WHERE group_id = ? ORDER BY created_at ASC, id ASC`, conversationId)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var senderType, content string
			if rows.Scan(&senderType, &content) == nil {
				role := "user"
				if senderType == "assistant" {
					role = "assistant"
				}
				messages = append(messages, pkg.ChatMessage{Role: role, Content: content})
			}
		}
	}

	// 调用AI流式API
	contentChan, errChan := l.svcCtx.AIProvider.ChatStream(l.ctx, messages)

	var fullResponse strings.Builder
	done := false
	var streamErr error

	for !done {
		select {
		case content, ok := <-contentChan:
			if !ok {
				done = true
			} else {
				fullResponse.WriteString(content)
				l.sendSSEEvent(w, flusher, "chunk", map[string]interface{}{
					"content": content,
				})
			}
		case err := <-errChan:
			if err != nil {
				streamErr = err
			}
			done = true
		case <-l.ctx.Done():
			done = true
		}
	}

	if streamErr != nil {
		logx.Errorf("AI stream error: %v", streamErr)
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  streamErr.Error(),
		})
		return
	}

	// 保存AI回复到数据库
	aiContent := fullResponse.String()
	if aiContent != "" {
		aiResult, err := db.ExecContext(l.ctx,
			`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
			 VALUES (?, 0, 'assistant', '职途助手', ?, ?)`,
			conversationId, aiContent, nowUnix())
		if err != nil {
			logx.Errorf("save AI message failed: %v", err)
		}
		aiMsgId, _ := aiResult.LastInsertId()
		l.sendSSEEvent(w, flusher, "ai_message", map[string]interface{}{
			"id":         aiMsgId,
			"groupId":    conversationId,
			"senderId":   0,
			"senderType": "assistant",
			"senderName": "职途助手",
			"content":    aiContent,
			"createdAt":  nowUnix(),
		})
	}

	// 更新对话更新时间
	_, _ = db.ExecContext(l.ctx, `UPDATE chat_groups SET updated_at = ? WHERE id = ?`, nowUnix(), conversationId)

	l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
		"message": "ok",
	})
}

func (l *SendAIMessageLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}
```

注意：`pkg` import 应为 `ai "career-api/common/pkg"`，使用 `ai.ChatMessage` 而不是 `pkg.ChatMessage`。

- [ ] **Step 8: 在 helpers.go 中添加 normalizeUserType 函数**

在 `internal/logic/ai/helpers.go` 的 `nowUnix` 函数后面，添加：

```go
func normalizeUserType(role string) string {
	switch strings.ToLower(role) {
	case "teacher":
		return "teacher"
	default:
		return "student"
	}
}
```

同时在 helpers.go 的 import 中添加 `"strings"`。

- [ ] **Step 9: 验证编译**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./internal/logic/ai/`

---

## Task 5: 后端 — 创建 Handler 层并注册路由

**Files:**
- Create: `internal/handler/ai/aihandler.go`
- Modify: `internal/handler/routes.go`

- [ ] **Step 1: 创建 aihandler.go**

```go
package ai

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	apperrors "career-api/common/errors"
	"career-api/internal/logic/ai"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func writeAIResponse(w http.ResponseWriter, code int, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	resp := map[string]interface{}{"code": code, "msg": msg}
	if data != nil {
		resp["data"] = data
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func writeAIError(w http.ResponseWriter, err error) {
	if codeErr, ok := err.(*apperrors.CodeError); ok {
		writeAIResponse(w, codeErr.Code, codeErr.Msg, nil)
		return
	}
	writeAIResponse(w, apperrors.CodeInternalError, err.Error(), nil)
}

func parseConversationID(path string) int64 {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, part := range parts {
		if part == "conversations" && i+1 < len(parts) {
			if id, err := strconv.ParseInt(parts[i+1], 10, 64); err == nil {
				return id
			}
		}
	}
	return 0
}

func CreateAIConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateAIConversationReq
		if err := parseJSON(r, &req); err != nil {
			writeAIError(w, err)
			return
		}
		l := ai.NewCreateAIConversationLogic(r.Context(), svcCtx)
		resp, err := l.CreateAIConversation(&req)
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func ListAIConversationsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := ai.NewListAIConversationsLogic(r.Context(), svcCtx)
		resp, err := l.ListAIConversations()
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func RenameAIConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		var req types.RenameAIConversationReq
		if err := parseJSON(r, &req); err != nil {
			writeAIError(w, err)
			return
		}
		l := ai.NewRenameAIConversationLogic(r.Context(), svcCtx)
		resp, err := l.RenameAIConversation(conversationId, &req)
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func DeleteAIConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		l := ai.NewDeleteAIConversationLogic(r.Context(), svcCtx)
		if err := l.DeleteAIConversation(conversationId); err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "deleted", nil)
		}
	}
}

func ListAIMessagesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		l := ai.NewListAIMessagesLogic(r.Context(), svcCtx)
		resp, err := l.ListAIMessages(conversationId)
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func SendAIMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		var req types.SendAIMessageReq
		if err := parseJSON(r, &req); err != nil {
			writeAIError(w, err)
			return
		}
		l := ai.NewSendAIMessageLogic(r.Context(), svcCtx)
		l.SendMessage(w, conversationId, &req)
	}
}

func parseJSON(r *http.Request, v interface{}) error {
	if r.Body == nil {
		return nil
	}
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
```

- [ ] **Step 2: 修改 routes.go 注册路由**

在 `routes.go` 文件中，添加 import:

```go
aihandler "career-api/internal/handler/ai"
```

然后在 `RegisterHandlers` 函数末尾（在最后一个 `}` 之前），添加新的路由组：

```go
server.AddRoutes(
	[]rest.Route{
		{
			Method:  http.MethodPost,
			Path:    "/ai/conversations",
			Handler: aihandler.CreateAIConversationHandler(serverCtx),
		},
		{
			Method:  http.MethodGet,
			Path:    "/ai/conversations",
			Handler: aihandler.ListAIConversationsHandler(serverCtx),
		},
		{
			Method:  http.MethodPut,
			Path:    "/ai/conversations/:id",
			Handler: aihandler.RenameAIConversationHandler(serverCtx),
		},
		{
			Method:  http.MethodDelete,
			Path:    "/ai/conversations/:id",
			Handler: aihandler.DeleteAIConversationHandler(serverCtx),
		},
		{
			Method:  http.MethodGet,
			Path:    "/ai/conversations/:id/messages",
			Handler: aihandler.ListAIMessagesHandler(serverCtx),
		},
		{
			Method:  http.MethodPost,
			Path:    "/ai/conversations/:id/messages",
			Handler: aihandler.SendAIMessageHandler(serverCtx),
		},
	},
	rest.WithPrefix("/api/v1"),
	rest.WithTimeout(120000*time.Millisecond),
)
```

注意需要确保 `import` 中已包含 `"time"`（已有）和新的 `aihandler` 包。

- [ ] **Step 3: 验证完整编译**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build -o /dev/null .`

---

## Task 6: 前端 — 添加 API 客户端和类型

**Files:**
- Modify: `high-school-worker-design-forend/src/types/index.ts`
- Modify: `high-school-worker-design-forend/src/api/index.ts`

- [ ] **Step 1: 在 types/index.ts 末尾添加 AI 对话相关类型**

```typescript
// AI 对话相关类型
export interface AIConversation {
  id: number;
  schoolId: number;
  name: string;
  chatType: 'ai_assistant' | 'interview_review';
  interviewSessionId?: number;
  createdBy: number;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
}

export interface AIMessage {
  id: number;
  groupId: number;
  senderId: number;
  senderType: 'student' | 'teacher' | 'assistant';
  senderName: string;
  content: string;
  createdAt: number;
}
```

同时修改现有的 `ChatMessage` 接口，将 `senderType` 类型从 `'teacher' | 'student'` 扩展为 `'teacher' | 'student' | 'assistant'`。

- [ ] **Step 2: 在 api/index.ts 中添加 aiApi**

在文件末尾（`export` 语句之前或最后一个 api 对象之后）添加：

```typescript
export const aiApi = {
  createConversation: (data: { name?: string }) =>
    api.post<{ code: number; msg: string; data: import('../types').AIConversation }>('/ai/conversations', data),

  listConversations: () =>
    api.get<{ code: number; msg: string; data: import('../types').AIConversation[] }>('/ai/conversations'),

  renameConversation: (id: number, data: { name: string }) =>
    api.put<{ code: number; msg: string; data: import('../types').AIConversation }>(`/ai/conversations/${id}`, data),

  deleteConversation: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/ai/conversations/${id}`),

  getMessages: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').AIMessage[] }>(`/ai/conversations/${id}/messages`),

  sendMessage: async (
    id: number,
    content: string,
    onEvent: (event: { type: string; data: unknown }) => void,
    onError: (error: Error) => void
  ) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${BASE_URL}/ai/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let buffer = '';
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '') continue;

          if (trimmedLine.startsWith('event: ')) {
            currentEventType = trimmedLine.substring(7);
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.substring(6);
            try {
              const parsedData = JSON.parse(data);
              onEvent({ type: currentEventType || 'data', data: parsedData });
              currentEventType = '';
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  },
};
```

---

## Task 7: 前端 — 创建 Zustand Store

**Files:**
- Modify: `high-school-worker-design-forend/src/stores/index.ts`

- [ ] **Step 1: 在 stores/index.ts 末尾添加 useAIChatStore**

```typescript
import type { AIConversation, AIMessage } from '../types';
```

然后在文件末尾添加：

```typescript
interface AIChatState {
  conversations: AIConversation[];
  currentConversationId: number | null;
  messages: AIMessage[];
  isStreaming: boolean;
  mode: 'normal' | 'interview';
  loadConversations: () => Promise<void>;
  createConversation: (name?: string) => Promise<AIConversation | null>;
  renameConversation: (id: number, name: string) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: 'normal' | 'interview') => void;
  clearCurrentConversation: () => void;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  mode: 'normal',

  loadConversations: async () => {
    try {
      const res = await aiApi.listConversations();
      if (res?.data) {
        set({ conversations: Array.isArray(res.data) ? res.data : [] });
      }
    } catch (e) {
      console.error('Failed to load AI conversations:', e);
    }
  },

  createConversation: async (name?: string) => {
    try {
      const res = await aiApi.createConversation({ name: name || '新对话' });
      if (res?.data) {
        const newConv = res.data;
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          currentConversationId: newConv.id,
          messages: [],
        }));
        await get().loadConversations();
        return newConv;
      }
    } catch (e) {
      console.error('Failed to create AI conversation:', e);
    }
    return null;
  },

  renameConversation: async (id: number, name: string) => {
    try {
      await aiApi.renameConversation(id, { name });
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, name } : c
        ),
      }));
    } catch (e) {
      console.error('Failed to rename AI conversation:', e);
    }
  },

  deleteConversation: async (id: number) => {
    try {
      await aiApi.deleteConversation(id);
      set((state) => {
        const newConvs = state.conversations.filter((c) => c.id !== id);
        const newCurrentId = state.currentConversationId === id
          ? (newConvs.length > 0 ? newConvs[0].id : null)
          : state.currentConversationId;
        return {
          conversations: newConvs,
          currentConversationId: newCurrentId,
          messages: state.currentConversationId === id ? [] : state.messages,
        };
      });
    } catch (e) {
      console.error('Failed to delete AI conversation:', e);
    }
  },

  selectConversation: async (id: number) => {
    try {
      const res = await aiApi.getMessages(id);
      set({
        currentConversationId: id,
        messages: Array.isArray(res?.data) ? res.data : [],
      });
    } catch (e) {
      console.error('Failed to load AI messages:', e);
    }
  },

  sendMessage: async (content: string) => {
    const { currentConversationId, messages } = get();
    if (!currentConversationId) return;

    set({ isStreaming: true });

    // 添加用户消息到本地状态
    const tempUserMsg: AIMessage = {
      id: Date.now(),
      groupId: currentConversationId,
      senderId: -1,
      senderType: 'student',
      senderName: '我',
      content,
      createdAt: Math.floor(Date.now() / 1000),
    };
    set({ messages: [...messages, tempUserMsg] });

    // 添加占位AI消息
    const tempAiMsg: AIMessage = {
      id: Date.now() + 1,
      groupId: currentConversationId,
      senderId: 0,
      senderType: 'assistant',
      senderName: '职途助手',
      content: '',
      createdAt: Math.floor(Date.now() / 1000),
    };
    set((state) => ({ messages: [...state.messages, tempAiMsg] }));

    await aiApi.sendMessage(
      currentConversationId,
      content,
      (event) => {
        const { type, data } = event;
        if (type === 'chunk') {
          const parsed = data as { content: string };
          set((state) => {
            const newMessages = [...state.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.senderType === 'assistant') {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + parsed.content,
              };
            }
            return { messages: newMessages };
          });
        } else if (type === 'user_message') {
          const parsed = data as AIMessage;
          set((state) => {
            const newMessages = state.messages.map((m) =>
              m.id === tempUserMsg.id ? { ...parsed } : m
            );
            return { messages: newMessages };
          });
        } else if (type === 'ai_message') {
          const parsed = data as AIMessage;
          set((state) => {
            const newMessages = state.messages.map((m) =>
              m.id === tempAiMsg.id ? { ...parsed } : m
            );
            return { messages: newMessages };
          });
        } else if (type === 'done') {
          set({ isStreaming: false });
          get().loadConversations();
        } else if (type === 'error') {
          set({ isStreaming: false });
        }
      },
      (error) => {
        console.error('AI message stream error:', error);
        set({ isStreaming: false });
      }
    );
  },

  setMode: (mode: 'normal' | 'interview') => set({ mode }),

  clearCurrentConversation: () => set({ currentConversationId: null, messages: [] }),
}));
```

注意：需要在 stores/index.ts 顶部添加 `aiApi` 的 import（因为 store 中调用了 aiApi），但实际上 aiApi 是在 api/index.ts 中定义的，需要把 import 加上：

```typescript
import { userApi, aiApi } from '../api';
```

---

## Task 8: 前端 — 创建 AI 助手页面和组件

**Files:**
- Create: `high-school-worker-design-forend/src/pages/AIAssistant/index.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIAssistant/components/ConversationList.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIAssistant/components/ChatView.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIAssistant/components/MessageBubble.tsx`
- Create: `high-school-worker-design-forend/src/pages/AIAssistant/components/ChatInput.tsx`

这是前端的核心任务。由于组件较大，这里提供关键结构和要点：

- [ ] **Step 1: 创建 MessageBubble.tsx**

消息气泡组件，区分用户消息和AI消息的样式：

```tsx
import type { AIMessage } from '../../../types';

interface MessageBubbleProps {
  message: AIMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.senderType !== 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-[var(--surface-container-low)] text-[var(--on-surface)] rounded-bl-md'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content || '...'}</div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-sm">person</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 ChatInput.tsx**

输入框组件，含发送按钮和加载状态：

```tsx
import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled = false, placeholder = '输入你的求职问题...' }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="flex gap-2 p-4 border-t border-[var(--outline-variant)] bg-[var(--surface-container)]">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleSend}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
        size="large"
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        size="large"
      />
    </div>
  );
}
```

- [ ] **Step 3: 创建 ChatView.tsx**

聊天主视图组件，包含消息列表和输入：

```tsx
import { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import type { AIMessage } from '../../../types';

interface ChatViewProps {
  messages: AIMessage[];
  onSend: (content: string) => void;
  isStreaming: boolean;
}

export default function ChatView({ messages, onSend, isStreaming }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--on-surface-variant)]">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-30">psychology</span>
            <p className="text-lg font-medium mb-2">你好，我是职途助手</p>
            <p className="text-sm">可以问我任何关于求职、简历、面试的问题</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.senderType === 'assistant' && !messages[messages.length - 1]?.content && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
              <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
            </div>
            <Spin size="small" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
```

- [ ] **Step 4: 创建 ConversationList.tsx**

侧边对话列表，含新建、重命名、删除功能：

```tsx
import { useState } from 'react';
import { Button, List, Modal, Input, Popconfirm, Empty } from 'antd';
import { PlusOutlined, ChatOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AIConversation } from '../../../types';

interface ConversationListProps {
  conversations: AIConversation[];
  currentId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export default function ConversationList({
  conversations,
  currentId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ConversationListProps) {
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = (id: number) => {
    if (renameValue.trim()) {
      onRename(id, renameValue.trim());
    }
    setRenaming(null);
    setRenameValue('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--outline-variant)]">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
          新建对话
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <Empty description="暂无对话" className="mt-8" />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                className={`cursor-pointer px-4 py-3 hover:bg-[var(--surface-container-high)] transition-colors ${
                  conv.id === currentId ? 'bg-[var(--primary-container)]' : ''
                }`}
                onClick={() => {
                  if (renaming !== conv.id) onSelect(conv.id);
                }}
              >
                {renaming === conv.id ? (
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onPressEnter={() => handleRename(conv.id)}
                    onBlur={() => handleRename(conv.id)}
                    autoFocus
                    className="flex-1"
                  />
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center min-w-0 flex-1">
                      <ChatOutlined className="mr-2 shrink-0" />
                      <span className="truncate text-sm">{conv.name}</span>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <EditOutlined
                        className="text-[var(--on-surface-variant)] hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenaming(conv.id);
                          setRenameValue(conv.name);
                        }}
                      />
                      <Popconfirm
                        title="确定删除此对话？"
                        onConfirm={() => onDelete(conv.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <DeleteOutlined
                          className="text-[var(--on-surface-variant)] hover:text-red-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                )}
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 创建主页面 index.tsx**

```tsx
import { useEffect } from 'react';
import { Segmented } from 'antd';
import { useAIChatStore } from '../../stores';
import ConversationList from './components/ConversationList';
import ChatView from './components/ChatView';

export default function AIAssistantPage() {
  const {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    mode,
    loadConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    selectConversation,
    sendMessage,
    setMode,
  } = useAIChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--outline-variant)]">
        <h2 className="text-lg font-semibold text-[var(--on-surface)]">AI 对话</h2>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'normal' | 'interview')}
          options={[
            { label: '普通模式', value: 'normal' },
            { label: '面试模式', value: 'interview' },
          ]}
        />
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
          <ConversationList
            conversations={conversations.filter((c) =>
              mode === 'normal' ? c.chatType === 'ai_assistant' : c.chatType === 'interview_review'
            )}
            currentId={currentConversationId}
            onSelect={selectConversation}
            onCreate={createConversation}
            onRename={renameConversation}
            onDelete={deleteConversation}
          />
        </div>
        <div className="flex-1 min-w-0 bg-[var(--surface)]">
          {currentConversationId ? (
            <ChatView
              messages={messages}
              onSend={sendMessage}
              isStreaming={isStreaming}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--on-surface-variant)]">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">forum</span>
              <p className="text-lg">选择或创建一个对话开始</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Task 9: 前端 — 注册路由和导航

**Files:**
- Modify: `high-school-worker-design-forend/src/App.tsx`
- Modify: `high-school-worker-design-forend/src/hooks/useNavItems.ts`

- [ ] **Step 1: 在 App.tsx 添加路由**

在 App.tsx 的 import 区域添加：

```typescript
const AIAssistantPage = lazy(() => import('./pages/AIAssistant'));
```

在路由配置中（`<Route path="messages"` 之后）添加：

```tsx
<Route
  path="ai-assistant"
  element={
    <ProtectedRoute>
      <AIAssistantPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: 在 useNavItems.ts 添加导航项**

在 `studentNavGroups` 的"常用"分组中，在 `messages` 项之后添加：

```typescript
{ key: 'ai-assistant', title: 'AI 对话', description: 'AI求职助手和面试练习', icon: 'psychology', path: '/ai-assistant', matchPaths: ['/ai-assistant'] },
```

---

## Task 10: 集成测试与验证

- [ ] **Step 1: 后端编译并启动**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build -o /dev/null . && go run career.go -f etc/career-api.yaml -skip-all`

- [ ] **Step 2: 前端编译验证**

Run: `cd /home/swordreforge/projects/high-school-worker-design/high-school-worker-design-forend && npm run build`

- [ ] **Step 3: 前端 Lint 检查**

Run: `cd /home/swordreforge/projects/high-school-worker-design/high-school-worker-design-forend && npm run lint`