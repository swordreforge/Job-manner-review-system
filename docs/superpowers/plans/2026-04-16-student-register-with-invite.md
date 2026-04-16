# Student Registration with Invite Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement student registration flow where students use an invite code to join a school. The invite code links the student to a school via student_schools table.

**Architecture:** 
1. Student submits registration with username, password, email, name, inviteCode
2. System validates invite code exists, is active, not expired, hasn't reached max uses
3. System creates user in `users` table with role='student'
4. System creates student profile in `students` table
5. System creates association in `student_schools` table
6. System increments invite code used_count
7. Returns auth token

**Tech Stack:** go-zero, MySQL

---

## File Structure

```
internal/
├── logic/student/
│   └── registerwithinvitelogic.go   # Modify - implement logic
├── handler/
│   └── studenthandler.go          # Check - add route
└── handler/routes.go             # Check - route exists?
```

---

## Task 1: Implement RegisterWithInvite Logic

**Files:**
- Modify: `internal/logic/student/registerwithinvitelogic.go`

- [ ] **Step 1: Read current placeholder logic**

```go
// Read internal/logic/student/registerwithinvitelogic.go
// Current: returns 501 not implemented
```

- [ ] **Step 2: Implement RegisterWithInvite logic**

```go
func (l *RegisterWithInviteLogic) RegisterWithInvite(req *types.RegisterWithInviteReq) (*types.RegisterWithInviteResp, error) {
    // 1. Validate invite code
    code, schoolId, teacherId, err := l.validateInviteCode(req.InviteCode)
    if err != nil {
        return &types.RegisterWithInviteResp{
            Code: 400,
            Msg:  "invalid invite code",
        }, nil
    }

    // 2. Check if username already exists
    if l.userExists(req.Username) {
        return &types.RegisterWithInviteResp{
            Code: 400,
            Msg:  "username already exists",
        }, nil
    }

    // 3. Create user
    userId, err := l.createUser(req.Username, req.Password, req.Email)
    if err != nil {
        return nil, err
    }

    // 4. Create student profile
    studentId, err := l.createStudent(userId, req.Name)
    if err != nil {
        return nil, err
    }

    // 5. Associate with school
    err = l.associateWithSchool(studentId, schoolId, teacherId, code.Id)
    if err != nil {
        return nil, err
    }

    // 6. Increment invite code usage
    err = l.incrementInviteCodeUsage(code.Id)
    if err != nil {
        l.Error("failed to increment invite code usage: %v", err)
    }

    // 7. Generate token
    token, err := l.generateToken(userId, req.Username)
    if err != nil {
        return nil, err
    }

    return &types.RegisterWithInviteResp{
        Code: 0,
        Msg:  "success",
        Data: &types.RegisterWithInviteData{
            UserId:    userId,
            Username:  req.Username,
            StudentId: studentId,
            SchoolId:  schoolId,
            Token:    token,
        },
    }, nil
}
```

Helper methods needed:
- `validateInviteCode(code string) (*InviteCode, int64, int64, error)`
- `userExists(username string) bool`
- `createUser(username, password, email string) (int64, error)`
- `createStudent(userId int64, name string) (int64, error)`
- `associateWithSchool(studentId, schoolId, teacherId, inviteCodeId int64) error`
- `incrementInviteCodeUsage(id int64) error`
- `generateToken(userId int64, username string) (string, error)`

- [ ] **Step 3: Build and test compiles**

```bash
go build -o career-api .
```

- [ ] **Step 4: Commit**

---

## Task 2: Add Route to routes.go (if not exists)

**Files:**
- Check: `internal/handler/routes.go`

- [ ] **Step 1: Check if route exists**

Search for "register" route that accepts inviteCode parameter

- [ ] **Step 2: Add route if missing**

```go
{
    Method:  http.MethodPost,
    Path:    "/students/register",
    Handler: student.RegisterWithInviteHandler(serverCtx),
},
```

---

## Task 3: Verify Handler Calls Logic

**Files:**
- Modify: `internal/handler/studenthandler.go`

- [ ] **Step 1: Check if RegisterWithInviteHandler exists**

- [ ] **Step 2: Create handler if missing**

---

## Task 4: Final Build Verification

- [ ] **Step 1: Build full project**

```bash
go build -o career-api .
```

- [ ] **Step 2: Commit**