# Teacher Side - Invite Code System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement teacher-side invite code system where teachers can generate codes to add students to their school. Students use the invite code during registration to join a school (not for login).

**Architecture:** Teachers generate invite codes via API → Students use code during registration → System associates student with school via student_schools table → Teachers can view/manage students in their school

**Tech Stack:** go-zero, MySQL, existing codebase patterns

---

## File Structure

```
internal/
├── handler/teacher/          # New - teacher handlers
│   ├── invitecode.go
│   └── student.go
├── logic/teacher/         # New - teacher logic
│   ├── createinvitecode.go
│   ├── listinvitecodes.go
│   └── revokeinvitecode.go
├── types/
│   └── types.go           # Modify - add teacher types
└── svc/
    └── servicecontext.go   # Check - interfaces exist

career.go                  # Check - tables already defined
cmd/init-db/main.go        # Check - DB already initialized
```

---

## Task 1: Add Teacher Types to internal/types/types.go

**Files:**
- Modify: `internal/types/types.go`

- [ ] **Step 1: Read current types.go to find where to add**

```bash
# Find the line number after RegisterWithInviteResp
grep -n "type RegisterWithInviteResp" internal/types/types.go
```

- [ ] **Step 2: Add TeacherInviteCode types after RegisterWithInviteResp**

```go
// Teacher invite code types
type CreateInviteCodeReq struct {
    Type      string `json:"type"`      // "student" or "teacher"
    MaxUses   int   `json:"maxUses"`    // max uses, default 100
    ExpiresIn int   `json:"expiresIn"` // days, default 30
}

type CreateInviteCodeResp struct {
    Code       string `json:"code"`
    MaxUses    int    `json:"maxUses"`
    UsedCount  int    `json:"usedCount"`
    ExpiresAt  int64  `json:"expiresAt"`
    CreatedAt int64  `json:"createdAt"`
}

type InviteCodeInfo struct {
    Id         int64  `json:"id"`
    Code       string `json:"code"`
    Type       string `json:"type"`
    MaxUses    int    `json:"maxUses"`
    UsedCount  int    `json:"usedCount"`
    Status     string `json:"status"`
    ExpiresAt  int64  `json:"expiresAt"`
    CreatedAt  int64  `json:"createdAt"`
}

type ListInviteCodesReq struct {
    Page     int    `json:"page"`
    PageSize int    `json:"pageSize"`
    Status   string `json:"status"` // active, expired, revoked
}

type ListInviteCodesResp struct {
    Total int               `json:"total"`
    List  []InviteCodeInfo `json:"list"`
}
```

- [ ] **Step 3: Commit**

```bash
git add internal/types/types.go
git commit -m "feat: add teacher invite code types"
```

---

## Task 2: Create Teacher Invite Code Logic

**Files:**
- Create: `internal/logic/teacher/createinvitecode.go`
- Create: `internal/logic/teacher/listinvitecodes.go`
- Create: `internal/logic/teacher/revokeinvitecode.go`

- [ ] **Step 1: Create createinvitecode.go**

```go
package teacher

import (
    "context"
    "crypto/rand"
    "encoding/hex"
    "fmt"
    "math/big"
    "time"

    "career-api/internal/svc"
    "career-api/internal/types"
    "github.com/zeromicro/go-zero/core/logx"
)

type CreateInviteCodeLogic struct {
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewCreateInviteCodeLogic(svcCtx *svc.ServiceContext) *CreateInviteCodeLogic {
    return &CreateInviteCodeLogic{
        ctx:    context.Background(),
        svcCtx: svcCtx,
    }
}

func (l *CreateInviteCodeLogic) CreateInviteCode(req *types.CreateInviteCodeReq) (resp *types.CreateInviteCodeResp, err error) {
    // Get current teacher from context (assumes auth middleware sets this)
    teacherId := l.getCurrentTeacherId()
    schoolId := l.getCurrentSchoolId()

    // Generate invite code: SCHOOLCODE-DATE-RANDOM
    schoolCode := l.getSchoolCode(schoolId)
    dateStr := time.Now().Format("20060102")
    randomPart := generateRandomString(4)

    inviteCode := fmt.Sprintf("%s-%s-%s", schoolCode, dateStr, randomPart)

    // Set defaults
    maxUses := 100
    if req.MaxUses > 0 {
        maxUses = req.MaxUses
    }

    expiresIn := 30
    if req.ExpiresIn > 0 {
        expiresIn = req.ExpiresIn
    }

    expiresAt := time.Now().AddDate(0, 0, expiresIn).Unix()
    now := time.Now().Unix()

    // Insert into invite_codes table
    _, err = l.svcCtx.DB.ExecContext(l.ctx,
        `INSERT INTO invite_codes (code, school_id, teacher_id, type, max_uses, used_count, status, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 'active', ?, ?, ?)`,
        inviteCode, schoolId, teacherId, req.Type, maxUses, expiresAt, now, now)
    if err != nil {
        logx.Errorf("Failed to create invite code: %v", err)
        return nil, err
    }

    return &types.CreateInviteCodeResp{
        Code:      inviteCode,
        MaxUses:   maxUses,
        UsedCount: 0,
        ExpiresAt: expiresAt,
    }, nil
}

func (l *CreateInviteCodeLogic) getCurrentTeacherId() int64 {
    // TODO: Get from context auth
    return 1
}

func (l *CreateInviteCodeLogic) getCurrentSchoolId() int64 {
    // TODO: Get from context auth
    return 1
}

func (l *CreateInviteCodeLogic) getSchoolCode(schoolId int64) string {
    // Get school code from database
    var code string
    err := l.svcCtx.DB.QueryRowContext(l.ctx,
        "SELECT code FROM schools WHERE id = ?", schoolId).Scan(&code)
    if err != nil {
        return "SCH"
    }
    return code
}

func generateRandomString(length int) string {
    bytes := make([]byte, length)
    for i := range bytes {
        n, _ := rand.Int(rand.Reader, big.NewInt(36))
        bytes[i] = "abcdefghijklmnopqrstuvwxyz0123456789"[n.Int64()]
    }
    return string(bytes)
}
```

- [ ] **Step 2: Create listinvitecodes.go**

```go
package teacher

import (
    "context"

    "career-api/internal/svc"
    "career-api/internal/types"
    "github.com/zeromicro/go-zero/core/logx"
)

type ListInviteCodesLogic struct {
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewListInviteCodesLogic(svcCtx *svc.ServiceContext) *ListInviteCodesLogic {
    return &ListInviteCodesLogic{
        ctx:    context.Background(),
        svcCtx: svcCtx,
    }
}

func (l *ListInviteCodesLogic) ListInviteCodes(req *types.ListInviteCodesReq) (resp *types.ListInviteCodesResp, err error) {
    teacherId := l.getCurrentTeacherId()
    schoolId := l.getCurrentSchoolId()

    page := 1
    pageSize := 10
    if req.Page > 0 {
        page = req.Page
    }
    if req.PageSize > 0 {
        pageSize = req.PageSize
    }

    offset := (page - 1) * pageSize

    // Build query
    query := `SELECT id, code, type, max_uses, used_count, status, expires_at, created_at
              FROM invite_codes WHERE school_id = ? AND teacher_id = ?`
    args := []interface{}{schoolId, teacherId}

    if req.Status != "" {
        query += " AND status = ?"
        args = append(args, req.Status)
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    args = append(args, pageSize, offset)

    rows, err := l.svcCtx.DB.QueryContext(l.ctx, query, args...)
    if err != nil {
        logx.Errorf("Failed to list invite codes: %v", err)
        return nil, err
    }
    defer rows.Close()

    var list []types.InviteCodeInfo
    for rows.Next() {
        var code types.InviteCodeInfo
        var expiresAt, createdAt int64
        rows.Scan(&code.Id, &code.Code, &code.Type, &code.MaxUses, &code.UsedCount, &code.Status, &expiresAt, &createdAt)
        code.ExpiresAt = expiresAt
        list = append(list, code)
    }

    // Get total count
    countQuery := `SELECT COUNT(*) FROM invite_codes WHERE school_id = ? AND teacher_id = ?`
    var total int
    l.svcCtx.DB.QueryRowContext(l.ctx, countQuery, schoolId, teacherId).Scan(&total)

    return &types.ListInviteCodesResp{
        Total: total,
        List:  list,
    }, nil
}

func (l *ListInviteCodesLogic) getCurrentTeacherId() int64 {
    return 1
}

func (l *ListInviteCodesLogic) getCurrentSchoolId() int64 {
    return 1
}
```

- [ ] **Step 3: Create revokeinvitecode.go**

```go
package teacher

import (
    "context"

    "career-api/internal/svc"
    "github.com/zeromicro/go-zero/core/logx"
)

type RevokeInviteCodeLogic struct {
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewRevokeInviteCodeLogic(svcCtx *svc.ServiceContext) *RevokeInviteCodeLogic {
    return &RevokeInviteCodeLogic{
        ctx:    context.Background(),
        svcCtx: svcCtx,
    }
}

func (l *RevokeInviteCodeLogic) RevokeInviteCode(codeId int64) error {
    teacherId := l.getCurrentTeacherId()
    schoolId := l.getCurrentSchoolId()

    result, err := l.svcCtx.DB.ExecContext(l.ctx,
        `UPDATE invite_codes SET status = 'revoked', updated_at = ? 
         WHERE id = ? AND school_id = ? AND teacher_id = ?`,
        context.Background().Value("now"), codeId, schoolId, teacherId)
    if err != nil {
        logx.Errorf("Failed to revoke invite code: %v", err)
        return err
    }

    affected, _ := result.RowsAffected()
    if affected == 0 {
        return ErrCodeNotFound
    }

    return nil
}

func (l *RevokeInviteCodeLogic) getCurrentTeacherId() int64 {
    return 1
}

func (l *RevokeInviteCodeLogic) getCurrentSchoolId() int64 {
    return 1
}
```

- [ ] **Step 4: Commit**

```bash
git add internal/logic/teacher/
git commit -m "feat: add teacher invite code logic"
```

---

## Task 3: Create Teacher Handlers

**Files:**
- Create: `internal/handler/teacher/invitecode.go`

- [ ] **Step 1: Create handler/teacher/invitecode.go**

```go
package teacher

import (
    "net/http"

    "career-api/internal/logic/teacher"
    "career-api/internal/svc"
    "github.com/zeromicro/go-zero/rest"
)

func CreateInviteCodeHandler(svcCtx *svc.ServiceContext) rest.Handler {
    return func(w http.ResponseWriter, r *http.Request) (interface{}, error) {
        l := teacher.NewCreateInviteCodeLogic(svcCtx)
        resp, err := l.CreateInviteCode(nil)
        return resp, err
    }
}

func ListInviteCodesHandler(svcCtx *svc.ServiceContext) rest.Handler {
    return func(w http.ResponseWriter, r *http.Request) (interface{}, error) {
        l := teacher.NewListInviteCodesLogic(svcCtx)
        resp, err := l.ListInviteCodes(nil)
        return resp, err
    }
}

func RevokeInviteCodeHandler(svcCtx *svc.ServiceContext) rest.Handler {
    return func(w http.ResponseWriter, r *http.Request) (interface{}, error) {
        l := teacher.NewRevokeInviteCodeLogic(svcCtx)
        // Extract code ID from URL path
        // ...
        return nil, nil
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/teacher/
git commit -m "feat: add teacher invite code handlers"
```

---

## Task 4: Add Routes to internal/handler/routes.go

**Files:**
- Modify: `internal/handler/routes.go`

- [ ] **Step 1: Add teacher routes after existing routes**

```go
// Add to imports
teacher "career-api/internal/handler/teacher"

// Add route group
server.AddRoutes(
    []rest.Route{
        {
            // Create invite code
            Method:  http.MethodPost,
            Path:    "/teachers/invite-codes",
            Handler: teacher.CreateInviteCodeHandler(serverCtx),
        },
        {
            // List invite codes
            Method:  http.MethodGet,
            Path:    "/teachers/invite-codes",
            Handler: teacher.ListInviteCodesHandler(serverCtx),
        },
        {
            // Revoke invite code
            Method:  http.MethodDelete,
            Path:    "/teachers/invite-codes/:id",
            Handler: teacher.RevokeInviteCodeHandler(serverCtx),
        },
    },
    rest.WithPrefix("/api/v1"),
)
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/routes.go
git commit -m "feat: add teacher invite code routes"
```

---

## Task 5: Verify Build

- [ ] **Step 1: Build the project**

```bash
cd .worktrees/teacher-side && go build -o career-api ./...
```

- [ ] **Step 2: If build fails, fix errors and commit**

```bash
git add . && git commit -m "fix: build errors"
```

---

## Implementation Complete

Run tests and verify:
```bash
cd .worktrees/teacher-side && go test ./...
```