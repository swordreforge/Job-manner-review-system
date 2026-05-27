# Career Planning Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone conversational AI career planning assistant that lets students chat with AI, receiving personalized advice based on their profile, Holland results, and job match data.

**Architecture:** New backend module (`internal/handler/assistant/`, `internal/logic/assistant/`, `internal/model/`) following the interview feature's patterns. SSE streaming for chat via existing `AIProvider.ChatStream()`. New frontend page at `/assistant` with sidebar conversation list and chat area. Database tables `assistant_conversations` and `assistant_messages`.

**Tech Stack:** Go (go-zero framework), MySQL, React 19 + TypeScript + Ant Design + Zustand, SSE streaming

---

## File Structure

### Backend (new files)
- `internal/model/assistant_conversations_model_gen.go` — Generated-style struct + basic CRUD
- `internal/model/assistant_conversations_model.go` — Custom interface + queries
- `internal/model/assistant_messages_model_gen.go` — Generated-style struct + basic CRUD
- `internal/model/assistant_messages_model.go` — Custom interface + queries
- `internal/handler/assistant/createconversationhandler.go`
- `internal/handler/assistant/listconversationshandler.go`
- `internal/handler/assistant/deleteconversationhandler.go`
- `internal/handler/assistant/getmessageshandler.go`
- `internal/handler/assistant/assistantchatstreamhandler.go`
- `internal/logic/assistant/createconversationlogic.go`
- `internal/logic/assistant/listconversationslogic.go`
- `internal/logic/assistant/deleteconversationlogic.go`
- `internal/logic/assistant/getmessageslogic.go`
- `internal/logic/assistant/assistantchatstreamlogic.go`

### Backend (modified files)
- `career.go` — Add `assistant_conversations` and `assistant_messages` table CREATE TABLE entries
- `internal/svc/servicecontext.go` — Add new model fields
- `internal/handler/routes.go` — Add assistant route group
- `internal/types/types.go` — Add request/response types
- `common/errors/errors.go` — No changes needed (existing codes suffice)

### Frontend (new files)
- `forend/src/pages/Assistant/index.tsx` — Main assistant page component

### Frontend (modified files)
- `forend/src/types/index.ts` — Add assistant types
- `forend/src/api/index.ts` — Add `assistantApi`
- `forend/src/App.tsx` — Add `/assistant` route
- `forend/src/hooks/useNavItems.ts` — Add "助手" nav item

---

### Task 1: Add Database Tables

**Files:**
- Modify: `career.go` (add entries to `tables` slice in `autoMigrate()`)

- [ ] **Step 1: Add `assistant_conversations` and `assistant_messages` CREATE TABLE entries**

In the `autoMigrate()` function's `tables` slice, add after the last existing table entry (before the closing `}`):

```go
	{
		name: "assistant_conversations",
		createSQL: `CREATE TABLE IF NOT EXISTS assistant_conversations (
			id BIGINT(20) NOT NULL AUTO_INCREMENT,
			user_id BIGINT(20) NOT NULL,
			title VARCHAR(255) NOT NULL DEFAULT '新对话',
			track VARCHAR(20) NOT NULL DEFAULT 'bigtech',
			created_at BIGINT(20) NOT NULL,
			updated_at BIGINT(20) NOT NULL,
			PRIMARY KEY (id),
			KEY idx_user (user_id),
			KEY idx_user_updated (user_id, updated_at)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	},
	{
		name: "assistant_messages",
		createSQL: `CREATE TABLE IF NOT EXISTS assistant_messages (
			id BIGINT(20) NOT NULL AUTO_INCREMENT,
			conversation_id BIGINT(20) NOT NULL,
			role VARCHAR(20) NOT NULL,
			content TEXT NOT NULL,
			created_at BIGINT(20) NOT NULL,
			PRIMARY KEY (id),
			KEY idx_conversation (conversation_id),
			KEY idx_conversation_created (conversation_id, created_at),
			CONSTRAINT fk_assistant_msg_conversation FOREIGN KEY (conversation_id) REFERENCES assistant_conversations (id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	},
```

- [ ] **Step 2: Run the server briefly to auto-migrate, verify tables exist**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go run career.go -f etc/career-api.yaml --skip-all & sleep 5 && kill %1`

Then verify:
```bash
mysql -u root -e "SHOW TABLES LIKE 'assistant%'" career_api
```

- [ ] **Step 3: Commit**

```bash
git add career.go
git commit -m "feat: add assistant_conversations and assistant_messages tables"
```

---

### Task 2: Create Backend Model — Conversations

**Files:**
- Create: `internal/model/assistant_conversations_model_gen.go`
- Create: `internal/model/assistant_conversations_model.go`

- [ ] **Step 1: Create `assistant_conversations_model_gen.go`**

```go
package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/builder"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"github.com/zeromicro/go-zero/core/stringx"
)

var (
	assistantConversationsFieldNames          = builder.RawFieldNames(&AssistantConversations{})
	assistantConversationsRows                = strings.Join(assistantConversationsFieldNames, ",")
	assistantConversationsRowsExpectAutoSet   = strings.Join(stringx.Remove(assistantConversationsFieldNames, "`id`", "`created_at`", "`updated_at`"), ",")
	assistantConversationsRowsWithPlaceHolder = strings.Join(stringx.Remove(assistantConversationsFieldNames, "`id`", "`created_at`", "`updated_at`"), "=?,") + "=?"
)

type (
	assistantConversationsModel interface {
		Insert(ctx context.Context, data *AssistantConversations) (sql.Result, error)
		FindOne(ctx context.Context, id int64) (*AssistantConversations, error)
		Update(ctx context.Context, data *AssistantConversations) error
		Delete(ctx context.Context, id int64) error
	}

	defaultAssistantConversationsModel struct {
		conn  sqlx.SqlConn
		table string
	}

	AssistantConversations struct {
		Id        int64  `db:"id"`
		UserId    int64  `db:"user_id"`
		Title     string `db:"title"`
		Track     string `db:"track"`
		CreatedAt int64  `db:"created_at"`
		UpdatedAt int64  `db:"updated_at"`
	}
)

func newAssistantConversationsModel(conn sqlx.SqlConn) *defaultAssistantConversationsModel {
	return &defaultAssistantConversationsModel{
		conn:  conn,
		table: "`assistant_conversations`",
	}
}

func (m *defaultAssistantConversationsModel) Insert(ctx context.Context, data *AssistantConversations) (sql.Result, error) {
	query := fmt.Sprintf("insert into %s (%s) values (?, ?, ?, ?, ?)", m.table, assistantConversationsRowsExpectAutoSet)
	ret, err := m.conn.ExecCtx(ctx, query, data.UserId, data.Title, data.Track, data.CreatedAt, data.UpdatedAt)
	return ret, err
}

func (m *defaultAssistantConversationsModel) FindOne(ctx context.Context, id int64) (*AssistantConversations, error) {
	query := fmt.Sprintf("select %s from %s where `id` = ? limit 1", assistantConversationsRows, m.table)
	var resp AssistantConversations
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (m *defaultAssistantConversationsModel) Update(ctx context.Context, data *AssistantConversations) error {
	query := fmt.Sprintf("update %s set %s where `id` = ?", m.table, assistantConversationsRowsWithPlaceHolder)
	_, err := m.conn.ExecCtx(ctx, query, data.UserId, data.Title, data.Track, data.UpdatedAt, data.Id)
	return err
}

func (m *defaultAssistantConversationsModel) Delete(ctx context.Context, id int64) error {
	query := fmt.Sprintf("delete from %s where `id` = ?", m.table)
	_, err := m.conn.ExecCtx(ctx, query, id)
	return err
}
```

- [ ] **Step 2: Create `assistant_conversations_model.go`**

```go
package model

import (
	"context"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ AssistantConversationsModel = (*customAssistantConversationsModel)(nil)

type (
	AssistantConversationsModel interface {
		assistantConversationsModel
		withSession(session sqlx.Session) AssistantConversationsModel
		FindByUserId(ctx context.Context, userId int64, page, pageSize int) ([]*AssistantConversations, int64, error)
		FindOneByUserId(ctx context.Context, userId int64, id int64) (*AssistantConversations, error)
		UpdateTitle(ctx context.Context, id int64, title string) error
	}

	customAssistantConversationsModel struct {
		*defaultAssistantConversationsModel
	}
)

func NewAssistantConversationsModel(conn sqlx.SqlConn) AssistantConversationsModel {
	return &customAssistantConversationsModel{
		defaultAssistantConversationsModel: newAssistantConversationsModel(conn),
	}
}

func (m *customAssistantConversationsModel) withSession(session sqlx.Session) AssistantConversationsModel {
	return NewAssistantConversationsModel(sqlx.NewSqlConnFromSession(session))
}

func (m *customAssistantConversationsModel) FindByUserId(ctx context.Context, userId int64, page, pageSize int) ([]*AssistantConversations, int64, error) {
	var total int64
	countQuery := fmt.Sprintf("select count(*) from %s where `user_id` = ?", m.table)
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, userId)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s where `user_id` = ? order by `updated_at` desc limit ? offset ?", assistantConversationsRows, m.table)
	var resp []*AssistantConversations
	err = m.conn.QueryRowsCtx(ctx, &resp, query, userId, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

func (m *customAssistantConversationsModel) FindOneByUserId(ctx context.Context, userId int64, id int64) (*AssistantConversations, error) {
	query := fmt.Sprintf("select %s from %s where `user_id` = ? and `id` = ? limit 1", assistantConversationsRows, m.table)
	var resp AssistantConversations
	err := m.conn.QueryRowCtx(ctx, &resp, query, userId, id)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (m *customAssistantConversationsModel) UpdateTitle(ctx context.Context, id int64, title string) error {
	query := fmt.Sprintf("update %s set `title` = ?, `updated_at` = ? where `id` = ?", m.table)
	now := time.Now().Unix()
	_, err := m.conn.ExecCtx(ctx, query, title, now, id)
	return err
}
```

- [ ] **Step 3: Commit**

```bash
git add internal/model/assistant_conversations_model_gen.go internal/model/assistant_conversations_model.go
git commit -m "feat: add AssistantConversations model"
```

---

### Task 3: Create Backend Model — Messages

**Files:**
- Create: `internal/model/assistant_messages_model_gen.go`
- Create: `internal/model/assistant_messages_model.go`

- [ ] **Step 1: Create `assistant_messages_model_gen.go`**

```go
package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/builder"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"github.com/zeromicro/go-zero/core/stringx"
)

var (
	assistantMessagesFieldNames          = builder.RawFieldNames(&AssistantMessages{})
	assistantMessagesRows                = strings.Join(assistantMessagesFieldNames, ",")
	assistantMessagesRowsExpectAutoSet   = strings.Join(stringx.Remove(assistantMessagesFieldNames, "`id`", "`created_at`"), ",")
	assistantMessagesRowsWithPlaceHolder = strings.Join(stringx.Remove(assistantMessagesFieldNames, "`id`", "`created_at`"), "=?,") + "=?"
)

type (
	assistantMessagesModel interface {
		Insert(ctx context.Context, data *AssistantMessages) (sql.Result, error)
		FindOne(ctx context.Context, id int64) (*AssistantMessages, error)
		Update(ctx context.Context, data *AssistantMessages) error
		Delete(ctx context.Context, id int64) error
	}

	defaultAssistantMessagesModel struct {
		conn  sqlx.SqlConn
		table string
	}

	AssistantMessages struct {
		Id             int64  `db:"id"`
		ConversationId int64  `db:"conversation_id"`
		Role           string `db:"role"`
		Content        string `db:"content"`
		CreatedAt      int64  `db:"created_at"`
	}
)

func newAssistantMessagesModel(conn sqlx.SqlConn) *defaultAssistantMessagesModel {
	return &defaultAssistantMessagesModel{
		conn:  conn,
		table: "`assistant_messages`",
	}
}

func (m *defaultAssistantMessagesModel) Insert(ctx context.Context, data *AssistantMessages) (sql.Result, error) {
	query := fmt.Sprintf("insert into %s (%s) values (?, ?, ?, ?)", m.table, assistantMessagesRowsExpectAutoSet)
	ret, err := m.conn.ExecCtx(ctx, query, data.ConversationId, data.Role, data.Content, data.CreatedAt)
	return ret, err
}

func (m *defaultAssistantMessagesModel) FindOne(ctx context.Context, id int64) (*AssistantMessages, error) {
	query := fmt.Sprintf("select %s from %s where `id` = ? limit 1", assistantMessagesRows, m.table)
	var resp AssistantMessages
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (m *defaultAssistantMessagesModel) Update(ctx context.Context, data *AssistantMessages) error {
	query := fmt.Sprintf("update %s set %s where `id` = ?", m.table, assistantMessagesRowsWithPlaceHolder)
	_, err := m.conn.ExecCtx(ctx, query, data.ConversationId, data.Role, data.Content, data.Id)
	return err
}

func (m *defaultAssistantMessagesModel) Delete(ctx context.Context, id int64) error {
	query := fmt.Sprintf("delete from %s where `id` = ?", m.table)
	_, err := m.conn.ExecCtx(ctx, query, id)
	return err
}
```

- [ ] **Step 2: Create `assistant_messages_model.go`**

```go
package model

import (
	"context"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ AssistantMessagesModel = (*customAssistantMessagesModel)(nil)

type (
	AssistantMessagesModel interface {
		assistantMessagesModel
		withSession(session sqlx.Session) AssistantMessagesModel
		FindByConversationId(ctx context.Context, conversationId int64) ([]*AssistantMessages, error)
		InsertWithTimestamp(ctx context.Context, data *AssistantMessages) (sql.Result, error)
	}

	customAssistantMessagesModel struct {
		*defaultAssistantMessagesModel
	}
)

func NewAssistantMessagesModel(conn sqlx.SqlConn) AssistantMessagesModel {
	return &customAssistantMessagesModel{
		defaultAssistantMessagesModel: newAssistantMessagesModel(conn),
	}
}

func (m *customAssistantMessagesModel) withSession(session sqlx.Session) AssistantMessagesModel {
	return NewAssistantMessagesModel(sqlx.NewSqlConnFromSession(session))
}

func (m *customAssistantMessagesModel) FindByConversationId(ctx context.Context, conversationId int64) ([]*AssistantMessages, error) {
	query := fmt.Sprintf("select %s from %s where `conversation_id` = ? order by `created_at` asc", assistantMessagesRows, m.table)
	var resp []*AssistantMessages
	err := m.conn.QueryRowsCtx(ctx, &resp, query, conversationId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *customAssistantMessagesModel) InsertWithTimestamp(ctx context.Context, data *AssistantMessages) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	query := fmt.Sprintf("insert into %s (`conversation_id`, `role`, `content`, `created_at`) values (?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.ConversationId, data.Role, data.Content, data.CreatedAt)
	return ret, err
}
```

- [ ] **Step 3: Commit**

```bash
git add internal/model/assistant_messages_model_gen.go internal/model/assistant_messages_model.go
git commit -m "feat: add AssistantMessages model"
```

---

### Task 4: Add Types and Wire ServiceContext

**Files:**
- Modify: `internal/types/types.go` (add request/response types at end)
- Modify: `internal/svc/servicecontext.go` (add new model fields)

- [ ] **Step 1: Add assistant types to `types.go`**

Append these types at the end of `types.go`, before the closing `)` of the package:

```go
// Assistant types

type CreateAssistantConversationReq struct {
	Track string `json:"track" validate:"required,oneof=bigtech gov"`
}

type AssistantConversation struct {
	Id        int64  `json:"id"`
	UserId    int64  `json:"userId"`
	Title     string `json:"title"`
	Track     string `json:"track"`
	CreatedAt int64  `json:"createdAt"`
	UpdatedAt int64  `json:"updatedAt"`
}

type CreateAssistantConversationResp struct {
	Code int                     `json:"code"`
	Msg  string                  `json:"msg"`
	Data *AssistantConversation `json:"data,optional"`
}

type ListAssistantConversationsResp struct {
	Code int                        `json:"code"`
	Msg  string                     `json:"msg"`
	Data *AssistantConversationList `json:"data,optional"`
}

type AssistantConversationList struct {
	Total int64                     `json:"total"`
	List  []*AssistantConversation  `json:"list"`
}

type DeleteAssistantConversationResp struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

type AssistantMessage struct {
	Id             int64  `json:"id"`
	ConversationId int64  `json:"conversationId"`
	Role           string `json:"role"`
	Content        string `json:"content"`
	CreatedAt      int64  `json:"createdAt"`
}

type GetAssistantMessagesResp struct {
	Code int                    `json:"code"`
	Msg  string                 `json:"msg"`
	Data *AssistantMessageList  `json:"data,optional"`
}

type AssistantMessageList struct {
	Total int64                `json:"total"`
	List  []*AssistantMessage  `json:"list"`
}

type AssistantChatStreamReq struct {
	ConversationId int64  `json:"conversationId" validate:"required,gt=0"`
	Message        string `json:"message" validate:"required,min=1,max=4000"`
}
```

- [ ] **Step 2: Add models to ServiceContext**

In `servicecontext.go`, add these two fields to the `ServiceContext` struct:

```go
	AssistantConversationsModel model.AssistantConversationsModel
	AssistantMessagesModel       model.AssistantMessagesModel
```

And in `NewServiceContext`, add these lines before the closing `}`:

```go
		AssistantConversationsModel: model.NewAssistantConversationsModel(mysqlConn),
		AssistantMessagesModel:       model.NewAssistantMessagesModel(mysqlConn),
```

- [ ] **Step 3: Verify compilation**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./...`

Expected: compiles successfully (no errors)

- [ ] **Step 4: Commit**

```bash
git add internal/types/types.go internal/svc/servicecontext.go
git commit -m "feat: add assistant types and wire models into ServiceContext"
```

---

### Task 5: Add Backend Handlers

**Files:**
- Create: `internal/handler/assistant/createconversationhandler.go`
- Create: `internal/handler/assistant/listconversationshandler.go`
- Create: `internal/handler/assistant/deleteconversationhandler.go`
- Create: `internal/handler/assistant/getmessageshandler.go`
- Create: `internal/handler/assistant/assistantchatstreamhandler.go`

- [ ] **Step 1: Create `createconversationhandler.go`**

```go
package assistant

import (
	"net/http"

	"career-api/internal/logic/assistant"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func CreateConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateAssistantConversationReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := assistant.NewCreateConversationLogic(r.Context(), svcCtx)
		resp, err := l.CreateConversation(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
```

- [ ] **Step 2: Create `listconversationshandler.go`**

```go
package assistant

import (
	"net/http"

	"career-api/internal/logic/assistant"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func ListConversationsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListConversationsReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := assistant.NewListConversationsLogic(r.Context(), svcCtx)
		resp, err := l.ListConversations(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
```

- [ ] **Step 3: Create `deleteconversationhandler.go`**

```go
package assistant

import (
	"net/http"

	"career-api/internal/logic/assistant"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func DeleteConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DeleteAssistantConversationReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := assistant.NewDeleteConversationLogic(r.Context(), svcCtx)
		resp, err := l.DeleteConversation(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
```

- [ ] **Step 4: Create `getmessageshandler.go`**

```go
package assistant

import (
	"net/http"

	"career-api/internal/logic/assistant"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetMessagesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetAssistantMessagesReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := assistant.NewGetMessagesLogic(r.Context(), svcCtx)
		resp, err := l.GetMessages(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
```

- [ ] **Step 5: Create `assistantchatstreamhandler.go`**

```go
package assistant

import (
	"net/http"

	"career-api/internal/logic/assistant"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func AssistantChatStreamHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.AssistantChatStreamReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := assistant.NewAssistantChatStreamLogic(r.Context(), svcCtx)
		l.AssistantChatStream(w, &req)
	}
}
```

- [ ] **Step 6: Commit**

```bash
git add internal/handler/assistant/
git commit -m "feat: add assistant handler files"
```

---

### Task 6: Add Types for List/Delete/GetMessages Requests

**Files:**
- Modify: `internal/types/types.go` (add missing request types)

- [ ] **Step 1: Add missing request types**

Add these types alongside the assistant types added in Task 4:

```go
type ListConversationsReq struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"pageSize,default=20"`
}

type DeleteAssistantConversationReq struct {
	Id int64 `path:"id"`
}

type GetAssistantMessagesReq struct {
	ConversationId int64 `form:"conversationId"`
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./...`

- [ ] **Step 3: Commit**

```bash
git add internal/types/types.go
git commit -m "feat: add remaining assistant request types"
```

---

### Task 7: Add Logic Files — CRUD Operations

**Files:**
- Create: `internal/logic/assistant/createconversationlogic.go`
- Create: `internal/logic/assistant/listconversationslogic.go`
- Create: `internal/logic/assistant/deleteconversationlogic.go`
- Create: `internal/logic/assistant/getmessageslogic.go`

- [ ] **Step 1: Create `createconversationlogic.go`**

```go
package assistant

import (
	"context"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type CreateConversationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateConversationLogic {
	return &CreateConversationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateConversationLogic) CreateConversation(req *types.CreateAssistantConversationReq) (*types.CreateAssistantConversationResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.CreateAssistantConversationResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	now := time.Now().Unix()
	conversation := &model.AssistantConversations{
		UserId:    userId,
		Title:     "新对话",
		Track:     req.Track,
		CreatedAt: now,
		UpdatedAt: now,
	}

	result, err := l.svcCtx.AssistantConversationsModel.Insert(l.ctx, conversation)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to create conversation: %v", err)
		return &types.CreateAssistantConversationResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to create conversation",
		}, nil
	}

	id, _ := result.LastInsertId()
	conversation.Id = id

	return &types.CreateAssistantConversationResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.AssistantConversation{
			Id:        conversation.Id,
			UserId:    conversation.UserId,
			Title:     conversation.Title,
			Track:     conversation.Track,
			CreatedAt: conversation.CreatedAt,
			UpdatedAt: conversation.UpdatedAt,
		},
	}, nil
}
```

- [ ] **Step 2: Create `listconversationslogic.go`**

```go
package assistant

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type ListConversationsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListConversationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListConversationsLogic {
	return &ListConversationsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListConversationsLogic) ListConversations(req *types.ListConversationsReq) (*types.ListAssistantConversationsResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ListAssistantConversationsResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	conversations, total, err := l.svcCtx.AssistantConversationsModel.FindByUserId(l.ctx, userId, req.Page, req.PageSize)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to list conversations: %v", err)
		return &types.ListAssistantConversationsResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to list conversations",
		}, nil
	}

	var list []*types.AssistantConversation
	for _, c := range conversations {
		list = append(list, &types.AssistantConversation{
			Id:        c.Id,
			UserId:    c.UserId,
			Title:     c.Title,
			Track:     c.Track,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}

	return &types.ListAssistantConversationsResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.AssistantConversationList{
			Total: total,
			List:  list,
		},
	}, nil
}
```

- [ ] **Step 3: Create `deleteconversationlogic.go`**

```go
package assistant

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type DeleteConversationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteConversationLogic {
	return &DeleteConversationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteConversationLogic) DeleteConversation(req *types.DeleteAssistantConversationReq) (*types.DeleteAssistantConversationResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.DeleteAssistantConversationResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	conversation, err := l.svcCtx.AssistantConversationsModel.FindOneByUserId(l.ctx, userId, req.Id)
	if err != nil {
		return &types.DeleteAssistantConversationResp{
			Code: errors.CodeNotFound,
			Msg:  "conversation not found",
		}, nil
	}

	if err := l.svcCtx.AssistantConversationsModel.Delete(l.ctx, conversation.Id); err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to delete conversation: %v", err)
		return &types.DeleteAssistantConversationResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to delete conversation",
		}, nil
	}

	return &types.DeleteAssistantConversationResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
	}, nil
}
```

- [ ] **Step 4: Create `getmessageslogic.go`**

```go
package assistant

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetMessagesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMessagesLogic {
	return &GetMessagesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMessagesLogic) GetMessages(req *types.GetAssistantMessagesReq) (*types.GetAssistantMessagesResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.GetAssistantMessagesResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	conversation, err := l.svcCtx.AssistantConversationsModel.FindOneByUserId(l.ctx, userId, req.ConversationId)
	if err != nil {
		return &types.GetAssistantMessagesResp{
			Code: errors.CodeNotFound,
			Msg:  "conversation not found",
		}, nil
	}

	messages, err := l.svcCtx.AssistantMessagesModel.FindByConversationId(l.ctx, conversation.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get messages: %v", err)
		return &types.GetAssistantMessagesResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get messages",
		}, nil
	}

	var list []*types.AssistantMessage
	for _, m := range messages {
		list = append(list, &types.AssistantMessage{
			Id:             m.Id,
			ConversationId: m.ConversationId,
			Role:           m.Role,
			Content:        m.Content,
			CreatedAt:      m.CreatedAt,
		})
	}

	return &types.GetAssistantMessagesResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.AssistantMessageList{
			Total: int64(len(list)),
			List:  list,
		},
	}, nil
}
```

- [ ] **Step 5: Verify compilation**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./...`

- [ ] **Step 6: Commit**

```bash
git add internal/logic/assistant/
git commit -m "feat: add assistant CRUD logic files"
```

---

### Task 8: Add Chat Stream Logic (Core Feature)

**Files:**
- Create: `internal/logic/assistant/assistantchatstreamlogic.go`

This is the core file — it handles SSE-streamed chat with AI, loads student context, and auto-generates conversation titles.

- [ ] **Step 1: Create `assistantchatstreamlogic.go`**

```go
package assistant

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type AssistantChatStreamLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAssistantChatStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AssistantChatStreamLogic {
	return &AssistantChatStreamLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AssistantChatStreamLogic) AssistantChatStream(w http.ResponseWriter, req *types.AssistantChatStreamReq) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInternalError,
			"msg":  "SSE not supported",
		})
		return
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	if req.ConversationId <= 0 {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInvalidParams,
			"msg":  "invalid conversation id",
		})
		return
	}

	conversation, err := l.svcCtx.AssistantConversationsModel.FindOneByUserId(l.ctx, userId, req.ConversationId)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeNotFound,
			"msg":  "conversation not found",
		})
		return
	}

	userMsg := &model.AssistantMessages{
		ConversationId: conversation.Id,
		Role:           "user",
		Content:        req.Message,
	}
	if _, err := l.svcCtx.AssistantMessagesModel.InsertWithTimestamp(l.ctx, userMsg); err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to save user message: %v", err)
	}

	messages, err := l.svcCtx.AssistantMessagesModel.FindByConversationId(l.ctx, conversation.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get message history: %v", err)
	}

	systemPrompt := l.buildSystemPrompt(userId, conversation.Track)

	chatMessages := []types.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}
	for _, m := range messages {
		chatMessages = append(chatMessages, types.ChatMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	contentChan, errChan := l.svcCtx.AIProvider.ChatStream(l.ctx, chatMessages)

	var fullContent strings.Builder
	for {
		select {
		case content, ok := <-contentChan:
			if !ok {
				contentChan = nil
			} else {
				fullContent.WriteString(content)
				l.sendSSEEvent(w, flusher, "content", map[string]interface{}{
					"content": content,
				})
			}
		case streamErr, ok := <-errChan:
			if ok && streamErr != nil {
				logx.WithContext(l.ctx).Errorf("Chat stream error: %v", streamErr)
				l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
					"code": errors.CodeInternalError,
					"msg":  streamErr.Error(),
				})
			}
			errChan = nil
		case <-l.ctx.Done():
			contentChan = nil
			errChan = nil
		}

		if contentChan == nil && errChan == nil {
			break
		}
	}

	assistantContent := fullContent.String()
	if assistantContent != "" {
		assistantMsg := &model.AssistantMessages{
			ConversationId: conversation.Id,
			Role:           "assistant",
			Content:        assistantContent,
		}
		if _, err := l.svcCtx.AssistantMessagesModel.InsertWithTimestamp(l.ctx, assistantMsg); err != nil {
			logx.WithContext(l.ctx).Errorf("Failed to save assistant message: %v", err)
		}
	}

	if conversation.Title == "新对话" {
		go l.generateTitle(conversation.Id, req.Message)
	}

	l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
		"code": errors.CodeSuccess,
		"msg":  "success",
	})
	flusher.Flush()
}

func (l *AssistantChatStreamLogic) buildSystemPrompt(userId int64, track string) string {
	trackDesc := "大厂技术方向"
	if track == "gov" {
		trackDesc = "国企综合方向"
	}

	prompt := fmt.Sprintf("你是一个面向高中生的职业规划助手，精通职业发展方向、技能规划、求职策略等。当前方向：%s。\n\n", trackDesc)

	student, err := l.svcCtx.StudentModel.FindByUserId(l.ctx, userId)
	if err == nil && student != nil {
		prompt += "【学生档案】\n"
		if student.Name.Valid {
			prompt += fmt.Sprintf("- 姓名：%s\n", student.Name.String)
		}
		if student.Major.Valid {
			prompt += fmt.Sprintf("- 专业：%s\n", student.Major.String)
		}
		if student.Education.Valid {
			prompt += fmt.Sprintf("- 学历：%s\n", student.Education.String)
		}
		if student.Skills.Valid && student.Skills.String != "" && student.Skills.String != "null" {
			prompt += fmt.Sprintf("- 技能：%s\n", student.Skills.String)
		}
		if student.SoftSkills.Valid && student.SoftSkills.String != "" && student.SoftSkills.String != "null" {
			prompt += fmt.Sprintf("- 软技能：%s\n", student.SoftSkills.String)
		}
		if student.Certificates.Valid && student.Certificates.String != "" && student.Certificates.String != "null" {
			prompt += fmt.Sprintf("- 证书：%s\n", student.Certificates.String)
		}
		if student.Internship.Valid && student.Internship.String != "" && student.Internship.String != "null" {
			prompt += fmt.Sprintf("- 实习经历：%s\n", student.Internship.String)
		}
		if student.Projects.Valid && student.Projects.String != "" && student.Projects.String != "null" {
			prompt += fmt.Sprintf("- 项目经历：%s\n", student.Projects.String)
		}
	}

	hollandResults, hollandErr := l.svcCtx.HollandTestResultsModel.FindLatestByUserId(l.ctx, userId)
	if hollandErr == nil && hollandResults != nil {
		prompt += "\n【霍兰德测试结果】\n"
		prompt += fmt.Sprintf("- 职业代码：%s\n", hollandResults.CareerCode)
		if hollandResults.SuitableJobs.Valid && hollandResults.SuitableJobs.String != "" {
			prompt += fmt.Sprintf("- 适合职业：%s\n", hollandResults.SuitableJobs.String)
		}
		if hollandResults.Description.Valid && hollandResults.Description.String != "" {
			prompt += fmt.Sprintf("- 描述：%s\n", hollandResults.Description.String)
		}
	}

	matchResults, matchErr := l.svcCtx.MatchModel.FindTopByStudentId(l.ctx, student.Id, 5)
	if matchErr == nil && len(matchResults) > 0 {
		prompt += "\n【岗位匹配分析（前5）】\n"
		for i, m := range matchResults {
			prompt += fmt.Sprintf("%d. 匹配度：%.0f%%，详情：%s\n", i+1, m.MatchScore, m.MatchDetails.String)
		}
	}

	prompt += "\n请基于以上信息，为学生提供个性化的职业规划建议。回答应简洁实用、有针对性，适合高中生理解。使用 Markdown 格式让内容更清晰。"

	return prompt
}

func (l *AssistantChatStreamLogic) generateTitle(conversationId int64, userMessage string) {
	shortMsg := userMessage
	if len(shortMsg) > 50 {
		shortMsg = shortMsg[:50]
	}

	messages := []types.ChatMessage{
		{Role: "system", Content: "你是一个标题生成器。根据用户的第一条消息，生成一个简短的对话标题（最多15个字）。只返回标题文本，不要包含任何其他内容。"},
		{Role: "user", Content: shortMsg},
	}

	title, err := l.svcCtx.AIProvider.GenerateStudentProfile(l.ctx.WithValue("skipProfileValidation", true), shortMsg)
	if err != nil {
		titleChan, titleErrChan := l.svcCtx.AIProvider.ChatStream(context.Background(), messages)
		var titleBuilder strings.Builder
		for {
			select {
			case content, ok := <-titleChan:
				if !ok {
					titleChan = nil
				} else {
					titleBuilder.WriteString(content)
					if titleBuilder.Len() > 30 {
						titleChan = nil
					}
				}
			case _, ok := <-titleErrChan:
				if !ok {
					titleErrChan = nil
				} else {
					titleErrChan = nil
				}
			case <-context.Background().Done():
				titleChan = nil
				titleErrChan = nil
			}
			if titleChan == nil && titleErrChan == nil {
				break
			}
		}
		title = strings.TrimSpace(titleBuilder.String())
	}

	if title == "" {
		title = shortMsg
		if len(title) > 15 {
			title = title[:15]
		}
	}

	title = strings.Trim(title, "\"'《》【】")
	title = strings.TrimSuffix(title, "。")
	title = strings.TrimSuffix(title, ".")
	if len(title) > 20 {
		title = title[:20]
	}

	if err := l.svcCtx.AssistantConversationsModel.UpdateTitle(l.ctx, conversationId, title); err != nil {
		logx.Errorf("Failed to update conversation title: %v", err)
	}
}

func (l *AssistantChatStreamLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data map[string]interface{}) {
	data["type"] = eventType
	jsonData, err := json.Marshal(data)
	if err != nil {
		return
	}
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventType, string(jsonData))
	flusher.Flush()
}
```

- [ ] **Step 2: Add missing imports and the `FindLatestByUserId` / `FindTopByStudentId` model methods**

Check if `HollandTestResultsModel` has `FindLatestByUserId` and `MatchRecordsModel` has `FindTopByStudentId`. If not, add them.

For `HollandTestResultsModel`, add to `internal/model/holland_test_results_model.go`:

```go
func (m *customHollandTestResultsModel) FindLatestByUserId(ctx context.Context, userId int64) (*HollandTestResults, error) {
	student, err := m.StudentModel.FindByUserId(ctx, userId)
	if err != nil {
		return nil, err
	}
	query := fmt.Sprintf("select %s from %s where `student_id` = ? order by `created_at` desc limit 1", hollandTestResultsRows, m.table)
	var resp HollandTestResults
	err = m.conn.QueryRowCtx(ctx, &resp, query, student.Id)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}
```

For `MatchRecordsModel`, add to `internal/model/match_records_model.go`:

```go
func (m *customMatchRecordsModel) FindTopByStudentId(ctx context.Context, studentId int64, limit int) ([]*MatchRecords, error) {
	query := fmt.Sprintf("select %s from %s where `student_id` = ? order by `match_score` desc limit ?", matchRecordsRows, m.table)
	var resp []*MatchRecords
	err := m.conn.QueryRowsCtx(ctx, &resp, query, studentId, limit)
	if err != nil {
		return nil, err
	}
	return resp, nil
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./...`

If there are missing model methods or type references, add them iteratively.

- [ ] **Step 4: Commit**

```bash
git add internal/logic/assistant/assistantchatstreamlogic.go internal/model/holland_test_results_model.go internal/model/match_records_model.go
git commit -m "feat: add assistant chat stream logic with student context injection"
```

---

### Task 9: Add Routes and CORS for SSE

**Files:**
- Modify: `internal/handler/routes.go` (add assistant route group)

- [ ] **Step 1: Add import and routes**

Add `assistant "career-api/internal/handler/assistant"` to the import block in `routes.go`.

Then add a new route group at the end of `RegisterHandlers`, before the closing `}`:

```go
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/assistant/conversations",
				Handler: assistant.CreateConversationHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/assistant/conversations",
				Handler: assistant.ListConversationsHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/assistant/conversations/:id",
				Handler: assistant.DeleteConversationHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/assistant/conversations/:id/messages",
				Handler: assistant.GetMessagesHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/assistant/conversations/:id/chat",
				Handler: assistant.AssistantChatStreamHandler(serverCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
		rest.WithTimeout(120000*time.Millisecond),
	)
```

- [ ] **Step 2: Verify compilation**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go build ./...`

- [ ] **Step 3: Commit**

```bash
git add internal/handler/routes.go
git commit -m "feat: add assistant API routes"
```

---

### Task 10: Add Frontend Types

**Files:**
- Modify: `forend/src/types/index.ts` (add assistant types at the end)

- [ ] **Step 1: Add assistant types**

Append to `forend/src/types/index.ts`:

```typescript
// Assistant types
export interface AssistantConversation {
  id: number
  userId: number
  title: string
  track: 'bigtech' | 'gov'
  createdAt: number
  updatedAt: number
}

export interface AssistantMessage {
  id: number
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

export interface CreateAssistantConversationReq {
  track: 'bigtech' | 'gov'
}

export interface AssistantChatStreamReq {
  conversationId: number
  message: string
}
```

- [ ] **Step 2: Commit**

```bash
git add forend/src/types/index.ts
git commit -m "feat: add assistant frontend types"
```

---

### Task 11: Add Frontend API Module

**Files:**
- Modify: `forend/src/api/index.ts` (add `assistantApi`)

- [ ] **Step 1: Add `assistantApi` to API module**

Add the following `assistantApi` object after the existing `studentMessageApi` block, before the closing `export { ... }`:

```typescript
export const assistantApi = {
  createConversation: async (data: CreateAssistantConversationReq): Promise<ApiResponse<AssistantConversation>> => {
    return api.post('/assistant/conversations', data)
  },

  listConversations: async (page = 1, pageSize = 20): Promise<ApiResponse<{ total: number; list: AssistantConversation[] }>> => {
    return api.get('/assistant/conversations', { page, pageSize })
  },

  deleteConversation: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/assistant/conversations/${id}`)
  },

  getMessages: async (conversationId: number): Promise<ApiResponse<{ total: number; list: AssistantMessage[] }>> => {
    return api.get(`/assistant/conversations/${conversationId}/messages`)
  },

  chatStream: async (
    data: AssistantChatStreamReq,
    onEvent: (event: { type: string; data: any }) => void,
    onError: (error: Error) => void
  ): Promise<void> => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/assistant/conversations/${data.conversationId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ conversationId: data.conversationId, message: data.message }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No reader available')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let currentEventType = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine === '') continue
        if (trimmedLine.startsWith('event: ')) {
          currentEventType = trimmedLine.substring(7)
          continue
        }
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.substring(6)
          try {
            const parsedData = JSON.parse(data)
            onEvent({ type: currentEventType || 'data', data: parsedData })
            currentEventType = ''
          } catch {
            // skip invalid JSON
          }
        }
      }
    }
  },
}
```

Also make sure to add the new types to the imports at the top of the file if needed, and add `assistantApi` to the export list.

- [ ] **Step 2: Commit**

```bash
git add forend/src/api/index.ts
git commit -m "feat: add assistantApi to frontend API module"
```

---

### Task 12: Add Frontend Route and Navigation

**Files:**
- Modify: `forend/src/App.tsx` (add route)
- Modify: `forend/src/hooks/useNavItems.ts` (add nav item)

- [ ] **Step 1: Add lazy import in App.tsx**

Add alongside the other lazy imports:

```typescript
const AssistantPage = React.lazy(() => import('./pages/Assistant'))
```

- [ ] **Step 2: Add route in App.tsx**

Add inside the `MainLayout` `<Routes>` block, alongside the other student pages (e.g., after `/interview`):

```tsx
<Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
```

Note: Add this route inside the `MainLayout` group (under `<Route element={<MainLayout />}>`), not outside it like `/interview` or `/holland`.

- [ ] **Step 3: Add nav item in `useNavItems.ts`**

In the student nav groups, add to the "常用" group array:

```typescript
{ key: '/assistant', title: '职业助手', description: 'AI 职业规划助手', icon: 'smart_toy', path: '/assistant' },
```

- [ ] **Step 4: Commit**

```bash
git add forend/src/App.tsx forend/src/hooks/useNavItems.ts
git commit -m "feat: add assistant route and navigation"
```

---

### Task 13: Build Frontend Assistant Page

**Files:**
- Create: `forend/src/pages/Assistant/index.tsx`

This is the main UI component — the chat interface with sidebar.

- [ ] **Step 1: Create `Assistant/index.tsx`**

The component should implement:
- **Sidebar** (left): conversation list, "新对话" button, delete button per conversation
- **Chat area** (right): message list with user/assistant bubbles, input box with send button
- **Empty state**: 3 quick question cards when no messages yet
- **SSE streaming**: typewriter effect for assistant responses
- **Markdown rendering**: use `react-markdown` or similar for assistant messages
- **Track awareness**: use `useUIStore().track` for bigtech/gov context

Key implementation details:
- Use `assistantApi.createConversation()` on "新对话" click
- Use `assistantApi.listConversations()` for sidebar
- Use `assistantApi.getMessages()` when switching conversations
- Use `assistantApi.chatStream()` with SSE for sending messages
- Use `assistantApi.deleteConversation()` for delete
- Auto-create conversation on first message if none selected
- Parse SSE events same way as Interview page: `event:` line sets type, `data:` line contains JSON

The component structure:

```tsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, List, Popconfirm, message, Spin, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { assistantApi } from '../../api'
import { useUIStore } from '../../stores'
import type { AssistantConversation, AssistantMessage } from '../../types'

const quickQuestions = [
  '分析我的职业匹配度',
  '推荐适合我的职业路径',
  '制定学习提升计划',
]

const AssistantPage: React.FC = () => {
  const { track } = useUIStore()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<AssistantConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<AssistantConversation | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => { loadConversations() }, [])

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id)
    } else {
      setMessages([])
    }
  }, [activeConversation?.id])

  // Auto-scroll
  useEffect(() => { scrollToBottom() }, [messages, streamContent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const res = await assistantApi.listConversations(1, 50)
      if (res.data.code === 0 && res.data.data) {
        setConversations(res.data.data.list || [])
      }
    } catch (err) { console.error(err) }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      setLoading(true)
      const res = await assistantApi.getMessages(conversationId)
      if (res.data.code === 0 && res.data.data) {
        setMessages(res.data.data.list || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleNewConversation = async () => {
    try {
      const res = await assistantApi.createConversation({ track })
      if (res.data.code === 0 && res.data.data) {
        const newConv = res.data.data
        setConversations(prev => [newConv, ...prev])
        setActiveConversation(newConv)
        setMessages([])
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteConversation = async (id: number) => {
    try {
      const res = await assistantApi.deleteConversation(id)
      if (res.data.code === 0) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeConversation?.id === id) {
          setActiveConversation(null)
          setMessages([])
        }
        message.success('删除成功')
      }
    } catch (err) { console.error(err) }
  }

  const handleSend = async () => {
    const userMessage = input.trim()
    if (!userMessage || streaming) return

    if (!activeConversation) {
      try {
        const res = await assistantApi.createConversation({ track })
        if (res.data.code === 0 && res.data.data) {
          const newConv = res.data.data
          setConversations(prev => [newConv, ...prev])
          setActiveConversation(newConv)
          await sendMessage(newConv.id, userMessage)
        }
      } catch (err) { console.error(err) }
      return
    }

    await sendMessage(activeConversation.id, userMessage)
  }

  const sendMessage = async (conversationId: number, userMessage: string) => {
    setInput('')
    setStreaming(true)
    setStreamContent('')

    const optimisticMsg: AssistantMessage = {
      id: Date.now(),
      conversationId,
      role: 'user',
      content: userMessage,
      createdAt: Date.now() / 1000,
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      await assistantApi.chatStream(
        { conversationId, message: userMessage },
        (event) => {
          if (event.type === 'content') {
            setStreamContent(prev => prev + (event.data.content || ''))
          } else if (event.type === 'done') {
            setStreaming(false)
            setStreamContent('')
            loadMessages(conversationId)
            loadConversations() // refresh titles
          } else if (event.type === 'error') {
            message.error(event.data.msg || '请求失败')
            setStreaming(false)
            setStreamContent('')
          }
        },
        (error) => {
          message.error(error.message || '网络错误')
          setStreaming(false)
          setStreamContent('')
        }
      )
    } catch (err) {
      message.error('发送失败')
      setStreaming(false)
      setStreamContent('')
    }
  }

  const handleQuickQuestion = (q: string) => {
    setInput(q)
  }

  // ... render JSX with sidebar + chat area
  // (Full JSX implementation below)
}
```

Build the complete component with:
- **Left sidebar**: 280px fixed width, scrollable conversation list, "新对话" button at top
- **Right chat area**: flex-grow, messages scroll container, fixed input bar at bottom
- **Message bubbles**: user messages right-aligned (blue), assistant left-aligned (gray), with ReactMarkdown rendering
- **Empty state**: when no active conversation, show welcome message + 3 quick question cards
- **Streaming indicator**: show typing cursor while `streaming && streamContent === ''`
- **Responsive**: hide sidebar on mobile with toggle button

- [ ] **Step 2: Verify frontend builds**

Run: `cd /home/swordreforge/projects/high-school-worker-design/forend && npm run build`

Expected: build succeeds (there may be type warnings but no errors)

- [ ] **Step 3: Commit**

```bash
git add forend/src/pages/Assistant/
git commit -m "feat: add assistant page component"
```

---

### Task 14: Integration Test — Backend

**Files:** No new files (manual testing)

- [ ] **Step 1: Start the backend server**

Run: `cd /home/swordreforge/projects/high-school-worker-design && go run career.go -f etc/career-api.yaml --skip-all`

- [ ] **Step 2: Test create conversation**

```bash
curl -X POST http://localhost:8088/api/v1/assistant/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"track":"bigtech"}'
```

Expected: `{ "code": 0, "msg": "success", "data": { "id": 1, "userId": ..., "title": "新对话", "track": "bigtech", ... } }`

- [ ] **Step 3: Test list conversations**

```bash
curl -X GET "http://localhost:8088/api/v1/assistant/conversations?page=1&pageSize=20" \
  -H "Authorization: Bearer <token>"
```

Expected: list of conversations

- [ ] **Step 4: Test chat stream**

```bash
curl -X POST "http://localhost:8088/api/v1/assistant/conversations/1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "Accept: text/event-stream" \
  -d '{"conversationId":1,"message":"你好"}'
```

Expected: SSE stream with `event: content`, `event: done` events

- [ ] **Step 5: Test get messages**

```bash
curl -X GET "http://localhost:8088/api/v1/assistant/conversations/1/messages?conversationId=1" \
  -H "Authorization: Bearer <token>"
```

Expected: list of messages

- [ ] **Step 6: Test delete conversation**

```bash
curl -X DELETE "http://localhost:8088/api/v1/assistant/conversations/1" \
  -H "Authorization: Bearer <token>"
```

Expected: `{ "code": 0, "msg": "success" }`

---

### Task 15: Integration Test — Frontend

**Files:** No new files (manual testing)

- [ ] **Step 1: Start both backend and frontend**

```bash
# Terminal 1
cd /home/swordreforge/projects/high-school-worker-design && go run career.go -f etc/career-api.yaml --skip-all

# Terminal 2
cd /home/swordreforge/projects/high-school-worker-design/forend && npm run dev
```

- [ ] **Step 2: Verify navigation**

Open browser → Login → Navigate menu should show "职业助手" item → Click it → Assistant page loads

- [ ] **Step 3: Verify conversation flow**

1. Click "新对话" → empty chat area appears
2. Type a message → sends → SSE stream shows typewriter effect
3. Message appears in chat area
4. Conversation title updates after first message
5. Click "新对话" again → new conversation starts
6. Switch between conversations in sidebar
7. Delete a conversation → removed from sidebar

- [ ] **Step 4: Verify mobile responsiveness**

Resize browser to mobile width → sidebar should be hidden/collapsible → chat area fills screen

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration fixes for assistant feature"
```