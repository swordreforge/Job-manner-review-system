# 教师端功能实现方案

## 概述

本文档描述教师端功能的实现方案，包括邀请码生成、学生管理、以及学生进度监控和预警系统。该功能旨在帮助教师有效管理学生，追踪学生完成系统任务的情况，及时发现并提醒未完成作业的学生。

## 核心功能

### 1. 邀请码生成系统
### 2. 学生管理
### 3. 学生进度监控与预警（8系列任务完成度<60%）

## 当前系统状态

### 现有数据表
- `users`: 用户表（包含role字段，目前有'student'角色）
- `students`: 学生资料表
- `holland_test_results`: 霍兰德测试结果表
- `career_reports`: 职业规划报告表
- `interview_sessions`: 面试会话表

### 缺失功能
- ❌ 教师角色和权限管理
- ❌ 学校/组织管理
- ❌ 邀请码系统
- ❌ 学生进度追踪（8系列任务）
- ❌ 预警通知系统
- ❌ 消息队列系统，站内信

---

## 一、数据库设计

### 1.1 新增数据表

#### 1.1.1 学校表 (schools)
```sql
CREATE TABLE IF NOT EXISTS schools (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '学校名称',
    code VARCHAR(20) NOT NULL UNIQUE COMMENT '学校代码',
    address VARCHAR(200) DEFAULT NULL COMMENT '学校地址',
    contact_person VARCHAR(50) DEFAULT NULL COMMENT '联系人',
    contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    contact_email VARCHAR(100) DEFAULT NULL COMMENT '联系邮箱',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, inactive, suspended',
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校表';
```

#### 1.1.2 教师表 (teachers)
```sql
CREATE TABLE IF NOT EXISTS teachers (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    user_id BIGINT(20) NOT NULL COMMENT '关联用户ID',
    school_id BIGINT(20) NOT NULL COMMENT '所属学校ID',
    name VARCHAR(50) NOT NULL COMMENT '教师姓名',
    employee_id VARCHAR(50) DEFAULT NULL COMMENT '工号',
    department VARCHAR(100) DEFAULT NULL COMMENT '院系/部门',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, inactive',
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id),
    KEY idx_school_id (school_id),
    KEY idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师表';
```

#### 1.1.3 邀请码表 (invite_codes)
```sql
CREATE TABLE IF NOT EXISTS invite_codes (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE COMMENT '邀请码',
    school_id BIGINT(20) NOT NULL COMMENT '学校ID',
    teacher_id BIGINT(20) NOT NULL COMMENT '创建教师ID',
    type VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT '类型: student, teacher',
    max_uses INT NOT NULL DEFAULT 100 COMMENT '最大使用次数',
    used_count INT NOT NULL DEFAULT 0 COMMENT '已使用次数',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, expired, revoked',
    expires_at BIGINT(20) DEFAULT NULL COMMENT '过期时间',
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code),
    KEY idx_school_id (school_id),
    KEY idx_teacher_id (teacher_id),
    KEY idx_status (status),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码表';
```

#### 1.1.4 学生-学校关联表 (student_schools)
```sql
CREATE TABLE IF NOT EXISTS student_schools (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    student_id BIGINT(20) NOT NULL COMMENT '学生ID',
    school_id BIGINT(20) NOT NULL COMMENT '学校ID',
    class_name VARCHAR(50) DEFAULT NULL COMMENT '班级名称',
    grade VARCHAR(20) DEFAULT NULL COMMENT '年级',
    invite_code_id BIGINT(20) DEFAULT NULL COMMENT '使用的邀请码ID',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, graduated, transferred',
    joined_at BIGINT(20) NOT NULL COMMENT '加入时间',
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_school (student_id, school_id),
    KEY idx_school_id (school_id),
    KEY idx_status (status),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (invite_code_id) REFERENCES invite_codes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSETutf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生-学校关联表';
```

#### 1.1.5 学生任务进度表 (student_task_progress)
```sql
CREATE TABLE IF NOT EXISTS student_task_progress (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    student_id BIGINT(20) NOT NULL COMMENT '学生ID',
    school_id BIGINT(20) NOT NULL COMMENT '学校ID',
    task_series_id INT NOT NULL COMMENT '任务系列ID (1-8)',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型: holland_test, resume_upload, career_plan, interview, etc.',
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' COMMENT '状态: not_started, in_progress, completed, skipped',
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '完成度 (0-100)',
    score DECIMAL(5,2) DEFAULT NULL COMMENT '任务得分',
    started_at BIGINT(20) DEFAULT NULL COMMENT '开始时间',
    completed_at BIGINT(20) DEFAULT NULL COMMENT '完成时间',
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_series (student_id, task_series_id),
    KEY idx_school_id (school_id),
    KEY idx_status (status),
    KEY idx_completion_rate (completion_rate),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生任务进度表';
```

#### 1.1.6 预警记录表 (alert_records)
```sql
CREATE TABLE IF NOT EXISTS alert_records (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    student_id BIGINT(20) NOT NULL COMMENT '学生ID',
    school_id BIGINT(20) NOT NULL COMMENT '学校ID',
    teacher_id BIGINT(20) NOT NULL COMMENT '教师ID',
    alert_type VARCHAR(50) NOT NULL COMMENT '预警类型: low_completion, no_activity, deadline_warning',
    alert_level VARCHAR(20) NOT NULL COMMENT '预警级别: low, medium, high, critical',
    description TEXT NOT NULL COMMENT '预警描述',
    completion_rate DECIMAL(5,2) NOT NULL COMMENT '当前完成度',
    total_tasks INT NOT NULL COMMENT '总任务数',
    completed_tasks INT NOT NULL COMMENT '已完成任务数',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending, resolved, ignored',
    resolved_at BIGINT(20) DEFAULT NULL COMMENT '解决时间',
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_student_id (student_id),
    KEY idx_school_id (school_id),
    KEY idx_teacher_id (teacher_id),
    KEY idx_status (status),
    KEY idx_alert_type (alert_type),
    KEY idx_created_at (created_at),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警记录表';
```

### 1.2 修改现有表

#### 1.2.1 修改users表
```sql
-- 添加更多角色选项
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT '角色: student, teacher, admin';

-- 添加学校关联
ALTER TABLE users ADD COLUMN school_id BIGINT(20) DEFAULT NULL COMMENT '关联学校ID' AFTER role;
ALTER TABLE users ADD KEY idx_school_id (school_id);
```

#### 1.2.2 修改students表
```sql
-- 添加任务总完成度字段
ALTER TABLE students ADD COLUMN task_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '8系列任务总完成度' AFTER competitiveness_score;
ALTER TABLE students ADD COLUMN last_activity_at BIGINT(20) DEFAULT NULL COMMENT '最后活动时间' AFTER task_completion_rate;
```

---

## 二、8系列任务定义

### 2.1 任务系列结构

系统定义8个核心任务系列，每个任务代表学生需要完成的一个模块：

| 任务ID | 任务名称 | 任务类型 | 权重 | 说明 |
|--------|---------|---------|------|------|
| 1 | 霍兰德职业倾向测试 | holland_test | 12.5% | 完成霍兰德测试 |
| 2 | 学生资料创建 | student_profile | 12.5% | 完善个人基本信息 |
| 3 | 简历上传与解析 | resume_upload | 12.5% | 上传简历并完成解析 |
| 4 | 技能评估 | skill_assessment | 12.5% | 评估个人技能水平 |
| 5 | 职业规划报告生成 | career_report | 12.5% | 生成职业规划报告 |
| 6 | 模拟面试 | interview_simulation | 12.5% | 完成模拟面试 |
| 7 | 岗位匹配分析 | job_matching | 12.5% | 查看匹配岗位分析 |
| 8 | 学习路径规划 | learning_path | 12.5% | 制定个人学习路径 |

### 2.2 任务完成度计算

每个任务的完成度计算方式：

1. **霍兰德职业倾向测试**
   - 完成测试：100%
   - 未完成：0%

2. **学生资料创建**
   - 基础信息完整：40%
   - 技能信息完整：20%
   - 证书信息完整：10%
   - 实习经历完整：15%
   - 项目经验完整：15%

3. **简历上传与解析**
   - 上传简历：50%
   - 解析成功：50%

4. **技能评估**
   - 自评完成：100%

5. **职业规划报告生成**
   - 生成报告：100%

6. **模拟面试**
   - 完成面试：100%

7. **岗位匹配分析**
   - 查看匹配结果：100%

8. **学习路径规划**
   - 制定路径：100%

### 2.3 总完成度计算

```sql
总完成度 = SUM(各任务完成度 × 任务权重) / 100
```

例如：
- 任务1完成：12.5%
- 任务2完成：12.5%
- 任务3完成：12.5%
- 任务4完成：0%
- 任务5完成：12.5%
- 任务6完成：0%
- 任务7完成：0%
- 任务8完成：0%

总完成度 = (12.5 + 12.5 + 12.5 + 0 + 12.5 + 0 + 0 + 0) = 50%

---

## 三、API设计

### 3.1 教师相关API

#### 3.1.1 教师注册
```
POST /api/v1/teachers/register
```

**请求体**:
```json
{
  "username": "teacher001",
  "password": "password123",
  "email": "teacher@school.com",
  "phone": "13800138000",
  "name": "张老师",
  "schoolCode": "SCH001",
  "employeeId": "T001",
  "department": "计算机系"
}
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "userId": 100,
    "name": "张老师",
    "schoolId": 1
  }
}
```

#### 3.1.2 生成邀请码
```
POST /api/v1/teachers/invite-codes
```

**请求体**:
```json
{
  "type": "student",
  "maxUses": 100,
  "expiresIn": 30
}
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "code": "SCH001-20250416-ABCD",
    "maxUses": 100,
    "usedCount": 0,
    "expiresAt": 1747900800
  }
}
```

#### 3.1.3 查询邀请码列表
```
GET /api/v1/teachers/invite-codes?page=1&pageSize=10&status=active
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 1,
        "code": "SCH001-20250416-ABCD",
        "type": "student",
        "maxUses": 100,
        "usedCount": 45,
        "status": "active",
        "expiresAt": 1747900800,
        "createdAt": 1713260800
      }
    ]
  }
}
```

#### 3.1.4 撤销邀请码
```
DELETE /api/v1/teachers/invite-codes/:id
```

#### 3.1.5 查询学生列表
```
GET /api/v1/teachers/students?page=1&pageSize=10&className=计算机1班&grade=2024&status=active
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 50,
    "list": [
      {
        "id": 1,
        "name": "张三",
        "className": "计算机1班",
        "grade": "2024",
        "taskCompletionRate": 75.00,
        "lastActivityAt": 1713260800,
        "joinedAt": 1710000000
      }
    ]
  }
}
```

#### 3.1.6 查询学生详情
```
GET /api/v1/teachers/students/:id
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "张三",
    "education": "bachelor",
    "major": "计算机科学与技术",
    "className": "计算机1班",
    "grade": "2024",
    "taskCompletionRate": 75.00,
    "lastActivityAt": 1713260800,
    "tasks": [
      {
        "taskSeriesId": 1,
        "taskName": "霍兰德职业倾向测试",
        "taskType": "holland_test",
        "status": "completed",
        "completionRate": 100.00,
        "score": 85.00,
        "completedAt": 1713260800
      },
      {
        "taskSeriesId": 2,
        "taskName": "学生资料创建",
        "taskType": "student_profile",
        "status": "completed",
        "completionRate": 100.00,
        "completedAt": 1713262000
      }
    ]
  }
}
```

#### 3.1.7 查询预警学生列表
```
GET /api/v1/teachers/alerts?page=1&pageSize=10&alertType=low_completion&alertLevel=high
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 15,
    "list": [
      {
        "id": 1,
        "studentId": 5,
        "studentName": "李四",
        "className": "计算机1班",
        "alertType": "low_completion",
        "alertLevel": "high",
        "description": "8系列任务完成度低于60%",
        "completionRate": 45.00,
        "totalTasks": 8,
        "completedTasks": 3,
        "status": "pending",
        "createdAt": 1713260800
      }
    ]
  }
}
```

#### 3.1.8 标记预警已解决
```
PUT /api/v1/teachers/alerts/:id/resolve
```

#### 3.1.9 忽略预警
```
PUT /api/v1/teachers/alerts/:id/ignore
```

#### 3.1.10 发送提醒给学生
```
POST /api/v1/teachers/students/:id/remind
```

**请求体**:
```json
{
  "message": "请尽快完成您的职业规划报告，目前完成度为45%",
  "type": "task_reminder"
}
```

#### 3.1.11 批量导入学生
```
POST /api/v1/teachers/students/batch-import
```

**请求体**:
```json
{
  "students": [
    {
      "name": "张三",
      "email": "zhangsan@example.com",
      "className": "计算机1班",
      "grade": "2024"
    }
  ]
}
```

#### 3.1.12 导出学生进度报告
```
GET /api/v1/teachers/students/export?format=excel&className=计算机1班
```

### 3.2 学生相关API（新增）

#### 3.2.1 使用邀请码注册
```
POST /api/v1/students/register-with-invite
```

**请求体**:
```json
{
  "username": "student001",
  "password": "password123",
  "email": "student@school.com",
  "inviteCode": "SCH001-20250416-ABCD"
}
```

#### 3.2.2 查询任务进度
```
GET /api/v1/students/tasks/progress
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "totalCompletionRate": 75.00,
    "tasks": [
      {
        "taskSeriesId": 1,
        "taskName": "霍兰德职业倾向测试",
        "taskType": "holland_test",
        "status": "completed",
        "completionRate": 100.00,
        "score": 85.00,
        "completedAt": 1713260800
      },
      {
        "taskSeriesId": 2,
        "taskName": "学生资料创建",
        "taskType": "student_profile",
        "status": "completed",
        "completionRate": 100.00,
        "completedAt": 1713262000
      }
    ]
  }
}
```

---

## 四、后端实现

### 4.1 目录结构

```
internal/
├── handler/
│   ├── teacherhandler.go          # 教师相关处理
│   └── alerthandler.go            # 预警相关处理
├── logic/
│   ├── teacher/
│   │   ├── registerlogic.go       # 教师注册
│   │   ├── generateinvitecodelogic.go  # 生成邀请码
│   │   ├── listinvitescodeslogic.go   # 查询邀请码
│   │   ├── revokeinvitecodelogic.go   # 撤销邀请码
│   │   ├── liststudentslogic.go       # 查询学生列表
│   │   ├── getstudentdetaillogic.go   # 查询学生详情
│   │   ├── listalertslogic.go         # 查询预警
│   │   ├── resolvealertlogic.go       # 解决预警
│   │   ├── remindstudentlogic.go      # 提醒学生
│   │   └── batchimportstudentslogic.go # 批量导入
│   └── alert/
│       ├── calculatecompletionlogic.go  # 计算完成度
│       ├── checkalertlogic.go           # 检查预警
│       └── createalertlogic.go          # 创建预警
└── model/
    ├── schools_model.go
    ├── teachers_model.go
    ├── invite_codes_model.go
    ├── student_schools_model.go
    ├── student_task_progress_model.go
    └── alert_records_model.go
```

### 4.2 核心逻辑实现

#### 4.2.1 邀请码生成逻辑

```go
// internal/logic/teacher/generateinvitecodelogic.go
func (l *GenerateInviteCodeLogic) GenerateInviteCode(req *types.GenerateInviteCodeReq) (*types.GenerateInviteCodeResp, error) {
    // 1. 获取教师信息
    teacher, err := l.svcCtx.TeachersModel.FindOne(l.ctx, l.ctx.Value("teacherId").(int64))
    if err != nil {
        return nil, errors.New("teacher not found")
    }
    
    // 2. 获取学校信息
    school, err := l.svcCtx.SchoolsModel.FindOne(l.ctx, teacher.SchoolId)
    if err != nil {
        return nil, errors.New("school not found")
    }
    
    // 3. 生成邀请码
    code := fmt.Sprintf("%s-%s-%s", 
        school.Code, 
        time.Now().Format("20060102"), 
        generateRandomString(4))
    
    // 4. 计算过期时间
    var expiresAt int64
    if req.ExpiresIn > 0 {
        expiresAt = time.Now().Add(time.Duration(req.ExpiresIn) * 24 * time.Hour).Unix()
    }
    
    // 5. 保存到数据库
    inviteCode := &model.InviteCodes{
        Code:      code,
        SchoolId:  teacher.SchoolId,
        TeacherId: teacher.Id,
        Type:      req.Type,
        MaxUses:   req.MaxUses,
        Status:    "active",
        ExpiresAt: expiresAt,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    result, err := l.svcCtx.InviteCodesModel.Insert(l.ctx, inviteCode)
    if err != nil {
        return nil, err
    }
    
    id, _ := result.LastInsertId()
    inviteCode.Id = id
    
    return &types.GenerateInviteCodeResp{
        Code:      inviteCode.Code,
        MaxUses:   inviteCode.MaxUses,
        UsedCount: inviteCode.UsedCount,
        ExpiresAt: inviteCode.ExpiresAt,
    }, nil
}
```

#### 4.2.2 学生任务完成度计算

```go
// internal/logic/alert/calculatecompletionlogic.go
func (l *CalculateCompletionLogic) CalculateStudentCompletion(studentId, schoolId int64) (float64, error) {
    // 1. 查询所有任务进度
    tasks, err := l.svcCtx.StudentTaskProgressModel.FindByStudentId(l.ctx, studentId, schoolId)
    if err != nil {
        return 0, err
    }
    
    // 2. 如果任务不足8个，初始化缺失任务
    if len(tasks) < 8 {
        l.initializeMissingTasks(studentId, schoolId, tasks)
        tasks, _ = l.svcCtx.StudentTaskProgressModel.FindByStudentId(l.ctx, studentId, schoolId)
    }
    
    // 3. 计算总完成度
    taskWeight := 12.5 // 每个任务权重12.5%
    totalCompletion := 0.0
    
    for _, task := range tasks {
        totalCompletion += task.CompletionRate * taskWeight / 100
    }
    
    totalCompletion = math.Round(totalCompletion*100) / 100 // 保留两位小数
    
    // 4. 更新学生总完成度
    err = l.svcCtx.StudentsModel.UpdateCompletionRate(l.ctx, studentId, totalCompletion)
    if err != nil {
        return 0, err
    }
    
    return totalCompletion, nil
}

func (l *CalculateCompletionLogic) initializeMissingTasks(studentId, schoolId int64, existingTasks []*model.StudentTaskProgress) {
    existingTaskMap := make(map[int]bool)
    for _, task := range existingTasks {
        existingTaskMap[task.TaskSeriesId] = true
    }
    
    taskDefinitions := getTaskDefinitions()
    
    for _, def := range taskDefinitions {
        if !existingTaskMap[def.TaskSeriesId] {
            task := &model.StudentTaskProgress{
                StudentId:      studentId,
                SchoolId:       schoolId,
                TaskSeriesId:   def.TaskSeriesId,
                TaskName:       def.TaskName,
                TaskType:       def.TaskType,
                Status:         "not_started",
                CompletionRate: 0.00,
                CreatedAt:      time.Now().Unix(),
                UpdatedAt:      time.Now().Unix(),
            }
            l.svcCtx.StudentTaskProgressModel.Insert(l.ctx, task)
        }
    }
}

func getTaskDefinitions() []TaskDefinition {
    return []TaskDefinition{
        {TaskSeriesId: 1, TaskName: "霍兰德职业倾向测试", TaskType: "holland_test"},
        {TaskSeriesId: 2, TaskName: "学生资料创建", TaskType: "student_profile"},
        {TaskSeriesId: 3, TaskName: "简历上传与解析", TaskType: "resume_upload"},
        {TaskSeriesId: 4, TaskName: "技能评估", TaskType: "skill_assessment"},
        {TaskSeriesId: 5, TaskName: "职业规划报告生成", TaskType: "career_report"},
        {TaskSeriesId: 6, TaskName: "模拟面试", TaskType: "interview_simulation"},
        {TaskSeriesId: 7, TaskName: "岗位匹配分析", TaskType: "job_matching"},
        {TaskSeriesId: 8, TaskName: "学习路径规划", TaskType: "learning_path"},
    }
}
```

#### 4.2.3 预警检查逻辑

```go
// internal/logic/alert/checkalertlogic.go
func (l *CheckAlertLogic) CheckAndCreateAlerts(studentId, schoolId, teacherId int64) error {
    // 1. 计算学生完成度
    completionRate, err := l.CalculateStudentCompletion(studentId, schoolId)
    if err != nil {
        return err
    }
    
    // 2. 检查是否需要预警
    if completionRate < 60.0 {
        // 3. 检查是否已存在未解决的预警
        existingAlert, err := l.svcCtx.AlertRecordsModel.FindPendingAlert(l.ctx, studentId, schoolId, "low_completion")
        if err == nil && existingAlert != nil {
            // 已存在预警，更新预警记录
            return l.updateExistingAlert(existingAlert, completionRate)
        }
        
        // 4. 创建新预警
        tasks, _ := l.svcCtx.StudentTaskProgressModel.FindByStudentId(l.ctx, studentId, schoolId)
        completedTasks := 0
        for _, task := range tasks {
            if task.Status == "completed" {
                completedTasks++
            }
        }
        
        alertLevel := l.calculateAlertLevel(completionRate)
        
        alert := &model.AlertRecords{
            StudentId:       studentId,
            SchoolId:        schoolId,
            TeacherId:       teacherId,
            AlertType:       "low_completion",
            AlertLevel:      alertLevel,
            Description:     fmt.Sprintf("8系列任务完成度低于60%%，当前完成度为%.2f%%", completionRate),
            CompletionRate:  completionRate,
            TotalTasks:      8,
            CompletedTasks:  completedTasks,
            Status:          "pending",
            CreatedAt:       time.Now().Unix(),
            UpdatedAt:       time.Now().Unix(),
        }
        
        return l.svcCtx.AlertRecordsModel.Insert(l.ctx, alert)
    }
    
    return nil
}

func (l *CheckAlertLogic) calculateAlertLevel(completionRate float64) string {
    if completionRate < 30 {
        return "critical"
    } else if completionRate < 45 {
        return "high"
    } else if completionRate < 60 {
        return "medium"
    }
    return "low"
}

func (l *CheckAlertLogic) updateExistingAlert(alert *model.AlertRecords, completionRate float64) error {
    alert.CompletionRate = completionRate
    alert.Description = fmt.Sprintf("8系列任务完成度低于60%%，当前完成度为%.2f%%", completionRate)
    alert.UpdatedAt = time.Now().Unix()
    
    // 更新预警级别
    tasks, _ := l.svcCtx.StudentTaskProgressModel.FindByStudentId(l.ctx, alert.StudentId, alert.SchoolId)
    completedTasks := 0
    for _, task := range tasks {
        if task.Status == "completed" {
            completedTasks++
        }
    }
    alert.CompletedTasks = completedTasks
    alert.AlertLevel = l.calculateAlertLevel(completionRate)
    
    return l.svcCtx.AlertRecordsModel.Update(l.ctx, alert)
}
```

#### 4.2.4 批量检查所有学生预警

```go
// internal/logic/alert/batchcheckalertslogic.go
func (l *BatchCheckAlertsLogic) BatchCheckAlerts(schoolId int64) error {
    // 1. 获取学校所有教师
    teachers, err := l.svcCtx.TeachersModel.FindBySchoolId(l.ctx, schoolId)
    if err != nil {
        return err
    }
    
    if len(teachers) == 0 {
        return errors.New("no teachers found in this school")
    }
    
    // 2. 获取学校所有学生
    students, err := l.svcCtx.StudentSchoolsModel.FindActiveStudentsBySchoolId(l.ctx, schoolId)
    if err != nil {
        return err
    }
    
    // 3. 为每个学生检查预警
    teacherId := teachers[0].Id // 使用第一个教师作为预警创建者
    for _, studentSchool := range students {
        err := l.CheckAndCreateAlerts(studentSchool.StudentId, schoolId, teacherId)
        if err != nil {
            logx.Errorf("Failed to check alert for student %d: %v", studentSchool.StudentId, err)
        }
    }
    
    return nil
}
```

### 4.3 定时任务

```go
// internal/pkg/scheduler/alertscheduler.go
type AlertScheduler struct {
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewAlertScheduler(ctx context.Context, svcCtx *svc.ServiceContext) *AlertScheduler {
    return &AlertScheduler{
        ctx:    ctx,
        svcCtx: svcCtx,
    }
}

func (s *AlertScheduler) Start() {
    // 每天凌晨2点执行预警检查
    cron := cron.New()
    cron.AddFunc("0 2 * * *", func() {
        s.checkAllSchoolsAlerts()
    })
    cron.Start()
}

func (s *AlertScheduler) checkAllSchoolsAlerts() {
    schools, err := s.svcCtx.SchoolsModel.FindAllActive(s.ctx)
    if err != nil {
        logx.Errorf("Failed to get active schools: %v", err)
        return
    }
    
    for _, school := range schools {
        logic := alert.NewBatchCheckAlertsLogic(s.ctx, s.svcCtx)
        err := logic.BatchCheckAlerts(school.Id)
        if err != nil {
            logx.Errorf("Failed to check alerts for school %d: %v", school.Id, err)
        }
    }
}
```

---

### 4.2.5 邀请码防重复生成

为了确保邀请码的唯一性，需要实现数据库和应用层面的双重保护机制。

#### 数据库层面保护

数据库表已包含 UNIQUE 约束，这是主要的防重复机制：

```sql
CREATE TABLE IF NOT EXISTS invite_codes (
    code VARCHAR(20) NOT NULL UNIQUE COMMENT '邀请码',
    -- ...
    UNIQUE KEY uk_code (code)  -- 防止重复的主要保障
)
```

#### 应用层面 - 改进的邀请码生成逻辑

```go
// internal/logic/teacher/generateinvitecodelogic.go
func (l *GenerateInviteCodeLogic) GenerateInviteCode(req *types.GenerateInviteCodeReq) (*types.GenerateInviteCodeResp, error) {
    // 1. 获取教师和学校信息
    teacher, err := l.svcCtx.TeachersModel.FindOne(l.ctx, l.ctx.Value("teacherId").(int64))
    if err != nil {
        return nil, errors.New("teacher not found")
    }
    
    school, err := l.svcCtx.SchoolsModel.FindOne(l.ctx, teacher.SchoolId)
    if err != nil {
        return nil, errors.New("school not found")
    }
    
    // 2. 生成唯一邀请码（带重试机制）
    var code string
    maxRetries := 3
    
    for i := 0; i < maxRetries; i++ {
        code = l.generateUniqueCode(school.Code)
        
        // 检查代码是否已存在
        exists, err := l.svcCtx.InviteCodesModel.CheckCodeExists(l.ctx, code)
        if err != nil {
            logx.Errorf("Failed to check code existence: %v", err)
            continue
        }
        
        if !exists {
            break // 找到唯一代码
        }
        
        if i == maxRetries-1 {
            return nil, errors.New("failed to generate unique code after multiple attempts")
        }
        
        logx.Infof("Code collision detected, retrying... (attempt %d/%d)", i+1, maxRetries)
    }
    
    // 3. 计算过期时间
    var expiresAt int64
    if req.ExpiresIn > 0 {
        expiresAt = time.Now().Add(time.Duration(req.ExpiresIn) * 24 * time.Hour).Unix()
    }
    
    // 4. 保存到数据库
    inviteCode := &model.InviteCodes{
        Code:      code,
        SchoolId:  teacher.SchoolId,
        TeacherId: teacher.Id,
        Type:      req.Type,
        MaxUses:   req.MaxUses,
        Status:    "active",
        ExpiresAt: expiresAt,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    result, err := l.svcCtx.InviteCodesModel.Insert(l.ctx, inviteCode)
    if err != nil {
        return nil, err
    }
    
    id, _ := result.LastInsertId()
    inviteCode.Id = id
    
    return &types.GenerateInviteCodeResp{
        Code:      inviteCode.Code,
        MaxUses:   inviteCode.MaxUses,
        UsedCount: inviteCode.UsedCount,
        ExpiresAt: inviteCode.ExpiresAt,
    }, nil
}

// 生成唯一邀请码
func (l *GenerateInviteCodeLogic) generateUniqueCode(schoolCode string) string {
    // 格式: SCHOOL-YYYYMMDD-XXXX
    // XXXX: 4字符随机字符串，使用[A-Z0-9]以提高可读性
    timestamp := time.Now().Format("20060102")
    randomPart := generateReadableRandomString(4)
    
    return fmt.Sprintf("%s-%s-%s", schoolCode, timestamp, randomPart)
}

// 生成可读性强的随机字符串
func generateReadableRandomString(length int) string {
    // 仅使用大写字母和数字，排除易混淆字符（I, O, 0, 1）
    charset := "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    b := make([]byte, length)
    for i := range b {
        n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
        b[i] = charset[n.Int64()]
    }
    return string(b)
}
```

#### Model 方法 - 检查代码是否存在

```go
// internal/model/invite_codes_model.go
func (m *customInviteCodesModel) CheckCodeExists(ctx context.Context, code string) (bool, error) {
    query := fmt.Sprintf("select count(*) from %s where `code` = ?", m.table)
    var count int
    err := m.conn.QueryRowCtx(ctx, &count, query, code)
    if err != nil {
        return false, err
    }
    return count > 0, nil
}
```

### 4.2.6 邀请码恢复机制

提供多种邀请码恢复选项，满足不同场景需求。

#### 选项A：重新激活已撤销/过期的邀请码

```go
// internal/logic/teacher/reactivateinvitecodelogic.go
func (l *ReactivateInviteCodeLogic) ReactivateInviteCode(req *types.ReactivateInviteCodeReq) (*types.ReactivateInviteCodeResp, error) {
    // 1. 查找邀请码
    inviteCode, err := l.svcCtx.InviteCodesModel.FindOneByCode(l.ctx, req.Code)
    if err != nil {
        return nil, errors.New("invite code not found")
    }
    
    // 2. 检查权限（仅创建者可重新激活）
    teacherId := l.ctx.Value("teacherId").(int64)
    if inviteCode.TeacherId != teacherId {
        return nil, errors.New("permission denied")
    }
    
    // 3. 重新激活
    inviteCode.Status = "active"
    
    // 4. 如需要，延长过期时间
    if req.ExtendDays > 0 {
        if inviteCode.ExpiresAt > 0 {
            inviteCode.ExpiresAt = time.Now().Add(time.Duration(req.ExtendDays) * 24 * time.Hour).Unix()
        }
    }
    
    // 5. 如需要，重置使用次数
    if req.ResetUsage {
        inviteCode.UsedCount = 0
    }
    
    inviteCode.UpdatedAt = time.Now().Unix()
    
    err = l.svcCtx.InviteCodesModel.Update(l.ctx, inviteCode)
    if err != nil {
        return nil, err
    }
    
    return &types.ReactivateInviteCodeResp{
        Code:       inviteCode.Code,
        Status:     inviteCode.Status,
        ExpiresAt:  inviteCode.ExpiresAt,
        UsedCount:  inviteCode.UsedCount,
    }, nil
}
```

#### 选项B：查看归档邀请码并从归档恢复

首先创建归档表：

```sql
CREATE TABLE IF NOT EXISTS invite_codes_archive (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    original_id BIGINT(20) NOT NULL COMMENT '原邀请码ID',
    code VARCHAR(20) NOT NULL,
    school_id BIGINT(20) NOT NULL,
    teacher_id BIGINT(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    max_uses INT NOT NULL,
    used_count INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    archive_reason VARCHAR(50) NOT NULL COMMENT '归档原因: revoked, expired, deleted',
    expires_at BIGINT(20) DEFAULT NULL,
    created_at BIGINT(20) NOT NULL,
    archived_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_code (code),
    KEY idx_school_id (school_id),
    KEY idx_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码归档表';
```

删除前归档：

```go
// internal/logic/teacher/deleteinvitecodelogic.go
func (l *DeleteInviteCodeLogic) DeleteInviteCode(id int64) error {
    // 1. 查找邀请码
    inviteCode, err := l.svcCtx.InviteCodesModel.FindOne(l.ctx, id)
    if err != nil {
        return err
    }
    
    // 2. 归档邀请码
    archived := &model.InviteCodesArchive{
        OriginalId:    inviteCode.Id,
        Code:          inviteCode.Code,
        SchoolId:      inviteCode.SchoolId,
        TeacherId:     inviteCode.TeacherId,
        Type:          inviteCode.Type,
        MaxUses:       inviteCode.MaxUses,
        UsedCount:     inviteCode.UsedCount,
        Status:        inviteCode.Status,
        ArchiveReason: "deleted",
        ExpiresAt:     inviteCode.ExpiresAt,
        CreatedAt:     inviteCode.CreatedAt,
        ArchivedAt:    time.Now().Unix(),
    }
    
    err = l.svcCtx.InviteCodesArchiveModel.Insert(l.ctx, archived)
    if err != nil {
        return err
    }
    
    // 3. 从主表删除
    return l.svcCtx.InviteCodesModel.Delete(l.ctx, id)
}
```

从归档恢复：

```go
// internal/logic/teacher/restoreinvitecodelogic.go
func (l *RestoreInviteCodeLogic) RestoreInviteCode(archiveId int64) (*types.RestoreInviteCodeResp, error) {
    // 1. 查找归档邀请码
    archived, err := l.svcCtx.InviteCodesArchiveModel.FindOne(l.ctx, archiveId)
    if err != nil {
        return nil, errors.New("archived code not found")
    }
    
    // 2. 检查活动表中是否已存在
    exists, err := l.svcCtx.InviteCodesModel.CheckCodeExists(l.ctx, archived.Code)
    if err != nil {
        return nil, err
    }
    if exists {
        return nil, errors.New("code already exists in active table")
    }
    
    // 3. 恢复到活动表
    inviteCode := &model.InviteCodes{
        Code:      archived.Code,
        SchoolId:  archived.SchoolId,
        TeacherId: archived.TeacherId,
        Type:      archived.Type,
        MaxUses:   archived.MaxUses,
        UsedCount: archived.UsedCount,
        Status:    "active", // 重置为活动状态
        ExpiresAt: archived.ExpiresAt,
        CreatedAt: archived.CreatedAt,
        UpdatedAt: time.Now().Unix(),
    }
    
    result, err := l.svcCtx.InviteCodesModel.Insert(l.ctx, inviteCode)
    if err != nil {
        return nil, err
    }
    
    id, _ := result.LastInsertId()
    
    // 4. 可选：从归档表删除
    // l.svcCtx.InviteCodesArchiveModel.Delete(l.ctx, archiveId)
    
    return &types.RestoreInviteCodeResp{
        Id:         id,
        Code:       inviteCode.Code,
        Status:     inviteCode.Status,
        RestoredAt: time.Now().Unix(),
    }, nil
}
```

#### 选项C：基于模式重新生成邀请码

```go
// internal/logic/teacher/regenerateinvitecodelogic.go
func (l *RegenerateInviteCodeLogic) RegenerateInviteCode(originalCode string) (*types.RegenerateInviteCodeResp, error) {
    // 1. 查找原始邀请码
    original, err := l.svcCtx.InviteCodesModel.FindOneByCode(l.ctx, originalCode)
    if err != nil {
        return nil, errors.New("original code not found")
    }
    
    // 2. 归档原始邀请码
    archived := &model.InviteCodesArchive{
        OriginalId:    original.Id,
        Code:          original.Code,
        SchoolId:      original.SchoolId,
        TeacherId:     original.TeacherId,
        Type:          original.Type,
        MaxUses:       original.MaxUses,
        UsedCount:     original.UsedCount,
        Status:        original.Status,
        ArchiveReason: "regenerated",
        ExpiresAt:     original.ExpiresAt,
        CreatedAt:     original.CreatedAt,
        ArchivedAt:    time.Now().Unix(),
    }
    l.svcCtx.InviteCodesArchiveModel.Insert(l.ctx, archived)
    
    // 3. 删除原始邀请码
    l.svcCtx.InviteCodesModel.Delete(l.ctx, original.Id)
    
    // 4. 使用相同设置生成新邀请码
    school, _ := l.svcCtx.SchoolsModel.FindOne(l.ctx, original.SchoolId)
    var newCode string
    maxRetries := 3
    
    for i := 0; i < maxRetries; i++ {
        newCode = generateUniqueCode(school.Code)
        exists, _ := l.svcCtx.InviteCodesModel.CheckCodeExists(l.ctx, newCode)
        if !exists {
            break
        }
    }
    
    // 5. 创建新邀请码
    newInviteCode := &model.InviteCodes{
        Code:      newCode,
        SchoolId:  original.SchoolId,
        TeacherId: original.TeacherId,
        Type:      original.Type,
        MaxUses:   original.MaxUses,
        UsedCount: 0, // 重置使用次数
        Status:    "active",
        ExpiresAt: original.ExpiresAt,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    result, err := l.svcCtx.InviteCodesModel.Insert(l.ctx, newInviteCode)
    if err != nil {
        return nil, err
    }
    
    id, _ := result.LastInsertId()
    
    return &types.RegenerateInviteCodeResp{
        Id:             id,
        OldCode:        originalCode,
        NewCode:        newCode,
        OriginalCodeId: original.Id,
    }, nil
}
```

#### API定义

```go
// api/teacher.api

// 重新激活邀请码
type (
    ReactivateInviteCodeReq {
        Code       string `json:"code,validate:"required"`
        ExtendDays int    `json:"extendDays,optional,validate:"omitempty,min=1,max=365"`
        ResetUsage bool   `json:"resetUsage,optional"`
    }
    ReactivateInviteCodeResp {
        Code      string `json:"code"`
        Status    string `json:"status"`
        ExpiresAt int64  `json:"expiresAt"`
        UsedCount int    `json:"usedCount"`
    }
)

@doc "重新激活邀请码"
@handler ReactivateInviteCode
put /teachers/invite-codes/reactivate (ReactivateInviteCodeReq) returns (ReactivateInviteCodeResp)

// 查看归档邀请码
type (
    GetArchivedInviteCodesReq {
        Page     int    `form:"page,default=1"`
        PageSize int    `form:"pageSize,default=10"`
        Reason   string `form:"reason,optional"` // revoked, expired, deleted
    }
    ArchivedInviteCode {
        Id            int64  `json:"id"`
        OriginalId    int64  `json:"originalId"`
        Code          string `json:"code"`
        ArchiveReason string `json:"archiveReason"`
        ArchivedAt    int64  `json:"archivedAt"`
    }
)

@doc "获取归档邀请码列表"
@handler GetArchivedInviteCodes
get /teachers/invite-codes/archive (GetArchivedInviteCodesReq)

// 从归档恢复
@doc "从归档恢复邀请码"
@handler RestoreInviteCode
post /teachers/invite-codes/restore/:archiveId returns (RestoreInviteCodeResp)

// 重新生成邀请码
@doc "重新生成邀请码"
@handler RegenerateInviteCode
post /teachers/invite-codes/regenerate returns (RegenerateInviteCodeResp)
```

---

## 五、前端实现

### 5.1 目录结构

```
src/pages/
├── Teacher/
│   ├── Dashboard/           # 教师仪表盘
│   │   └── index.tsx
│   ├── Students/            # 学生管理
│   │   ├── index.tsx        # 学生列表
│   │   └── Detail.tsx       # 学生详情
│   ├── InviteCodes/         # 邀请码管理
│   │   └── index.tsx
│   ├── Alerts/              # 预警管理
│   │   └── index.tsx
│   └── Reports/             # 报告中心
│       └── index.tsx
└── Student/
    └── Tasks/               # 学生任务中心
        └── index.tsx
```

### 5.2 教师仪表盘

```typescript
// src/pages/Teacher/Dashboard/index.tsx
export default function TeacherDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        lowCompletionStudents: 0,
        averageCompletion: 0,
    });
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboardStats();
        fetchRecentAlerts();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await teacherApi.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            message.error('获取统计数据失败');
        }
    };

    const fetchRecentAlerts = async () => {
        try {
            const response = await teacherApi.getRecentAlerts({ page: 1, pageSize: 5 });
            setRecentAlerts(response.data.list);
        } catch (error) {
            message.error('获取预警记录失败');
        }
    };

    return (
        <div className="teacher-dashboard">
            <h1>教师工作台</h1>
            
            {/* 统计卡片 */}
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card>
                        <Statistic title="总学生数" value={stats.totalStudents} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="活跃学生" value={stats.activeStudents} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic 
                            title="低完成度预警" 
                            value={stats.lowCompletionStudents}
                            valueStyle={{ color: stats.lowCompletionStudents > 0 ? '#ff4d4f' : '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic 
                            title="平均完成度" 
                            value={stats.averageCompletion}
                            suffix="%" 
                            precision={1}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 最近预警 */}
            <Card title="最近预警" style={{ marginTop: 24 }}>
                <Table
                    dataSource={recentAlerts}
                    columns={[
                        { title: '学生姓名', dataIndex: 'studentName' },
                        { title: '预警类型', dataIndex: 'alertType' },
                        { title: '预警级别', dataIndex: 'alertLevel' },
                        { title: '完成度', dataIndex: 'completionRate', render: (v) => `${v}%` },
                        { title: '创建时间', dataIndex: 'createdAt', render: (v) => formatTime(v) },
                        { 
                            title: '操作', 
                            render: (_, record) => (
                                <Space>
                                    <Button size="small" onClick={() => handleViewDetail(record)}>查看</Button>
                                    <Button size="small" type="primary" onClick={() => handleRemind(record)}>提醒</Button>
                                </Space>
                            )
                        },
                    ]}
                    pagination={false}
                />
            </Card>
        </div>
    );
}
```

### 5.3 邀请码管理页面

```typescript
// src/pages/Teacher/InviteCodes/index.tsx
export default function InviteCodesPage() {
    const [inviteCodes, setInviteCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchInviteCodes = async () => {
        setLoading(true);
        try {
            const response = await teacherApi.listInviteCodes({ page: 1, pageSize: 20 });
            setInviteCodes(response.data.list);
        } catch (error) {
            message.error('获取邀请码失败');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (values) => {
        try {
            await teacherApi.generateInviteCode(values);
            message.success('邀请码生成成功');
            setModalVisible(false);
            fetchInviteCodes();
        } catch (error) {
            message.error('生成失败');
        }
    };

    const handleRevoke = async (id) => {
        try {
            await teacherApi.revokeInviteCode(id);
            message.success('撤销成功');
            fetchInviteCodes();
        } catch (error) {
            message.error('撤销失败');
        }
    };

    return (
        <div className="invite-codes-page">
            <div className="page-header">
                <h1>邀请码管理</h1>
                <Button type="primary" onClick={() => setModalVisible(true)}>
                    生成邀请码
                </Button>
            </div>

            <Table
                loading={loading}
                dataSource={inviteCodes}
                columns={[
                    { title: '邀请码', dataIndex: 'code' },
                    { title: '类型', dataIndex: 'type' },
                    { title: '最大使用次数', dataIndex: 'maxUses' },
                    { title: '已使用次数', dataIndex: 'usedCount' },
                    { title: '状态', dataIndex: 'status', render: (v) => (
                        <Tag color={v === 'active' ? 'green' : 'red'}>
                            {v === 'active' ? '有效' : '失效'}
                        </Tag>
                    )},
                    { title: '过期时间', dataIndex: 'expiresAt', render: (v) => v ? formatTime(v) : '-' },
                    { title: '创建时间', dataIndex: 'createdAt', render: (v) => formatTime(v) },
                    {
                        title: '操作',
                        render: (_, record) => (
                            <Space>
                                <Button size="small" onClick={() => handleCopy(record.code)}>复制</Button>
                                {record.status === 'active' && (
                                    <Button size="small" danger onClick={() => handleRevoke(record.id)}>
                                        撤销
                                    </Button>
                                )}
                            </Space>
                        ),
                    },
                ]}
            />

            <GenerateInviteCodeModal
                visible={modalVisible}
                onOk={handleGenerate}
                onCancel={() => setModalVisible(false)}
            />
        </div>
    );
}
```

### 5.4 学生列表页面

```typescript
// src/pages/Teacher/Students/index.tsx
export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await teacherApi.listStudents(filters);
            setStudents(response.data.list);
        } catch (error) {
            message.error('获取学生列表失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <h1>学生管理</h1>
                <Space>
                    <Button onClick={() => handleExport()}>导出报告</Button>
                    <Button type="primary" onClick={() => handleBatchImport()}>
                        批量导入
                    </Button>
                </Space>
            </div>

            {/* 筛选器 */}
            <Card style={{ marginBottom: 16 }}>
                <Form layout="inline">
                    <Form.Item label="班级">
                        <Input placeholder="请输入班级" onChange={(e) => setFilters({...filters, className: e.target.value})} />
                    </Form.Item>
                    <Form.Item label="年级">
                        <Select placeholder="请选择年级" style={{ width: 120 }} onChange={(v) => setFilters({...filters, grade: v})}>
                            <Select.Option value="2021">2021级</Select.Option>
                            <Select.Option value="2022">2022级</Select.Option>
                            <Select.Option value="2023">2023级</Select.Option>
                            <Select.Option value="2024">2024级</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="状态">
                        <Select placeholder="请选择状态" style={{ width: 120 }} onChange={(v) => setFilters({...filters, status: v})}>
                            <Select.Option value="active">在读</Select.Option>
                            <Select.Option value="graduated">毕业</Select.Option>
                            <Select.Option value="transferred">转出</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={fetchStudents}>查询</Button>
                    </Form.Item>
                </Form>
            </Card>

            <Table
                loading={loading}
                dataSource={students}
                columns={[
                    { title: '姓名', dataIndex: 'name' },
                    { title: '班级', dataIndex: 'className' },
                    { title: '年级', dataIndex: 'grade' },
                    { 
                        title: '任务完成度', 
                        dataIndex: 'taskCompletionRate',
                        render: (v) => (
                            <Progress 
                                percent={Math.round(v)} 
                                status={v < 60 ? 'exception' : 'success'}
                                size="small"
                            />
                        ),
                    },
                    { title: '最后活动时间', dataIndex: 'lastActivityAt', render: (v) => formatTime(v) },
                    { title: '加入时间', dataIndex: 'joinedAt', render: (v) => formatTime(v) },
                    {
                        title: '操作',
                        render: (_, record) => (
                            <Space>
                                <Button size="small" onClick={() => handleViewDetail(record.id)}>详情</Button>
                                <Button size="small" onClick={() => handleRemind(record.id)}>提醒</Button>
                            </Space>
                        ),
                    },
                ]}
            />
        </div>
    );
}
```

### 5.5 预警管理页面

```typescript
// src/pages/Teacher/Alerts/index.tsx
export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await teacherApi.listAlerts({ page: 1, pageSize: 20 });
            setAlerts(response.data.list);
        } catch (error) {
            message.error('获取预警记录失败');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await teacherApi.resolveAlert(id);
            message.success('标记已解决');
            fetchAlerts();
        } catch (error) {
            message.error('操作失败');
        }
    };

    const handleIgnore = async (id) => {
        try {
            await teacherApi.ignoreAlert(id);
            message.success('已忽略');
            fetchAlerts();
        } catch (error) {
            message.error('操作失败');
        }
    };

    return (
        <div className="alerts-page">
            <h1>预警管理</h1>

            <Table
                loading={loading}
                dataSource={alerts}
                columns={[
                    { title: '学生姓名', dataIndex: 'studentName' },
                    { title: '班级', dataIndex: 'className' },
                    { title: '预警类型', dataIndex: 'alertType', render: (v) => {
                        const map = { low_completion: '低完成度', no_activity: '无活动', deadline_warning: '截止预警' };
                        return map[v] || v;
                    }},
                    { 
                        title: '预警级别', 
                        dataIndex: 'alertLevel',
                        render: (v) => {
                            const map = { critical: '严重', high: '高', medium: '中', low: '低' };
                            const colorMap = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };
                            return <Tag color={colorMap[v]}>{map[v] || v}</Tag>;
                        },
                    },
                    { title: '描述', dataIndex: 'description', ellipsis: true },
                    { 
                        title: '完成度', 
                        dataIndex: 'completionRate',
                        render: (v) => `${v}%`,
                    },
                    { 
                        title: '进度', 
                        render: (_, record) => `${record.completedTasks}/${record.totalTasks}`,
                    },
                    { title: '状态', dataIndex: 'status', render: (v) => {
                        const map = { pending: '待处理', resolved: '已解决', ignored: '已忽略' };
                        const colorMap = { pending: 'orange', resolved: 'green', ignored: 'gray' };
                        return <Tag color={colorMap[v]}>{map[v] || v}</Tag>;
                    }},
                    { title: '创建时间', dataIndex: 'createdAt', render: (v) => formatTime(v) },
                    {
                        title: '操作',
                        render: (_, record) => (
                            <Space>
                                {record.status === 'pending' && (
                                    <>
                                        <Button size="small" type="primary" onClick={() => handleResolve(record.id)}>
                                            已解决
                                        </Button>
                                        <Button size="small" onClick={() => handleIgnore(record.id)}>
                                            忽略
                                        </Button>
                                    </>
                                )}
                                <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
                            </Space>
                        ),
                    },
                ]}
            />
        </div>
    );
}
```

### 5.6 学生任务中心

```typescript
// src/pages/Student/Tasks/index.tsx
export default function StudentTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [totalCompletion, setTotalCompletion] = useState(0);

    useEffect(() => {
        fetchTaskProgress();
    }, []);

    const fetchTaskProgress = async () => {
        try {
            const response = await studentApi.getTaskProgress();
            setTasks(response.data.tasks);
            setTotalCompletion(response.data.totalCompletionRate);
        } catch (error) {
            message.error('获取任务进度失败');
        }
    };

    return (
        <div className="student-tasks-page">
            <h1>我的任务</h1>

            {/* 总进度 */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Progress 
                            type="circle" 
                            percent={Math.round(totalCompletion)}
                            format={percent => `${percent}%`}
                        />
                    </Col>
                    <Col span={12}>
                        <h3>8系列任务完成度</h3>
                        <p>完成所有任务以获得完整的职业规划报告</p>
                        {totalCompletion < 60 && (
                            <Alert 
                                message="您的完成度较低，请尽快完成任务" 
                                type="warning" 
                                showIcon 
                            />
                        )}
                    </Col>
                </Row>
            </Card>

            {/* 任务列表 */}
            <Card title="任务列表">
                <Row gutter={[16, 16]}>
                    {tasks.map(task => (
                        <Col span={6} key={task.taskSeriesId}>
                            <TaskCard task={task} />
                        </Col>
                    ))}
                </Row>
            </Card>
        </div>
    );
}

function TaskCard({ task }) {
    const getStatusColor = (status) => {
        const map = { completed: 'success', in_progress: 'processing', not_started: 'default' };
        return map[status] || 'default';
    };

    const getStatusText = (status) => {
        const map = { completed: '已完成', in_progress: '进行中', not_started: '未开始' };
        return map[status] || status;
    };

    return (
        <Card
            hoverable
            extra={<Tag color={getStatusColor(task.status)}>{getStatusText(task.status)}</Tag>}
        >
            <h3>{task.taskSeriesId}. {task.taskName}</h3>
            <Progress percent={Math.round(task.completionRate)} size="small" />
            {task.score && (
                <div style={{ marginTop: 8 }}>
                    <Tag color="blue">得分: {task.score}</Tag>
                </div>
            )}
            {task.status === 'not_started' && (
                <Button type="primary" size="small" style={{ marginTop: 12 }} block>
                    开始任务
                </Button>
            )}
        </Card>
    );
}
```

---

## 六、实施计划

### 第一阶段：基础功能开发（5-7天）

#### 后端开发
- [ ] 创建数据库表（schools, teachers, invite_codes, student_schools, student_task_progress, alert_records）
- [ ] 实现教师注册功能
- [ ] 实现邀请码生成和管理
- [ ] 实现学生使用邀请码注册
- [ ] 实现基础的学生查询功能

#### 前端开发
- [ ] 创建教师端页面结构
- [ ] 实现教师仪表盘
- [ ] 实现邀请码管理页面
- [ ] 实现学生列表页面

### 第二阶段：任务进度系统（4-5天）

#### 后端开发
- [ ] 定义8系列任务结构
- [ ] 实现任务完成度计算逻辑
- [ ] 实现任务进度跟踪
- [ ] 实现任务状态更新

#### 前端开发
- [ ] 实现学生任务中心页面
- [ ] 实现任务进度展示
- [ ] 实现任务状态更新

### 第三阶段：预警系统（3-4天）

#### 后端开发
- [ ] 实现预警检查逻辑
- [ ] 实现预警创建和更新
- [ ] 实现预警查询和管理
- [ ] 实现定时任务

#### 前端开发
- [ ] 实现预警管理页面
- [ ] 实现预警详情查看
- [ ] 实现预警提醒功能

### 第四阶段：高级功能（3-4天）

#### 后端开发
- [ ] 实现批量导入学生
- [ ] 实现导出学生进度报告
- [ ] 实现教师权限管理
- [ ] 实现通知系统

#### 前端开发
- [ ] 实现批量导入功能
- [ ] 实现导出报告功能
- [ ] 实现消息通知

### 第五阶段：测试和优化（2-3天）

- [ ] 功能测试
- [ ] 性能测试
- [ ] 用户体验优化
- [ ] Bug修复

**总计时间：17-23天**

---

## 七、测试计划

### 7.1 功能测试

#### 教师端功能
- [ ] 教师注册
- [ ] 生成邀请码
- [ ] 查询邀请码列表
- [ ] 撤销邀请码
- [ ] 查询学生列表
- [ ] 查询学生详情
- [ ] 查询预警列表
- [ ] 解决预警
- [ ] 忽略预警
- [ ] 提醒学生
- [ ] 批量导入学生
- [ ] 导出学生报告

#### 学生端功能
- [ ] 使用邀请码注册
- [ ] 查询任务进度
- [ ] 完成任务
- [ ] 查看任务完成度

### 7.2 预警系统测试
- [ ] 完成度低于60%时创建预警
- [ ] 预警级别正确计算
- [ ] 预警状态正确更新
- [ ] 定时任务正常执行
- [ ] 重复预警不创建

### 7.3 性能测试
- [ ] 大量学生查询性能
- [ ] 批量预警检查性能
- [ ] 邀请码验证性能

---

## 八、风险和注意事项

### 8.1 技术风险
- **数据一致性**: 学生任务进度需要实时更新，确保数据一致性
- **性能问题**: 批量检查预警可能影响性能，需要优化
- **并发问题**: 邀请码使用需要考虑并发安全

### 8.2 业务风险
- **邀请码泄露**: 需要限制邀请码的使用次数和有效期
- **预警误报**: 需要合理设置预警阈值
- **用户接受度**: 需要提供清晰的任务引导

### 8.3 安全考虑
- 邀请码需要足够复杂，防止暴力破解
- 教师权限需要严格控制
- 学生数据需要保护隐私

---

## 九、后续优化方向

1. **智能推荐**: 基于学生完成度推荐下一个任务
2. **学习路径**: 根据任务完成情况生成个性化学习路径
3. **数据可视化**: 提供更丰富的数据可视化图表
4. **消息通知**: 支持邮件、短信等多种通知方式
5. **数据分析**: 提供学校整体的数据分析报告
6. **家校联动**: 允许家长查看学生进度
7. **积分系统**: 完成任务获得积分，激励学生
8. **排名系统**: 班级、学校排名，增加竞争性

---

**文档版本**: v1.0  
**创建日期**: 2026-04-16  
**负责人**: 开发团队  
**状态**: 待实施