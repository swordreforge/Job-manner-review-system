# 站内信和聊天室实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现教师端和学生端的站内信系统和一对一聊天室功能

**Architecture:** 
- 站内信: 复用现有 messages 表, 新增前端页面
- 聊天室: 新建 chat_groups/chat_group_members/chat_messages 表, 实现完整前后端

**Tech Stack:** go-zero (后端), React+Ant Design (前端)

---

## Phase 1: 后端 - 聊天室数据库和API

### Task 1: 创建数据库表

**Files:**
- Modify: `career.go` - 添加 chat_groups, chat_group_members, chat_messages 表定义

- [ ] **Step 1: 添加 chat_groups 表定义**

在 career.go tables 数组中添加:
```go
{
    name: "chat_groups",
    createSQL: `CREATE TABLE IF NOT EXISTS chat_groups (
        id BIGINT(20) NOT NULL AUTO_INCREMENT,
        school_id BIGINT(20) NOT NULL COMMENT '学校ID',
        name VARCHAR(100) DEFAULT NULL COMMENT '群组名称',
        chat_type VARCHAR(20) NOT NULL DEFAULT 'direct' COMMENT '群组类型: direct(一对一)',
        created_by BIGINT(20) NOT NULL COMMENT '创建者ID',
        created_at BIGINT(20) NOT NULL,
        updated_at BIGINT(20) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_school (school_id),
        KEY idx_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天群组表'`,
},
```

- [ ] **Step 2: 添加 chat_group_members 表定义**

```go
{
    name: "chat_group_members",
    createSQL: `CREATE TABLE IF NOT EXISTS chat_group_members (
        id BIGINT(20) NOT NULL AUTO_INCREMENT,
        group_id BIGINT(20) NOT NULL COMMENT '群组ID',
        user_id BIGINT(20) NOT NULL COMMENT '用户ID',
        user_type VARCHAR(20) NOT NULL COMMENT '用户类型: teacher, student',
        user_name VARCHAR(100) DEFAULT NULL COMMENT '用户名称',
        role VARCHAR(20) NOT NULL DEFAULT 'member' COMMENT '角色: owner(创建者), member(成员)',
        joined_at BIGINT(20) NOT NULL,
        last_read_at BIGINT(20) DEFAULT NULL COMMENT '最后已读时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_group_user (group_id, user_id, user_type),
        KEY idx_user (user_id, user_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群组成员表'`,
},
```

- [ ] **Step 3: 添加 chat_messages 表定义**

```go
{
    name: "chat_messages",
    createSQL: `CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT(20) NOT NULL AUTO_INCREMENT,
        group_id BIGINT(20) NOT NULL COMMENT '群组ID',
        sender_id BIGINT(20) NOT NULL COMMENT '发送者ID',
        sender_type VARCHAR(20) NOT NULL COMMENT '发送者类型: teacher, student',
        sender_name VARCHAR(100) DEFAULT NULL COMMENT '发送者名称',
        content TEXT NOT NULL COMMENT '消息内容',
        created_at BIGINT(20) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_group (group_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表'`,
},
```

- [ ] **Step 4: 运行数据库迁移验证**

Run: `go run .`
Expected: 控制台输出 "Database migration completed"

- [ ] **Step 5: 验证表创建**

Run: `mysql -u root -p career_db -e "SHOW TABLES LIKE 'chat%'"`
Expected: 显示 chat_groups, chat_group_members, chat_messages 三张表

---

### Task 2: 创建群组 API

**Files:**
- Create: `internal/logic/chat/creategrouplogic.go`
- Create: `internal/logic/chat/listgrouplogic.go`
- Create: `internal/logic/chat/sendmessagelogic.go`
- Create: `internal/logic/chat/listmessageslogic.go`
- Create: `internal/handler/chat/chathandler.go`

**Types (modify internal/types/types.go):**
```go
type CreateGroupReq struct {
    SchoolId int64  `json:"schoolId"`
    Name    string `json:"name,optional"`
}

type ChatGroup struct {
    Id        int64  `json:"id"`
    SchoolId int64  `json:"schoolId"`
    Name     string `json:"name"`
    ChatType string `json:"chatType"`
    CreatedBy int64 `json:"createdBy"`
    CreatedAt int64 `json:"createdAt"`
}

type ChatMessage struct {
    Id         int64  `json:"id"`
    GroupId   int64  `json:"groupId"`
    SenderId  int64  `json:"senderId"`
    SenderType string `json:"senderType"`
    SenderName string `json:"senderName"`
    Content   string `json:"content"`
    CreatedAt int64  `json:"createdAt"`
}
```

- [ ] **Step 1: 创建 CreateGroupLogic**

```go
package chat

import (
    "context"
    "time"
    "career-api/internal/svc"
    "github.com/zeromicro/go-zero/core/logx"
)

type CreateGroupLogic struct {
    logx.Logger
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewCreateGroupLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateGroupLogic {
    return &CreateGroupLogic{
        Logger: logx.WithContext(ctx),
        ctx:    ctx,
        svcCtx: svcCtx,
    }
}

type CreateGroupReq struct {
    SchoolId int64  `json:"schoolId"`
    Name     string `json:"name,optional"`
}

func (l *CreateGroupLogic) CreateGroup(req *CreateGroupReq) (*ChatGroup, error) {
    teacherId := int64(1)
    if v, ok := l.ctx.Value("teacherId").(int64); ok {
        teacherId = v
    }

    db, err := l.svcCtx.DB.RawDB()
    if err != nil {
        return nil, err
    }

    now := time.Now().Unix()
    result, err := db.ExecContext(l.ctx,
        `INSERT INTO chat_groups (school_id, name, chat_type, created_by, created_at, updated_at)
         VALUES (?, ?, 'direct', ?, ?, ?)`,
        req.SchoolId, req.Name, teacherId, now, now)
    if err != nil {
        return nil, err
    }

    id, _ := result.LastInsertId()
    return &ChatGroup{
        Id:        id,
        SchoolId:  req.SchoolId,
        Name:     req.Name,
        ChatType: "direct",
        CreatedBy: teacherId,
        CreatedAt: now,
    }, nil
}
```

- [ ] **Step 2: 创建 ChatHandler 路由**

在 internal/handler/routes.go 添加:
```go
server.AddRoutes(
    []rest.Route{
        {
            Method:  http.MethodPost,
            Path:    "/chat/groups",
            Handler: chat.CreateGroupHandler(serverCtx),
        },
        {
            Method:  http.MethodGet,
            Path:    "/chat/groups",
            Handler: chat.ListGroupsHandler(serverCtx),
        },
        {
            Method:  http.MethodGet,
            Path:    "/chat/groups/:id/messages",
            Handler: chat.ListMessagesHandler(serverCtx),
        },
        {
            Method:  http.MethodPost,
            Path:    "/chat/groups/:id/messages",
            Handler: chat.SendMessageHandler(serverCtx),
        },
    },
)
```

- [ ] **Step 3: 测试创建群组 API**

Run: `curl -X POST http://localhost:8088/api/v1/chat/groups -H "Content-Type: application/json" -d '{"schoolId":1,"name":"Test"}' -H "Authorization: Bearer $TOKEN"`
Expected: `{"id":1,"schoolId":1,"name":"Test",...}`

- [ ] **Step 4: Commit**

```bash
git add career.go internal/logic/chat/ internal/handler/chat/ internal/types/types.go internal/handler/routes.go
git commit -m "feat: add chat group and message API"
```

---

### Task 3: 自动创建群组逻辑

**Files:**
- Modify: `internal/logic/student/joinschoollogic.go` - 学生加入学校时���动创建群组

- [ ] **Step 1: 修改 JoinSchoolLogic 添加自动创建群组**

在 joinschoollogic.go 的 JoinSchool 方法中, successful completion 后添加:
```go
// 自动创建与教师的聊天群组
func (l *JoinSchoolLogic) createChatGroups(schoolId, studentId int64, studentName string) error {
    db, err := l.svcCtx.DB.RawDB()
    if err != nil {
        return err
    }

    // 获取学校教师列表
    var teachers []struct {
        Id   int64  `json:"id"`
        Name string `json:"name"`
    }
    rows, err := db.QueryContext(l.ctx, "SELECT id, name FROM users WHERE school_id = ? AND role = 'teacher'", schoolId)
    if err != nil {
        return err
    }
    defer rows.Close()

    now := time.Now().Unix()
    for rows.Next() {
        var t struct{ Id int64; Name string }
        if err := rows.Scan(&t.Id, &t.Name); err != nil {
            continue
        }
        teachers = append(teachers, t)

        // 创建群组
        result, err := db.ExecContext(l.ctx,
            `INSERT INTO chat_groups (school_id, name, chat_type, created_by, created_at, updated_at)
             VALUES (?, ?, 'direct', ?, ?, ?)`,
            schoolId, studentName + " & " + t.Name, t.Id, now, now)
        if err != nil {
            continue
        }
        groupId, _ := result.LastInsertId()

        // 添加教师为成员
        db.ExecContext(l.ctx,
            `INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
             VALUES (?, ?, 'teacher', ?, 'owner', ?)`,
            groupId, t.Id, t.Name, now)

        // 添加学生为成员
        db.ExecContext(l.ctx,
            `INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
             VALUES (?, ?, 'student', ?, 'owner', ?)`,
            groupId, studentId, studentName, now)
    }

    return nil
}
```

在 JoinSchool 成功后的代码中调用:
```go
// 创建聊天群组
if err := l.createChatGroups(schoolId, studentId, studentName); err != nil {
    logx.Errorf("create chat groups failed: %v", err)
}
```

- [ ] **Step 2: 测试自动创建群组**

1. 调用加入学校 API
2. 验证群组创建: `mysql -u root -p career_db -e "SELECT * FROM chat_groups"`

- [ ] **Step 3: Commit**

```bash
git add internal/logic/student/joinschoollogic.go
git commit -m "feat: auto create chat group when student joins school"
```

---

## Phase 2: 前端 - 站内信和消息页面

### Task 4: API 接口定义

**Files:**
- Modify: `high-school-worker-design-forend/src/api/index.ts`

- [ ] **Step 1: 添加聊天室 API 定义**

```typescript
export interface ChatGroup {
  id: number;
  schoolId: number;
  name: string;
  chatType: string;
  createdBy: number;
  createdAt: number;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: number;
  groupId: number;
  senderId: number;
  senderType: string;
  senderName: string;
  content: string;
  createdAt: number;
}

export const chatApi = {
  listGroups: () => api.get<{ code: number; msg: string; data: ChatGroup[] }>('/chat/groups'),
  
  getMessages: (groupId: number) => 
    api.get<{ code: number; msg: string; data: ChatMessage[] }>(`/chat/groups/${groupId}/messages`),
  
  sendMessage: (groupId: number, content: string) =>
    api.post<{ code: number; msg: string }>(`/chat/groups/${groupId}/messages`, { content }),
};
```

- [ ] **Step 2: 添加教师站内信 API**

```typescript
export const teacherApi = {
  // ... existing
  
  listSentMessages: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ code: number; msg: string; data: { total: number; list: TeacherMessage[] } }>('/teachers/messages', { params }),
  
  sendMessage: (data: { receiverId: number; title: string; content: string }) =>
    api.post<{ code: number; msg: string }>('/teachers/messages', data),
    
  deleteMessage: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/teachers/messages/${id}`),
};
```

- [ ] **Step 3: 添加学生站内信 API**

```typescript
export const studentApi = {
  // ... existing
  
  listMessages: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ code: number; msg: string; data: { total: number; list: StudentMessage[] } }>('/students/messages', { params }),
    
  markAsRead: (id: number) =>
    api.put<{ code: number; msg: string }>(`/students/messages/${id}/read`),
};
```

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/src/api/index.ts
git commit -m "feat: add chat and message API definitions"
```

---

### Task 5: 教师端消息页面

**Files:**
- Create: `high-school-worker-design-forend/src/pages/Teacher/Messages.tsx`
- Modify: `high-school-worker-design-forend/src/components/SidebarNav/index.tsx` - 添加消息入口

- [ ] **Step 1: 创建 Messages.tsx**

创建教师消息页面, 包含:
- Tabs: [站内信, 聊天室]
- 站内信 Tab:
  - 发信按钮 + 发信表单 Modal
  - 收信列表 (Table)
- 聊天室 Tab:
  - 左侧: 群组列表
  - 右侧: 聊天窗口

```tsx
import { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Select, message, List, Avatar, Input } from 'antd';
import { SendOutlined, MessageOutlined, InboxOutlined } from '@ant-design/icons';
import { teacherApi, chatApi, type TeacherMessage, type ChatGroup, type ChatMessage } from '../../api';

const { TextArea } = Input;

export default function TeacherMessages() {
  const [activeTab, setActiveTab] = useState('inbox');
  
  // 站内信 state
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [students, setStudents] = useState<{id: number, name: string}[]>([]);
  
  // 聊天室 state
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sendContent, setSendContent] = useState('');
  
  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchMessages();
    } else {
      fetchGroups();
    }
  }, [activeTab]);
  
  const fetchMessages = async () => {
    try {
      const res = await teacherApi.listSentMessages({ page: 1, pageSize: 50 });
      const getData = (r: any) => r.data ?? r;
      setMessages(getData(res).list || []);
    } catch (e) {
      message.error('获取消息失败');
    }
  };
  
  const fetchGroups = async () => {
    try {
      const res = await chatApi.listGroups();
      setGroups(res.data || []);
    } catch (e) {
      message.error('获取群组失败');
    }
  };
  
  const fetchChatMessages = async (groupId: number) => {
    try {
      const res = await chatApi.getMessages(groupId);
      setChatMessages(res.data || []);
    } catch (e) {
      message.error('获取消息失败');
    }
  };
  
  const handleSendMessage = async () => {
    // 发送消息逻辑
  };
  
  const handleSendChat = async () => {
    if (!selectedGroup || !sendContent.trim()) return;
    try {
      await chatApi.sendMessage(selectedGroup.id, sendContent);
      setSendContent('');
      fetchChatMessages(selectedGroup.id);
    } catch (e) {
      message.error('发送失败');
    }
  };
  
  return (
    <div className="p-6">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab={<span><InboxOutlined /> 站内信</span>} key="inbox">
          {/* 站内信内容 */}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span><MessageOutlined /> 聊天室</span>} key="chat">
          {/* 聊天室内容 */}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: 添加路由**

在 App.tsx 添加:
```tsx
const TeacherMessages = lazy(() => import('./pages/Teacher/Messages'));
```

路由:
```tsx
<Route path="/teacher/messages" element={<TeacherMessages />} />
```

- [ ] **Step 3: 添加侧边栏入口**

在 SidebarNav teacherNavItems 添加:
```tsx
{ key: 'messages', title: '消息', icon: <MessageOutlined />, path: '/teacher/messages' },
```

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Teacher/Messages.tsx high-school-worker-design-forend/src/App.tsx high-school-worker-design-forend/src/components/SidebarNav/index.tsx
git commit -m "feat: add teacher messages page"
```

---

### Task 6: 学生端消息页面

**Files:**
- Create: `high-school-worker-design-forend/src/pages/Student/Messages.tsx`
- Modify: `high-school-worker-design-forend/src/stores/index.ts`

- [ ] **Step 1: 创建 StudentMessages.tsx**

类似教师端, 结构:
- 收信列表 (站内信)
- 聊天室列表和对话

- [ ] **Step 2: 添加路由和学生侧边栏**

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Student/Messages.tsx
git commit -m "feat: add student messages page"
```

---

## 实现顺序

1. Task 1: 数据库表 (独立测试)
2. Task 2: 群组和消息 API (独立测试)
3. Task 3: 自动创建群组 (集成测试)
4. Task 4: 前端 API 定义
5. Task 5: 教师端消息页面
6. Task 6: 学生端消息页面

**Plan complete.** 两套执行方案:

1. **Subagent-Driven (推荐)** - 我按任务逐个分发给子代理, 快速迭代
2. **Inline Execution** - 我在此 session 内执行, 带检查点

选择哪种方式?