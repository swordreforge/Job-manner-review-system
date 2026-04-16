# Teacher Student Management APIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Allow teachers to view/manage students in their school. APIs: List school students, Get student detail, Get task progress.

**Architecture:** Teacher queries students via student_schools table (filters by school_id from auth context)

**Tech Stack:** go-zero, MySQL

---

## APIs Needed

1. **List school students** - GET /api/v1/teachers/students
2. **Get student detail** - GET /api/v1/teachers/students/:id
3. **Get student task progress** - GET /api/v1/teachers/students/:id/tasks

---

## Task 1: Add Teacher Student Types

**Files:**
- Modify: `internal/types/types.go`

Add after existing types:
```go
// Teacher student list types
type TeacherListStudentsReq struct {
    Page     int    `json:"page"`
    PageSize int    `json:"pageSize"`
    ClassName string `json:"className,optional"`
    Grade   string `json:"grade,optional"`
    Status  string `json:"status,optional"` // active, graduated
}

type TeacherStudentInfo struct {
    Id              int64   `json:"id"`
    UserId           int64   `json:"userId"`
    Name            string `json:"name"`
    Username        string `json:"username"`
    Email          string `json:"email"`
    ClassName       string `json:"className,optional"`
    Grade          string `json:"grade,optional"`
    TaskCompletionRate float64 `json:"taskCompletionRate"`
    LastActivityAt  int64   `json:"lastActivityAt,optional"`
    JoinedAt       int64   `json:"joinedAt"`
    Status         string `json:"status"`
}

type TeacherListStudentsResp struct {
    Total int                   `json:"total"`
    List  []TeacherStudentInfo `json:"list"`
}

type TeacherGetStudentReq struct {
    StudentId int64 `path:"id"`
}

type TeacherStudentDetailResp struct {
    Id          int64   `json:"id"`
    UserId      int64   `json:"userId"`
    Name        string `json:"name"`
    Username    string `json:"username"`
    Email       string `json:"email"`
    Phone       string `json:"phone,optional"`
    ClassName  string `json:"className,optional"`
    Grade      string `json:"grade,optional"`
    SchoolId   int64   `json:"schoolId"`
    SchoolName string `json:"schoolName"`
    TaskCompletionRate float64 `json:"taskCompletionRate"`
    LastActivityAt int64  `json:"lastActivityAt,optional"`
    JoinedAt    int64   `json:"joinedAt"`
    Status     string  `json:"status"`
}

type TeacherTaskProgress struct {
    TaskSeriesId     int      `json:"taskSeriesId"`
    TaskName       string   `json:"taskName"`
    TaskType      string   `json:"taskType"`
    Status        string   `json:"status"`
    CompletionRate float64  `json:"completionRate"`
    Score         float64  `json:"score,optional"`
    StartedAt     int64    `json:"startedAt,optional"`
    CompletedAt  int64    `json:"completedAt,optional"`
}

type TeacherGetStudentTasksResp struct {
    StudentId    int64               `json:"studentId"`
    TotalTasks   int                 `json:"totalTasks"`
    CompletedTasks int               `json:"completedTasks"`
    OverallRate  float64             `json:"overallRate"`
    Tasks       []TeacherTaskProgress `json:"tasks"`
}
```

---

## Task 2: Teacher Student List Logic

**Files:**
- Create: `internal/logic/teacher/liststudentslogic.go`

Implement ListSchoolStudents that:
- Gets school_id from auth context (current teacher)
- Queries student_schools + students + users JOIN
- Filters by className, grade, status if provided
- Returns paginated list with student info

---

## Task 3: Teacher Student Detail Logic

**Files:**
- Create: `internal/logic/teacher/getstudentlogic.go`

Implement GetStudentDetail that:
- Validates student belongs to teacher's school
- Returns full student info + school name

---

## Task 4: Teacher Student Tasks Logic

**Files:**
- Create: `internal/logic/teacher/getstudenttaskslogic.go`

Implement GetStudentTasks that:
- Validates student belongs to teacher's school
- Returns 8-series task progress from student_task_progress table

---

## Task 5: Add Teacher Student Handlers

**Files:**
- Create: `internal/handler/teacher/studenthandler.go`

Create handlers:
- ListSchoolStudentsHandler
- GetStudentDetailHandler
- GetStudentTasksHandler

---

## Task 6: Add Routes

**Files:**
- Modify: `internal/handler/routes.go`

Add routes:
- GET /api/v1/teachers/students
- GET /api/v1/teachers/students/:id
- GET /api/v1/teachers/students/:id/tasks

---

## Task 7: Build Verification

- [ ] Build and verify all compiles