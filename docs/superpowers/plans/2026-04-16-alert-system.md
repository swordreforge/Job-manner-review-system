# Alert System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Automatic alerts when students have low task completion rate (<60%). Teachers can view and resolve alerts.

**Architecture:**
- Cron job checks students' task completion rate
- If < threshold, creates alert in alert_records table
- Teachers can list/resolve/ignore alerts
- Alert levels: low (<60%), medium (<40%), high (<20%), critical (<10%)

**Tech Stack:** go-zero, MySQL, cron (background task)

---

## APIs Needed

1. **List alerts** - GET /api/v1/teachers/alerts
2. **Resolve alert** - PUT /api/v1/teachers/alerts/:id/resolve
3. **Ignore alert** - PUT /api/v1/teachers/alerts/:id/ignore

---

## Task 1: Add Alert Types

**Files:**
- Modify: `internal/types/types.go`

Add types:
```go
type TeacherListAlertsReq struct {
    Page     int    `json:"page"`
    PageSize int    `json:"pageSize"`
    AlertType string `json:"alertType,optional"` // low_completion, no_activity
    AlertLevel string `json:"alertLevel,optional"` // low, medium, high, critical
}

type TeacherAlertInfo struct {
    Id             int64   `json:"id"`
    StudentId      int64   `json:"studentId"`
    StudentName   string  `json:"studentName"`
    SchoolId      int64   `json:"schoolId"`
    AlertType    string  `json:"alertType"`
    AlertLevel   string  `json:"alertLevel"`
    Description  string  `json:"description"`
    CompletionRate float64 `json:"completionRate"`
    TotalTasks   int     `json:"totalTasks"`
    CompletedTasks int   `json:"completedTasks"`
    Status       string  `json:"status"` // pending, resolved, ignored
    CreatedAt    int64   `json:"createdAt"`
    UpdatedAt    int64   `json:"updatedAt"`
}

type TeacherListAlertsResp struct {
    Total int                `json:"total"`
    List  []TeacherAlertInfo `json:"list"`
}

type AlertActionReq struct {
    AlertId int64 `path:"id"`
}
```

---

## Task 2: List Alerts Logic

**Files:**
- Create: `internal/logic/teacher/listalertlogic.go`

Query alert_records with filters, JOIN students table for name.

---

## Task 3: Resolve/Ignore Alert Logic

**Files:**
- Create: `internal/logic/teacher/resolvealertlogic.go`
- Create: `internal/logic/teacher/ignorealertlogic.go`

Update alert status to 'resolved' or 'ignored'.

---

## Task 4: Check Student Alert Logic (Manual trigger)

**Files:**
- Create: `internal/logic/teacher/checkalertlogic.go`

Manual trigger to check single student's completion rate and create alert if needed.

---

## Task 5: Handlers

**Files:**
- Modify: `internal/handler/teacher/studenthandler.go`

Add handlers:
- ListAlertsHandler
- ResolveAlertHandler
- IgnoreAlertHandler

---

## Task 6: Routes

**Files:**
- Modify: `internal/handler/routes.go`

Add routes:
- GET /api/v1/teachers/alerts
- PUT /api/v1/teachers/alerts/:id/resolve
- PUT /api/v1/teachers/alerts/:id/ignore
- POST /api/v1/teachers/students/:id/check-alert

---

## Task 7: Build Verification