# 学生通过邀请码加入学校实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 已注册学生通过邀请码加入学校，可在个人中心发起

**Architecture:** 后端新增 API `/students/join-school`，前端在个人中心添加"加入学校"入口

**Tech Stack:** Go (后端), React + Ant Design (前端)

---

## 文件结构

### 后端
- `internal/types/types.go` - 添加 JoinSchoolReq/JoinSchoolResp
- `internal/logic/student/joinschoollogic.go` - 新建，核心逻辑
- `internal/handler/student/joinschoolhandler.go` - 新建，HTTP handler
- `internal/handler/routes.go` - 添加路由

### 前端
- `high-school-worker-design-forend/src/api/index.ts` - 添加 joinSchool API
- `high-school-worker-design-forend/src/pages/Profile/index.tsx` - 添加"加入学校"按钮和 Modal

---

## Task 1: 后端 - Types 定义

**Files:**
- Modify: `internal/types/types.go`

- [ ] **Step 1: 添加 JoinSchool 类型定义**

在 types.go 文件末尾添加：

```go
type JoinSchoolReq struct {
	InviteCode string `json:"inviteCode" validate:"required"`
	Name     string `json:"name,optional"`
}

type JoinSchoolResp struct {
	Code      int              `json:"code"`
	Msg       string           `json:"msg"`
	Data      *JoinSchoolData  `json:"data,optional"`
}

type JoinSchoolData struct {
	SchoolId   int64  `json:"schoolId"`
	SchoolName string `json:"schoolName"`
	JoinedAt   int64  `json:"joinedAt"`
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/types/types.go
git commit -m "feat: add JoinSchool types"
```

---

## Task 2: 后端 - JoinSchool Logic

**Files:**
- Create: `internal/logic/student/joinschoollogic.go`

- [ ] **Step 1: 创建 joinschoollogic.go**

```go
package student

import (
	"context"
	"time"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type JoinSchoolLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewJoinSchoolLogic(ctx context.Context, svcCtx *svc.ServiceContext) *JoinSchoolLogic {
	return &JoinSchoolLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *JoinSchoolLogic) JoinSchool(req *types.JoinSchoolReq) (*types.JoinSchoolResp, error) {
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.JoinSchoolResp{
			Code: 500,
			Msg:  "database error",
		}, nil
	}

	// 获取当前登录学生 ID
	studentId := l.svcCtx.StudentId
	if studentId == 0 {
		return &types.JoinSchoolResp{
			Code: 401,
			Msg:  "not logged in as student",
		}, nil
	}

	var codeId, schoolId, teacherId int64
	var maxUses, usedCount int
	var status string
	var expiresAt int64

	err = db.QueryRowContext(l.ctx,
		"SELECT id, school_id, teacher_id, status, expires_at, max_uses, used_count FROM invite_codes WHERE code = ?",
		req.InviteCode).Scan(&codeId, &schoolId, &teacherId, &status, &expiresAt, &maxUses, &usedCount)

	if err != nil {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invalid invite code",
		}, nil
	}

	if status != "active" {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invite code is not active",
		}, nil
	}

	if expiresAt > 0 && expiresAt < time.Now().Unix() {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invite code has expired",
		}, nil
	}

	if usedCount >= maxUses {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invite code has reached max uses",
		}, nil
	}

	// 获取学校名称
	var schoolName string
	err = db.QueryRowContext(l.ctx, "SELECT name FROM schools WHERE id = ?", schoolId).Scan(&schoolName)
	if err != nil {
		schoolName = "未知学校"
	}

	now := time.Now().Unix()

	// 更新学生姓名（如果提供了）
	if req.Name != "" {
		_, err = db.ExecContext(l.ctx, "UPDATE students SET name = ?, updated_at = ? WHERE id = ?", req.Name, now, studentId)
		if err != nil {
			logx.Errorf("update student name failed: %v", err)
		}
	}

	// 插入 student_schools 记录
	_, err = db.ExecContext(l.ctx,
		"INSERT INTO student_schools (student_id, school_id, teacher_id, invite_code_id, status, joined_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)",
		studentId, schoolId, teacherId, codeId, now, now, now)
	if err != nil {
		return &types.JoinSchoolResp{
			Code: 500,
			Msg:  "failed to join school",
		}, nil
	}

	// 增加邀请码使用计数
	_, err = db.ExecContext(l.ctx,
		"UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?",
		codeId)
	if err != nil {
		logx.Errorf("increment invite code usage failed: %v", err)
	}

	return &types.JoinSchoolResp{
		Code: 0,
		Msg:  "success",
		Data: &types.JoinSchoolData{
			SchoolId:   schoolId,
			SchoolName: schoolName,
			JoinedAt:  now,
		},
	}, nil
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/logic/student/joinschoollogic.go
git commit -m "feat: add JoinSchool logic"
```

---

## Task 3: 后端 - Handler

**Files:**
- Create: `internal/handler/student/joinschoolhandler.go`

- [ ] **Step 1: 创建 joinschoolhandler.go**

```go
package student

import (
	"net/http"

	"career-api/internal/handler/student"
	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func JoinSchoolHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.JoinSchoolReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewJoinSchoolLogic(r.Context(), svcCtx)
		resp, err := l.JoinSchool(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.JoinSchoolResp{
			Code: resp.Code,
			Msg:  resp.Msg,
			Data: resp.Data,
		})
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/student/joinschoolhandler.go
git commit -m "feat: add JoinSchool handler"
```

---

## Task 4: 后端 - 添加路由

**Files:**
- Modify: `internal/handler/routes.go`

- [ ] **Step 1: 添加路由**

在 `/students/register-with-invite` 路由附近添加：

```go
{
	Method:  http.MethodPost,
	Path:    "/students/join-school",
	Handler: student.JoinSchoolHandler(serverCtx),
},
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/routes.go
git commit -m "feat: add join-school route"
```

- [ ] **Step 3: 测试 API**

```bash
curl -X POST http://localhost:8888/api/v1/students/join-school \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"inviteCode": "TEST123", "name": "张三"}'
```

预期: 返回 school info 或错误

---

## Task 5: 前端 - API

**Files:**
- Modify: `high-school-worker-design-forend/src/api/index.ts`

- [ ] **Step 1: 添加 joinSchool API**

在 studentApi 对象中添加：

```typescript
joinSchool: (data: { inviteCode: string; name: string }) =>
  api.post<{ code: number; msg: string; data: { schoolId: number; schoolName: string; joinedAt: number } }>('/students/join-school', data),
```

- [ ] **Step 2: Commit**

```bash
git add high-school-worker-design-forend/src/api/index.ts
git commit -m "feat: add joinSchool API"
```

---

## Task 6: 前端 - 页面

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Profile/index.tsx`

- [ ] **Step 1: 添加"加入学校"按钮和 Modal**

1. 导入必要的组件：
```typescript
import { Modal, Input, message } from 'antd';
import { teamApi } from '../../api';
```

2. 添加状态：
```typescript
const [joinSchoolModalVisible, setJoinSchoolModalVisible] = useState(false);
const [joinSchoolLoading, setJoinSchoolLoading] = useState(false);
const [inviteCode, setInviteCode] = useState('');
const [studentName, setStudentName] = useState('');
```

3. 添加 Modal（放在 return 的 JSX 中）：
```tsx
<Modal
  title="加入学校"
  open={joinSchoolModalVisible}
  onCancel={() => setJoinSchoolModalVisible(false)}
  footer={null}
>
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-1">邀请码</label>
      <Input
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        placeholder="请输入教师提供的邀请码"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">姓名</label>
      <Input
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        placeholder="请输入您的姓名"
      />
    </div>
    <Button
      type="primary"
      block
      loading={joinSchoolLoading}
      onClick={async () => {
        if (!inviteCode.trim()) {
          message.error('请输入邀请码');
          return;
        }
        setJoinSchoolLoading(true);
        try {
          const result = await studentApi.joinSchool({
            inviteCode: inviteCode.trim(),
            name: studentName.trim(),
          });
          if (result.code === 0) {
            message.success(`成功加入 ${result.data.schoolName}`);
            setJoinSchoolModalVisible(false);
            setInviteCode('');
            setStudentName('');
            // 刷新用户信息
            const info = await userApi.getInfo();
            if (info.data) setUser(info.data);
          } else {
            message.error(result.msg);
          }
        } catch (error) {
          message.error('加入学校失败');
        } finally {
          setJoinSchoolLoading(false);
        }
      }}
    >
      确定加入
    </Button>
  </div>
</Modal>
```

4. 在页面中添加"加入学校"按钮：
```tsx
<Card 
  title="学校信息" 
  extra={
    <Button type="link" onClick={() => setJoinSchoolModalVisible(true)}>
      加入学校
    </Button>
  }
>
  {/* 学校信息内容 */}
</Card>
```

- [ ] **Step 2: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Profile/index.tsx
git commit -m "feat: add join school UI"
```

- [ ] **Step 3: 测试**

打开 /profile 页面，点击"加入学校"按钮，输入邀请码和姓名，验证加入成功

---

## 验收标准

1. 后端 API `/students/join-school` 可用
2. 前端个人中心有"��入��校"入口
3. 输入邀请码可成功加入学校
4. 邀请码无效时返回正确错误信息