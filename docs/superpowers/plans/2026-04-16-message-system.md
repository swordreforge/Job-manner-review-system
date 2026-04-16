# Message System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** In-app messaging between teachers and students. Teachers can send messages to students, students can view received messages.

**Architecture:**
- Messages stored in `messages` table
- Sender (teacher) → Receiver (student)
- Teachers can list sent messages, students can list received
- Mark messages as read

**Tech Stack:** go-zero, MySQL

---

## APIs Needed

1. **Send message** - POST /api/v1/teachers/messages
2. **List sent messages** - GET /api/v1/teachers/messages
3. **List received messages** - GET /api/v1/students/messages
4. **Mark as read** - PUT /api/v1/students/messages/:id/read

---

## Task 1: Add Message Types

**Files:**
- Modify: `internal/types/types.go`

Add types:
```go
type SendMessageReq struct {
    ReceiverId int64  `json:"receiverId"`
    Title     string `json:"title"`
    Content  string `json:"content"`
}

type MessageInfo struct {
    Id         int64  `json:"id"`
    SenderId   int64  `json:"senderId"`
    SenderName string `json:"senderName"`
    ReceiverId int64 `json:"receiverId"`
    ReceiverName string `json:"receiverName"`
    Title     string `json:"title"`
    Content   string `json:"content"`
    IsRead    bool   `json:"isRead"`
    CreatedAt int64 `json:"createdAt"`
    ReadAt    int64 `json:"readAt,optional"`
}

type ListMessagesResp struct {
    Total int               `json:"total"`
    List  []MessageInfo     `json:"list"`
}
```

---

## Task 2: Send Message Logic

**Files:**
- Create: `internal/logic/teacher/sendmessagelogic.go`

---

## Task 3: List Messages Logic

**Files:**
- Create: `internal/logic/teacher/listmessageslogic.go` (sent)
- Create: `internal/logic/student/listmessageslogic.go` (received)

---

## Task 4: Mark as Read Logic

**Files:**
- Create: `internal/logic/student/readmessagelogic.go`

---

## Task 5: Add Handlers

**Files:**
- Modify: `internal/handler/teacher/studenthandler.go`

---

## Task 6: Add Routes

**Files:**
- Modify: `internal/handler/routes.go`

---

## Task 7: Build Verification