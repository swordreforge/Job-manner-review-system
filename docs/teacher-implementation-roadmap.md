# 教师端功能技术实施路线图

**文档类型**: 技术实施规范  
**制定人**: 技术总监  
**制定日期**: 2026-04-16  
**版本**: v1.1 (updated)  
**目标周期**: 17-23个工作日

---

## 当前实现状态 (2026-04-16)

### ✅ 已完成

| 功能 | 状态 | 说明 |
|------|------|------|
| 数据库表 | ✅ | schools, teachers, invite_codes, student_schools, student_task_progress, alert_records |
| 邀请码系统 | ✅ | CreateInviteCodeHandler, ListInviteCodesHandler, RevokeInviteCodeHandler |
| 学生列表/详情 | ✅ | ListSchoolStudentsHandler, GetStudentDetailHandler, GetStudentTasksHandler |
| 预警系统 | ✅ | ListAlertsHandler, ResolveAlertHandler, IgnoreAlertHandler, CheckAlertHandler |
| 消息系统 | ✅ | SendMessageHandler, ListMessagesHandler |
| 学生邀请注册 | ✅ | RegisterWithInviteHandler |

### ❌ 未完成/缺失

| 功能 | 状态 | 说明 |
|------|------|------|
| 教师注册 | ✅ | POST /teachers/register - 已实现 |
| 教师登录 | ✅ | 复用 user login (role=teacher) |
| 任务进度计算 | ✅ | 注册时初始化8个任务，完成测试时更新进度 |
| 前端页面 | ✅ | React 页面已创建 (Dashboard, Students, InviteCodes, Alerts) |

### 新增文件

```
后端:
internal/
├── handler/teacher/teacherregister.go      # 教师注册 handler
├── logic/teacher/teacherregisterlogic.go   # 教师注册逻辑
└── logic/student/initstudenttaskslogic.go  # 初始化学生8个任务

前端:
high-school-worker-design-forend/src/
├── api/index.ts                           # 添加 teacherApi
├── pages/Teacher/
│   ├── Dashboard.tsx                       # 教师工作台
│   ├── Students.tsx                       # 学生管理
│   ├── InviteCodes.tsx                    # 邀请码管理
│   └── Alerts.tsx                         # 预警管理
├── stores/index.ts                        # 添加 role 状态
└── components/SidebarNav/index.tsx        # 角色导航
```

### 当前代码位置

```
internal/
├── handler/
│   ├── teacher/invitecode.go      # 邀请码 handler
│   └── teacher/studenthandler.go  # 学生管理 handler
└── logic/teacher/
    ├── createinvitecode.go        # 创建邀请码逻辑
    ├── listinvitecodes.go         # 列表邀请码逻辑
    ├── revokeinvitecode.go        # 撤销邀请码逻辑
    ├── liststudentslogic.go       # 学生列表逻辑
    ├── getstudentlogic.go         # 学生详情逻辑
    ├── getstudenttaskslogic.go    # 学生任务逻辑
    ├── listalertlogic.go          # 预警列表逻辑
    ├── resolvealertlogic.go       # 解决预警逻辑
    ├── ignorealertlogic.go        # 忽略预警逻辑
    ├── checkalertlogic.go        # 检查预警逻辑
    ├── sendmessagelogic.go        # 发送消息逻辑
    └── listmessageslogic.go       # 消息列表逻辑
```

---

## 执行摘要

本文档为教师端功能开发提供详细的技术实施指南，包括邀请码系统、学生管理、任务进度追踪和预警系统四大核心功能。实施分为5个阶段，采用渐进式开发策略，确保每个阶段都有可交付成果。

### 核心技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| ID生成策略 | 数据库自增ID | 系统规模适中，避免过度设计 |
| 邀请码格式 | SCHOOL-YYYYMMDD-XXXX | 可读性强，便于管理 |
| 预警检查频率 | 每日凌晨2点 | 避免高峰期，数据及时性足够 |
| 前端框架 | React + Ant Design | 复用现有技术栈 |
| 状态管理 | Context API + Hooks | 中小规模应用，无需复杂状态管理 |

---

## 第一阶段：基础设施与核心功能（5-7天）

### 目标
建立数据模型，实现邀请码系统和基础的学生注册流程

### 技术任务清单

#### 任务1.1：数据库设计与创建（1天）

**负责人**: 后端工程师A  
**验收标准**: 所有表创建成功，外键关系正确

**实施步骤**:

```sql
-- 1. 创建学校表
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

-- 2. 创建教师表
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

-- 3. 创建邀请码表
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

-- 4. 创建邀请码归档表
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

-- 5. 创建学生-学校关联表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生-学校关联表';

-- 6. 修改users表
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT '角色: student, teacher, admin';
ALTER TABLE users ADD COLUMN school_id BIGINT(20) DEFAULT NULL COMMENT '关联学校ID' AFTER role;
ALTER TABLE users ADD KEY idx_school_id (school_id);

-- 7. 修改students表
ALTER TABLE students ADD COLUMN task_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '8系列任务总完成度' AFTER competitiveness_score;
ALTER TABLE students ADD COLUMN last_activity_at BIGINT(20) DEFAULT NULL COMMENT '最后活动时间' AFTER task_completion_rate;
```

**验证命令**:
```sql
-- 验证表结构
SHOW CREATE TABLE schools;
SHOW CREATE TABLE teachers;
SHOW CREATE TABLE invite_codes;

-- 验证外键关系
SELECT 
    TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM 
    information_schema.KEY_COLUMN_USAGE
WHERE 
    REFERENCED_TABLE_SCHEMA = 'career_db'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

#### 任务1.2：数据模型层实现（1天）

**负责人**: 后端工程师A  
**验收标准**: 所有Model文件生成完成，包含必要的自定义方法

**实施步骤**:

```bash
# 1. 生成基础Model文件
cd /path/to/project
goctl model mysql datasource -url="user:password@tcp(localhost:3306)/career_db" -table="schools,teachers,invite_codes,invite_codes_archive,student_schools" -dir="./internal/model"

# 2. 为每个表创建自定义Model文件
```

**核心Model代码**:

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

func (m *customInviteCodesModel) FindOneByCode(ctx context.Context, code string) (*InviteCodes, error) {
    query := fmt.Sprintf("select %s from %s where `code` = ? limit 1", inviteCodesRows, m.table)
    var resp InviteCodes
    err := m.conn.QueryRowCtx(ctx, &resp, query, code)
    switch err {
    case nil:
        return &resp, nil
    case sqlx.ErrNotFound:
        return nil, ErrNotFound
    default:
        return nil, err
    }
}

func (m *customInviteCodesModel) IncrementUsedCount(ctx context.Context, id int64) error {
    query := fmt.Sprintf("update %s set `used_count` = `used_count` + 1, `updated_at` = ? where `id` = ?", m.table)
    _, err := m.conn.ExecCtx(ctx, query, time.Now().Unix(), id)
    return err
}

func (m *customInviteCodesModel) FindBySchoolId(ctx context.Context, schoolId int64, page, pageSize int) ([]*InviteCodes, int64, error) {
    query := fmt.Sprintf("select %s from %s where `school_id` = ? order by `created_at` desc limit ? offset ?", inviteCodesRows, m.table)
    
    // 查询总数
    countQuery := fmt.Sprintf("select count(*) from %s where `school_id` = ?", m.table)
    var total int64
    err := m.conn.QueryRowCtx(ctx, &total, countQuery, schoolId)
    if err != nil {
        return nil, 0, err
    }
    
    // 查询数据
    offset := (page - 1) * pageSize
    var resp []*InviteCodes
    err = m.conn.QueryRowsCtx(ctx, &resp, query, schoolId, pageSize, offset)
    if err != nil {
        return nil, 0, err
    }
    
    return resp, total, nil
}
```

**单元测试**:
```go
// internal/model/invite_codes_model_test.go
func TestInviteCodesModel_CheckCodeExists(t *testing.T) {
    // 准备测试数据
    code := "TEST-CODE-001"
    
    // 测试不存在的代码
    exists, err := model.CheckCodeExists(context.Background(), code)
    assert.NoError(t, err)
    assert.False(t, exists)
    
    // 插入测试数据
    model.Insert(context.Background(), &model.InviteCodes{
        Code:      code,
        SchoolId:  1,
        TeacherId: 1,
        Status:    "active",
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    })
    
    // 测试存在的代码
    exists, err = model.CheckCodeExists(context.Background(), code)
    assert.NoError(t, err)
    assert.True(t, exists)
}
```

#### 任务1.3：API定义（0.5天）

**负责人**: 后端工程师A  
**验收标准**: API文件语法正确，通过goctl验证

**实施步骤**:

```go
// api/teacher.api
syntax = "v1"

type (
    // 教师注册
    TeacherRegisterReq {
        Username    string `json:"username,validate:"required,min=3,max=20"`
        Password    string `json:"password,validate:"required,min=6,max=20"`
        Email       string `json:"email,validate:"required,email"`
        Phone       string `json:"phone,optional,validate:"omitempty,len=11"`
        Name        string `json:"name,validate:"required,min=2,max=50"`
        SchoolCode  string `json:"schoolCode,validate:"required,len=6"`
        EmployeeId  string `json:"employeeId,optional,validate:"omitempty,max=20"`
        Department  string `json:"department,optional,validate:"omitempty,max=100"`
    }
    TeacherRegisterResp {
        Id       int64  `json:"id"`
        UserId   int64  `json:"userId"`
        Name     string `json:"name"`
        SchoolId int64  `json:"schoolId"`
    }

    // 生成邀请码
    GenerateInviteCodeReq {
        Type     string `json:"type,validate:"required,oneof=student teacher"`
        MaxUses  int    `json:"maxUses,validate:"required,min=1,max=1000"`
        ExpiresIn int   `json:"expiresIn,optional,validate:"omitempty,min=1,max=365"`
    }
    GenerateInviteCodeResp {
        Code      string `json:"code"`
        MaxUses   int    `json:"maxUses"`
        UsedCount int    `json:"usedCount"`
        ExpiresAt int64  `json:"expiresAt"`
    }

    // 邀请码列表
    InviteCodeListReq {
        Page     int    `form:"page,default=1,validate:"omitempty,min=1"`
        PageSize int    `form:"pageSize,default=10,validate:"omitempty,min=1,max=100"`
        Status   string `form:"status,optional,validate:"omitempty,oneof=active expired revoked"`
    }
    InviteCodeListResp {
        Total int64                `json:"total"`
        List  []InviteCodeInfo     `json:"list"`
    }
    InviteCodeInfo {
        Id        int64  `json:"id"`
        Code      string `json:"code"`
        Type      string `json:"type"`
        MaxUses   int    `json:"maxUses"`
        UsedCount int    `json:"usedCount"`
        Status    string `json:"status"`
        ExpiresAt int64  `json:"expiresAt"`
        CreatedAt int64  `json:"createdAt"`
    }

    // 学生使用邀请码注册
    StudentRegisterWithInviteReq {
        Username   string `json:"username,validate:"required,min=3,max=20"`
        Password   string `json:"password,validate:"required,min=6,max=20"`
        Email      string `json:"email,validate:"required,email"`
        Phone      string `json:"phone,optional,validate:"omitempty,len=11"`
        Name       string `json:"name,validate:"required,min=2,max=50"`
        InviteCode string `json:"inviteCode,validate:"required"`
    }
    StudentRegisterWithInviteResp {
        Id       int64  `json:"id"`
        UserId   int64  `json:"userId"`
        Name     string `json:"name"`
        SchoolId int64  `json:"schoolId"`
    }
)

@server (
    prefix: /api/v1
    group:  teacher
    middleware: AuthMiddleware
)
service career-api {
    @doc "教师注册"
    @handler TeacherRegister
    post /teachers/register (TeacherRegisterReq) returns (TeacherRegisterResp)

    @doc "生成邀请码"
    @handler GenerateInviteCode
    post /teachers/invite-codes (GenerateInviteCodeReq) returns (GenerateInviteCodeResp)

    @doc "查询邀请码列表"
    @handler ListInviteCodes
    get /teachers/invite-codes (InviteCodeListReq) returns (InviteCodeListResp)

    @doc "撤销邀请码"
    @handler RevokeInviteCode
    delete /teachers/invite-codes/:id

    @doc "学生使用邀请码注册"
    @handler StudentRegisterWithInvite
    post /students/register-with-invite (StudentRegisterWithInviteReq) returns (StudentRegisterWithInviteResp)
}
```

**验证命令**:
```bash
goctl api validate -api api/teacher.api
```

#### 任务1.4：邀请码生成逻辑（1天）

**负责人**: 后端工程师A  
**验收标准**: 生成唯一邀请码，支持重试机制

**核心代码**:

```go
// internal/logic/teacher/generateinvitecodelogic.go
func (l *GenerateInviteCodeLogic) GenerateInviteCode(req *types.GenerateInviteCodeReq) (*types.GenerateInviteCodeResp, error) {
    // 1. 获取教师信息
    teacherId := l.ctx.Value("teacherId").(int64)
    teacher, err := l.svcCtx.TeachersModel.FindOneByUserId(l.ctx, teacherId)
    if err != nil {
        logx.Errorf("Failed to find teacher: %v", err)
        return nil, errors.New("teacher not found")
    }
    
    // 2. 获取学校信息
    school, err := l.svcCtx.SchoolsModel.FindOne(l.ctx, teacher.SchoolId)
    if err != nil {
        logx.Errorf("Failed to find school: %v", err)
        return nil, errors.New("school not found")
    }
    
    // 3. 生成唯一邀请码（带重试机制）
    code, err := l.generateUniqueCodeWithRetry(school.Code, 3)
    if err != nil {
        logx.Errorf("Failed to generate unique code: %v", err)
        return nil, err
    }
    
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
        logx.Errorf("Failed to insert invite code: %v", err)
        return nil, err
    }
    
    id, _ := result.LastInsertId()
    inviteCode.Id = id
    
    logx.Infof("Generated invite code: %s by teacher %d", code, teacherId)
    
    return &types.GenerateInviteCodeResp{
        Code:      inviteCode.Code,
        MaxUses:   inviteCode.MaxUses,
        UsedCount: inviteCode.UsedCount,
        ExpiresAt: inviteCode.ExpiresAt,
    }, nil
}

func (l *GenerateInviteCodeLogic) generateUniqueCodeWithRetry(schoolCode string, maxRetries int) (string, error) {
    for i := 0; i < maxRetries; i++ {
        code := l.generateUniqueCode(schoolCode)
        
        // 检查代码是否已存在
        exists, err := l.svcCtx.InviteCodesModel.CheckCodeExists(l.ctx, code)
        if err != nil {
            logx.Errorf("Failed to check code existence: %v", err)
            continue
        }
        
        if !exists {
            return code, nil // 找到唯一代码
        }
        
        logx.Infof("Code collision detected: %s, retrying... (attempt %d/%d)", code, i+1, maxRetries)
    }
    
    return "", errors.New("failed to generate unique code after multiple attempts")
}

func (l *GenerateInviteCodeLogic) generateUniqueCode(schoolCode string) string {
    // 格式: SCHOOL-YYYYMMDD-XXXX
    // XXXX: 4字符随机字符串，使用[A-Z0-9]以提高可读性
    timestamp := time.Now().Format("20060102")
    randomPart := l.generateReadableRandomString(4)
    
    return fmt.Sprintf("%s-%s-%s", schoolCode, timestamp, randomPart)
}

func (l *GenerateInviteCodeLogic) generateReadableRandomString(length int) string {
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

**单元测试**:
```go
// internal/logic/teacher/generateinvitecodelogic_test.go
func TestGenerateInviteCode_UniqueCode(t *testing.T) {
    // 生成100个邀请码，验证唯一性
    codes := make(map[string]bool)
    
    for i := 0; i < 100; i++ {
        code := generateUniqueCode("TEST001")
        
        // 验证格式
        assert.Regexp(t, `^TEST001-\d{8}-[A-Z0-9]{4}$`, code)
        
        // 验证唯一性
        assert.False(t, codes[code], "Duplicate code generated: %s", code)
        codes[code] = true
    }
    
    assert.Equal(t, 100, len(codes))
}

func TestGenerateInviteCode_CollisionHandling(t *testing.T) {
    // 模拟碰撞场景
    logic := &GenerateInviteCodeLogic{}
    
    // 第一次生成成功
    code1, err := logic.generateUniqueCodeWithRetry("TEST001", 3)
    assert.NoError(t, err)
    
    // 插入到数据库（模拟）
    // ...
    
    // 第二次生成应该能处理碰撞
    code2, err := logic.generateUniqueCodeWithRetry("TEST001", 3)
    assert.NoError(t, err)
    assert.NotEqual(t, code1, code2)
}
```

#### 任务1.5：教师注册逻辑（1天）

**负责人**: 后端工程师A  
**验收标准**: 教师注册成功，数据关联正确

**核心代码**:

```go
// internal/logic/teacher/teacherregisterlogic.go
func (l *TeacherRegisterLogic) TeacherRegister(req *types.TeacherRegisterReq) (*types.TeacherRegisterResp, error) {
    // 1. 验证学校代码
    school, err := l.svcCtx.SchoolsModel.FindOneByCode(l.ctx, req.SchoolCode)
    if err != nil {
        logx.Errorf("School not found: %s", req.SchoolCode)
        return nil, errors.New("invalid school code")
    }
    
    if school.Status != "active" {
        return nil, errors.New("school is not active")
    }
    
    // 2. 检查用户名是否已存在
    _, err = l.svcCtx.UsersModel.FindOneByUsername(l.ctx, req.Username)
    if err == nil {
        return nil, errors.New("username already exists")
    }
    
    // 3. 密码加密
    hashedPassword, err := common.HashPassword(req.Password)
    if err != nil {
        logx.Errorf("Failed to hash password: %v", err)
        return nil, err
    }
    
    // 4. 创建用户
    user := &model.Users{
        Username: req.Username,
        Password: hashedPassword,
        Email:    req.Email,
        Phone:    req.Phone,
        Role:     "teacher",
        SchoolId: &school.Id,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    userResult, err := l.svcCtx.UsersModel.Insert(l.ctx, user)
    if err != nil {
        logx.Errorf("Failed to create user: %v", err)
        return nil, err
    }
    
    userId, _ := userResult.LastInsertId()
    user.Id = userId
    
    // 5. 创建教师记录
    teacher := &model.Teachers{
        UserId:     userId,
        SchoolId:   school.Id,
        Name:       req.Name,
        EmployeeId: req.EmployeeId,
        Department: req.Department,
        Phone:      req.Phone,
        Status:     "active",
        CreatedAt:  time.Now().Unix(),
        UpdatedAt:  time.Now().Unix(),
    }
    
    teacherResult, err := l.svcCtx.TeachersModel.Insert(l.ctx, teacher)
    if err != nil {
        logx.Errorf("Failed to create teacher: %v", err)
        // 回滚用户创建
        l.svcCtx.UsersModel.Delete(l.ctx, userId)
        return nil, err
    }
    
    teacherId, _ := teacherResult.LastInsertId()
    teacher.Id = teacherId
    
    // 6. 生成JWT Token
    token, err := common.GenerateToken(userId, req.Username, "teacher", l.svcCtx.Config.Auth.AccessSecret, l.svcCtx.Config.Auth.AccessExpire)
    if err != nil {
        logx.Errorf("Failed to generate token: %v", err)
        return nil, err
    }
    
    logx.Infof("Teacher registered successfully: %s (ID: %d)", req.Username, teacherId)
    
    return &types.TeacherRegisterResp{
        Id:       teacher.Id,
        UserId:   userId,
        Name:     req.Name,
        SchoolId: school.Id,
        Token:    token, // 返回token供前端使用
    }, nil
}
```

#### 任务1.6：学生邀请码注册逻辑（1天）

**负责人**: 后端工程师A  
**验收标准**: 学生注册成功，邀请码使用次数正确更新

**核心代码**:

```go
// internal/logic/student/studentregisterwithinvitelogic.go
func (l *StudentRegisterWithInviteLogic) StudentRegisterWithInvite(req *types.StudentRegisterWithInviteReq) (*types.StudentRegisterWithInviteResp, error) {
    // 1. 验证邀请码
    inviteCode, err := l.svcCtx.InviteCodesModel.FindOneByCode(l.ctx, req.InviteCode)
    if err != nil {
        logx.Errorf("Invalid invite code: %s", req.InviteCode)
        return nil, errors.New("invalid invite code")
    }
    
    // 2. 检查邀请码状态
    if inviteCode.Status != "active" {
        return nil, errors.New("invite code is not active")
    }
    
    // 3. 检查邀请码是否过期
    if inviteCode.ExpiresAt > 0 && inviteCode.ExpiresAt < time.Now().Unix() {
        return nil, errors.New("invite code has expired")
    }
    
    // 4. 检查使用次数
    if inviteCode.UsedCount >= inviteCode.MaxUses {
        return nil, errors.New("invite code has reached maximum usage")
    }
    
    // 5. 检查邀请码类型
    if inviteCode.Type != "student" {
        return nil, errors.New("invite code is not for student registration")
    }
    
    // 6. 检查用户名是否已存在
    _, err = l.svcCtx.UsersModel.FindOneByUsername(l.ctx, req.Username)
    if err == nil {
        return nil, errors.New("username already exists")
    }
    
    // 7. 密码加密
    hashedPassword, err := common.HashPassword(req.Password)
    if err != nil {
        logx.Errorf("Failed to hash password: %v", err)
        return nil, err
    }
    
    // 8. 创建用户
    user := &model.Users{
        Username: req.Username,
        Password: hashedPassword,
        Email:    req.Email,
        Phone:    req.Phone,
        Role:     "student",
        SchoolId: &inviteCode.SchoolId,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    userResult, err := l.svcCtx.UsersModel.Insert(l.ctx, user)
    if err != nil {
        logx.Errorf("Failed to create user: %v", err)
        return nil, err
    }
    
    userId, _ := userResult.LastInsertId()
    user.Id = userId
    
    // 9. 创建学生记录
    student := &model.Students{
        UserId:   userId,
        Name:     req.Name,
        Education: "bachelor", // 默认值
        Major:    "", // 待补充
        GraduationYear: sql.NullInt64{Int64: 2024, Valid: true},
        Skills:    "{}",
        Certificates: "{}",
        SoftSkills: "{}",
        Internship: "{}",
        Projects: "{}",
        CompletenessScore: 0,
        CompetitivenessScore: 0,
        TaskCompletionRate: 0,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    studentResult, err := l.svcCtx.StudentsModel.Insert(l.ctx, student)
    if err != nil {
        logx.Errorf("Failed to create student: %v", err)
        // 回滚用户创建
        l.svcCtx.UsersModel.Delete(l.ctx, userId)
        return nil, err
    }
    
    studentId, _ := studentResult.LastInsertId()
    student.Id = studentId
    
    // 10. 创建学生-学校关联
    studentSchool := &model.StudentSchools{
        StudentId:     studentId,
        SchoolId:      inviteCode.SchoolId,
        InviteCodeId:  &inviteCode.Id,
        Status:        "active",
        JoinedAt:      time.Now().Unix(),
        CreatedAt:     time.Now().Unix(),
        UpdatedAt:     time.Now().Unix(),
    }
    
    _, err = l.svcCtx.StudentSchoolsModel.Insert(l.ctx, studentSchool)
    if err != nil {
        logx.Errorf("Failed to create student-school relation: %v", err)
        // 回滚
        l.svcCtx.StudentsModel.Delete(l.ctx, studentId)
        l.svcCtx.UsersModel.Delete(l.ctx, userId)
        return nil, err
    }
    
    // 11. 更新邀请码使用次数
    err = l.svcCtx.InviteCodesModel.IncrementUsedCount(l.ctx, inviteCode.Id)
    if err != nil {
        logx.Errorf("Failed to increment invite code usage: %v", err)
        // 不影响注册，只记录错误
    }
    
    // 12. 检查邀请码是否达到最大使用次数
    updatedCode, _ := l.svcCtx.InviteCodesModel.FindOne(l.ctx, inviteCode.Id)
    if updatedCode.UsedCount >= updatedCode.MaxUses {
        updatedCode.Status = "expired"
        updatedCode.UpdatedAt = time.Now().Unix()
        l.svcCtx.InviteCodesModel.Update(l.ctx, updatedCode)
    }
    
    // 13. 生成JWT Token
    token, err := common.GenerateToken(userId, req.Username, "student", l.svcCtx.Config.Auth.AccessSecret, l.svcCtx.Config.Auth.AccessExpire)
    if err != nil {
        logx.Errorf("Failed to generate token: %v", err)
        return nil, err
    }
    
    logx.Infof("Student registered with invite code: %s (ID: %d)", req.InviteCode, studentId)
    
    return &types.StudentRegisterWithInviteResp{
        Id:       student.Id,
        UserId:   userId,
        Name:     req.Name,
        SchoolId: inviteCode.SchoolId,
        Token:    token,
    }, nil
}
```

#### 任务1.7：基础前端页面（1天）

**负责人**: 前端工程师A  
**验收标准**: 教师仪表盘和邀请码管理页面可用

**目录结构创建**:
```bash
mkdir -p src/pages/Teacher/{Dashboard,InviteCodes}
mkdir -p src/api/teacher
```

**API封装**:

```typescript
// src/api/teacher/invite.ts
import request from '@/utils/request';

export const teacherApi = {
  // 教师注册
  register: (data: TeacherRegisterReq) => 
    request.post<TeacherRegisterResp>('/teachers/register', data),

  // 生成邀请码
  generateInviteCode: (data: GenerateInviteCodeReq) =>
    request.post<GenerateInviteCodeResp>('/teachers/invite-codes', data),

  // 查询邀请码列表
  listInviteCodes: (params: InviteCodeListReq) =>
    request.get<InviteCodeListResp>('/teachers/invite-codes', { params }),

  // 撤销邀请码
  revokeInviteCode: (id: number) =>
    request.delete(`/teachers/invite-codes/${id}`),
};
```

**教师仪表盘页面**:

```typescript
// src/pages/Teacher/Dashboard/index.tsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalInviteCodes: 0,
    activeInviteCodes: 0,
    totalStudents: 0,
    usedInviteCodes: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await teacherApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="teacher-dashboard">
      <h1>教师工作台</h1>
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="邀请码总数" value={stats.totalInviteCodes} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="有效邀请码" 
              value={stats.activeInviteCodes}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="学生总数" value={stats.totalStudents} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已使用次数" 
              value={stats.usedInviteCodes}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

**邀请码管理页面**:

```typescript
// src/pages/Teacher/InviteCodes/index.tsx
import React, { useEffect, useState } from 'react';
import { 
  Button, Table, Modal, Form, Input, Select, InputNumber, 
  message, Space, Tag 
} from 'antd';

export default function InviteCodesPage() {
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const fetchInviteCodes = async () => {
    setLoading(true);
    try {
      const response = await teacherApi.listInviteCodes({ 
        page: 1, 
        pageSize: 20 
      });
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
      form.resetFields();
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

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    message.success('复制成功');
  };

  const columns = [
    { title: '邀请码', dataIndex: 'code', key: 'code' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type) => type === 'student' ? '学生' : '教师'
    },
    { title: '最大使用', dataIndex: 'maxUses', key: 'maxUses' },
    { title: '已使用', dataIndex: 'usedCount', key: 'usedCount' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = { active: 'green', expired: 'red', revoked: 'orange' };
        const textMap = { active: '有效', expired: '已过期', revoked: '已撤销' };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      }
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt) => expiresAt ? new Date(expiresAt * 1000).toLocaleString() : '永不过期'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleCopy(record.code)}>
            复制
          </Button>
          {record.status === 'active' && (
            <Button 
              size="small" 
              danger 
              onClick={() => handleRevoke(record.id)}
            >
              撤销
            </Button>
          )}
        </Space>
      )
    }
  ];

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
        columns={columns}
        rowKey="id"
      />

      <Modal
        title="生成邀请码"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} onFinish={handleGenerate} layout="vertical">
          <Form.Item
            label="邀请码类型"
            name="type"
            rules={[{ required: true, message: '请选择邀请码类型' }]}
          >
            <Select>
              <Select.Option value="student">学生邀请码</Select.Option>
              <Select.Option value="teacher">教师邀请码</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="最大使用次数"
            name="maxUses"
            rules={[{ required: true, message: '请输入最大使用次数' }]}
            initialValue={100}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="有效期（天）"
            name="expiresIn"
            initialValue={30}
          >
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

#### 任务1.8：集成测试（0.5天）

**负责人**: 后端工程师A + 前端工程师A  
**验收标准**: 完整流程测试通过

**测试用例**:

```go
// internal/logic/integration_test.go
func TestTeacherInviteCodeFlow(t *testing.T) {
    // 1. 创建测试学校
    school := &model.Schools{
        Name:      "测试学校",
        Code:      "TEST001",
        Status:    "active",
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    schoolModel.Insert(context.Background(), school)
    
    // 2. 教师注册
    teacherRegReq := &types.TeacherRegisterReq{
        Username:   "teacher001",
        Password:   "password123",
        Email:      "teacher@test.com",
        Name:       "测试老师",
        SchoolCode: "TEST001",
    }
    teacherResp, err := teacherLogic.TeacherRegister(teacherRegReq)
    assert.NoError(t, err)
    assert.NotZero(t, teacherResp.Id)
    
    // 3. 生成邀请码
    inviteCodeReq := &types.GenerateInviteCodeReq{
        Type:     "student",
        MaxUses:  10,
        ExpiresIn: 30,
    }
    
    // 设置教师上下文
    ctx := context.WithValue(context.Background(), "teacherId", teacherResp.UserId)
    logic := NewGenerateInviteCodeLogic(ctx, svcCtx)
    
    inviteCodeResp, err := logic.GenerateInviteCode(inviteCodeReq)
    assert.NoError(t, err)
    assert.NotEmpty(t, inviteCodeResp.Code)
    assert.Equal(t, 10, inviteCodeResp.MaxUses)
    
    // 4. 学生使用邀请码注册
    studentRegReq := &types.StudentRegisterWithInviteReq{
        Username:   "student001",
        Password:   "password123",
        Email:      "student@test.com",
        Name:       "测试学生",
        InviteCode: inviteCodeResp.Code,
    }
    
    studentResp, err := studentLogic.StudentRegisterWithInvite(studentRegReq)
    assert.NoError(t, err)
    assert.NotZero(t, studentResp.Id)
    
    // 5. 验证邀请码使用次数
    updatedCode, err := inviteCodeModel.FindOne(context.Background(), inviteCodeResp.Code)
    assert.NoError(t, err)
    assert.Equal(t, 1, updatedCode.UsedCount)
    
    // 6. 验证学生-学校关联
    studentSchool, err := studentSchoolModel.FindOneByStudentId(
        context.Background(), 
        studentResp.Id, 
        school.Id
    )
    assert.NoError(t, err)
    assert.Equal(t, "active", studentSchool.Status)
    
    // 清理测试数据
    // ...
}
```

### 第一阶段验收标准 (v1.1 Updated)

- [x] 所有数据库表创建成功，外键关系正确
- [x] 数据库表自动创建 (career.go 中定义)
- [x] 邀请码生成逻辑正常，支持重试机制
- [x] 邀请码管理 API (创建/列表/撤销) - 已实现
- [x] 学生列表/详情/任务 API - 已实现
- [x] 预警系统 API (列表/解决/忽略/检查) - 已实现
- [x] 消息系统 API - 已实现
- [x] 学生邀请码注册 API - 已实现
- [ ] 教师注册功能 - 缺失 (TODO: 实现)
- [ ] 前端教师仪表盘和邀请码管理页面 - 缺失 (TODO: 实现)

---

## 第二阶段：任务进度系统（4-5天）

### 目标
实现8系列任务定义、完成度计算和进度追踪

### 技术任务清单

#### 任务2.1：任务进度数据表（0.5天）

**负责人**: 后端工程师A  
**验收标准**: 表创建成功，索引正确

```sql
-- 创建学生任务进度表
CREATE TABLE IF NOT EXISTS student_task_progress (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    student_id BIGINT(20) NOT NULL COMMENT '学生ID',
    school_id BIGINT(20) NOT NULL COMMENT '学校ID',
    task_series_id INT NOT NULL COMMENT '任务系列ID (1-8)',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型',
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

#### 任务2.2：任务定义和初始化（1天）

**负责人**: 后端工程师A  
**验收标准**: 8个任务正确定义，自动初始化逻辑正常

**任务定义常量**:

```go
// internal/constants/tasks.go
package constants

const (
    TaskHollandTest = 1
    TaskStudentProfile = 2
    TaskResumeUpload = 3
    TaskSkillAssessment = 4
    TaskCareerReport = 5
    TaskInterviewSimulation = 6
    TaskJobMatching = 7
    TaskLearningPath = 8
)

type TaskDefinition struct {
    TaskSeriesId int
    TaskName     string
    TaskType     string
    Weight       float64 // 权重 12.5%
}

func GetTaskDefinitions() []TaskDefinition {
    return []TaskDefinition{
        {
            TaskSeriesId: TaskHollandTest,
            TaskName:     "霍兰德职业倾向测试",
            TaskType:     "holland_test",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskStudentProfile,
            TaskName:     "学生资料创建",
            TaskType:     "student_profile",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskResumeUpload,
            TaskName:     "简历上传与解析",
            TaskType:     "resume_upload",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskSkillAssessment,
            TaskName:     "技能评估",
            TaskType:     "skill_assessment",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskCareerReport,
            TaskName:     "职业规划报告生成",
            TaskType:     "career_report",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskInterviewSimulation,
            TaskName:     "模拟面试",
            TaskType:     "interview_simulation",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskJobMatching,
            TaskName:     "岗位匹配分析",
            TaskType:     "job_matching",
            Weight:       12.5,
        },
        {
            TaskSeriesId: TaskLearningPath,
            TaskName:     "学习路径规划",
            TaskType:     "learning_path",
            Weight:       12.5,
        },
    }
}

func GetTaskDefinition(taskSeriesId int) *TaskDefinition {
    definitions := GetTaskDefinitions()
    for _, def := range definitions {
        if def.TaskSeriesId == taskSeriesId {
            return &def
        }
    }
    return nil
}
```

**任务初始化逻辑**:

```go
// internal/logic/task/initprogresslogic.go
func (l *InitProgressLogic) InitializeStudentTasks(studentId, schoolId int64) error {
    // 1. 检查是否已初始化
    existingTasks, err := l.svcCtx.StudentTaskProgressModel.FindByStudentId(l.ctx, studentId, schoolId)
    if err != nil && err != model.ErrNotFound {
        return err
    }
    
    if len(existingTasks) >= 8 {
        return nil // 已经初始化过了
    }
    
    // 2. 获取任务定义
    taskDefinitions := constants.GetTaskDefinitions()
    
    // 3. 创建缺失的任务
    existingTaskMap := make(map[int]bool)
    for _, task := range existingTasks {
        existingTaskMap[task.TaskSeriesId] = true
    }
    
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
            
            _, err := l.svcCtx.StudentTaskProgressModel.Insert(l.ctx, task)
            if err != nil {
                logx.Errorf("Failed to initialize task %d for student %d: %v", 
                    def.TaskSeriesId, studentId, err)
                return err
            }
        }
    }
    
    logx.Infof("Initialized tasks for student %d", studentId)
    return nil
}
```

#### 任务2.3：完成度计算逻辑（1.5天）

**负责人**: 后端工程师A  
**验收标准**: 完成度计算准确，任务状态正确更新

**核心计算逻辑**:

```go
// internal/logic/task/calculatecompletionlogic.go
func (l *CalculateCompletionLogic) CalculateStudentCompletion(studentId, schoolId int64) (float64, error) {
    // 1. 确保任务已初始化
    err := l.initializeStudentTasks(studentId, schoolId)
    if err != nil {
        return 0, err
    }
    
    // 2. 查询所有任务进度
    tasks, err := l.svcCtx.StudentTaskProgressModel.FindByStudentId(l.ctx, studentId, schoolId)
    if err != nil {
        return 0, err
    }
    
    // 3. 计算每个任务的实际完成度
    taskMap := make(map[int]*model.StudentTaskProgress)
    for _, task := range tasks {
        actualRate := l.calculateTaskCompletion(task)
        task.CompletionRate = actualRate
        taskMap[task.TaskSeriesId] = task
        
        // 更新任务完成度
        err = l.svcCtx.StudentTaskProgressModel.UpdateCompletionRate(l.ctx, task.Id, actualRate)
        if err != nil {
            logx.Errorf("Failed to update task %d completion rate: %v", task.TaskSeriesId, err)
        }
    }
    
    // 4. 计算总完成度
    taskDefinitions := constants.GetTaskDefinitions()
    totalCompletion := 0.0
    
    for _, def := range taskDefinitions {
        if task, exists := taskMap[def.TaskSeriesId]; exists {
            totalCompletion += task.CompletionRate * def.Weight / 100
        }
    }
    
    totalCompletion = math.Round(totalCompletion*100) / 100 // 保留两位小数
    
    // 5. 更新学生总完成度
    err = l.svcCtx.StudentsModel.UpdateTaskCompletionRate(l.ctx, studentId, totalCompletion)
    if err != nil {
        logx.Errorf("Failed to update student completion rate: %v", err)
    }
    
    // 6. 更新最后活动时间
    err = l.svcCtx.StudentsModel.UpdateLastActivityAt(l.ctx, studentId, time.Now().Unix())
    if err != nil {
        logx.Errorf("Failed to update last activity time: %v", err)
    }
    
    return totalCompletion, nil
}

func (l *CalculateCompletionLogic) calculateTaskCompletion(task *model.StudentTaskProgress) float64 {
    switch task.TaskSeriesId {
    case constants.TaskHollandTest:
        return l.calculateHollandTestCompletion(task)
    case constants.TaskStudentProfile:
        return l.calculateStudentProfileCompletion(task)
    case constants.TaskResumeUpload:
        return l.calculateResumeUploadCompletion(task)
    case constants.TaskSkillAssessment:
        return l.calculateSkillAssessmentCompletion(task)
    case constants.TaskCareerReport:
        return l.calculateCareerReportCompletion(task)
    case constants.TaskInterviewSimulation:
        return l.calculateInterviewSimulationCompletion(task)
    case constants.TaskJobMatching:
        return l.calculateJobMatchingCompletion(task)
    case constants.TaskLearningPath:
        return l.calculateLearningPathCompletion(task)
    default:
        return 0.0
    }
}

// 霍兰德测试完成度计算
func (l *CalculateCompletionLogic) calculateHollandTestCompletion(task *model.StudentTaskProgress) float64 {
    if task.Status == "completed" {
        return 100.0
    }
    if task.Status == "in_progress" {
        return 50.0
    }
    return 0.0
}

// 学生资料完成度计算
func (l *CalculateCompletionLogic) calculateStudentProfileCompletion(task *model.StudentTaskProgress) float64 {
    student, err := l.svcCtx.StudentsModel.FindOne(l.ctx, task.StudentId)
    if err != nil {
        return 0.0
    }
    
    completion := 0.0
    
    // 基础信息完整 (40%)
    if student.Name != "" && student.Major != "" && student.GraduationYear.Valid {
        completion += 40.0
    }
    
    // 技能信息完整 (20%)
    if student.Skills != "" && student.Skills != "{}" {
        completion += 20.0
    }
    
    // 证书信息完整 (10%)
    if student.Certificates != "" && student.Certificates != "{}" {
        completion += 10.0
    }
    
    // 实习经历完整 (15%)
    if student.Internship != "" && student.Internship != "{}" {
        completion += 15.0
    }
    
    // 项目经验完整 (15%)
    if student.Projects != "" && student.Projects != "{}" {
        completion += 15.0
    }
    
    return completion
}

// 简历上传完成度计算
func (l *CalculateCompletionLogic) calculateResumeUploadCompletion(task *model.StudentTaskProgress) float64 {
    student, err := l.svcCtx.StudentsModel.FindOne(l.ctx, task.StudentId)
    if err != nil {
        return 0.0
    }
    
    completion := 0.0
    
    // 上传简历 (50%)
    if student.ResumeUrl != "" {
        completion += 50.0
    }
    
    // 解析成功 (50%)
    if student.ResumeContent != "" && student.ResumeContent != "{}" {
        completion += 50.0
    }
    
    return completion
}

// 技能评估完成度计算
func (l *CalculateCompletionLogic) calculateSkillAssessmentCompletion(task *model.StudentTaskProgress) float64 {
    if task.Status == "completed" {
        return 100.0
    }
    if task.Status == "in_progress" {
        return 50.0
    }
    return 0.0
}

// 职业规划报告完成度计算
func (l *CalculateCompletionLogic) calculateCareerReportCompletion(task *model.StudentTaskProgress) float64 {
    // 检查是否有职业规划报告
    reports, err := l.svcCtx.CareerReportsModel.FindByStudentId(l.ctx, task.StudentId)
    if err != nil || len(reports) == 0 {
        return 0.0
    }
    
    // 找到最新的报告
    latestReport := reports[0]
    if latestReport.Status == "completed" {
        return 100.0
    }
    if latestReport.Status == "draft" {
        return 50.0
    }
    return 0.0
}

// 模拟面试完成度计算
func (l *CalculateCompletionLogic) calculateInterviewSimulationCompletion(task *model.StudentTaskProgress) float64 {
    if task.Status == "completed" {
        return 100.0
    }
    if task.Status == "in_progress" {
        return 50.0
    }
    return 0.0
}

// 岗位匹配分析完成度计算
func (l *CalculateCompletionLogic) calculateJobMatchingCompletion(task *model.StudentTaskProgress) float64 {
    if task.Status == "completed" {
        return 100.0
    }
    if task.Status == "in_progress" {
        return 50.0
    }
    return 0.0
}

// 学习路径规划完成度计算
func (l *CalculateCompletionLogic) calculateLearningPathCompletion(task *model.StudentTaskProgress) float64 {
    if task.Status == "completed" {
        return 100.0
    }
    if task.Status == "in_progress" {
        return 50.0
    }
    return 0.0
}
```

#### 任务2.4：任务状态更新逻辑（1天）

**负责人**: 后端工程师A  
**验收标准**: 任务状态正确更新，完成度同步计算

```go
// internal/logic/task/updatetaskstatuslogic.go
func (l *UpdateTaskStatusLogic) UpdateTaskStatus(req *types.UpdateTaskStatusReq) (*types.UpdateTaskStatusResp, error) {
    // 1. 查找任务
    task, err := l.svcCtx.StudentTaskProgressModel.FindByStudentAndSeriesId(
        l.ctx, req.StudentId, req.SchoolId, req.TaskSeriesId)
    if err != nil {
        return nil, errors.New("task not found")
    }
    
    // 2. 更新任务状态
    task.Status = req.Status
    
    // 3. 更新时间戳
    now := time.Now().Unix()
    if req.Status == "in_progress" && task.StartedAt == 0 {
        task.StartedAt = now
    }
    if req.Status == "completed" {
        task.CompletedAt = now
        if req.Score != nil {
            task.Score = sql.NullFloat64{Float64: *req.Score, Valid: true}
        }
    }
    
    task.UpdatedAt = now
    
    // 4. 保存任务
    err = l.svcCtx.StudentTaskProgressModel.Update(l.ctx, task)
    if err != nil {
        return nil, err
    }
    
    // 5. 重新计算完成度
    completionRate, err := l.CalculateStudentCompletion(req.StudentId, req.SchoolId)
    if err != nil {
        logx.Errorf("Failed to calculate completion: %v", err)
    }
    
    logx.Infof("Updated task %d status to %s for student %d", 
        req.TaskSeriesId, req.Status, req.StudentId)
    
    return &types.UpdateTaskStatusResp{
        TaskSeriesId:   task.TaskSeriesId,
        Status:         task.Status,
        CompletionRate: completionRate,
    }, nil
}
```

#### 任务2.5：任务进度API（0.5天）

**负责人**: 后端工程师A  
**验收标准**: API定义正确，通过验证

```go
// api/task.api
type (
    // 查询任务进度
    GetTaskProgressReq {}
    GetTaskProgressResp {
        TotalCompletionRate float64          `json:"totalCompletionRate"`
        Tasks               []TaskProgressInfo `json:"tasks"`
    }
    TaskProgressInfo {
        TaskSeriesId   int     `json:"taskSeriesId"`
        TaskName       string  `json:"taskName"`
        TaskType       string  `json:"taskType"`
        Status         string  `json:"status"`
        CompletionRate float64 `json:"completionRate"`
        Score          *float64 `json:"score,omitempty"`
        StartedAt      *int64  `json:"startedAt,omitempty"`
        CompletedAt    *int64  `json:"completedAt,omitempty"`
    }

    // 更新任务状态
    UpdateTaskStatusReq {
        TaskSeriesId int     `json:"taskSeriesId,validate:"required,min=1,max=8"`
        Status       string  `json:"status,validate:"required,oneof=not_started in_progress completed skipped"`
        Score        *float64 `json:"score,optional,validate:"omitempty,min=0,max=100"`
    }
    UpdateTaskStatusResp {
        TaskSeriesId   int     `json:"taskSeriesId"`
        Status         string  `json:"status"`
        CompletionRate float64 `json:"completionRate"`
    }
)

@server (
    prefix: /api/v1
    group:  task
    middleware: AuthMiddleware
)
service career-api {
    @doc "查询任务进度"
    @handler GetTaskProgress
    get /students/tasks/progress (GetTaskProgressReq) returns (GetTaskProgressResp)

    @doc "更新任务状态"
    @handler UpdateTaskStatus
    put /students/tasks/status (UpdateTaskStatusReq) returns (UpdateTaskStatusResp)
}
```

#### 任务2.6：前端任务中心（1天）

**负责人**: 前端工程师A  
**验收标准**: 任务中心页面可用，进度显示正确

```typescript
// src/pages/Student/Tasks/index.tsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Tag, Button, Alert, Spin } from 'antd';
import { studentApi } from '@/api/student';

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [totalCompletion, setTotalCompletion] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTaskProgress();
  }, []);

  const fetchTaskProgress = async () => {
    setLoading(true);
    try {
      const response = await studentApi.getTaskProgress();
      setTasks(response.data.tasks);
      setTotalCompletion(response.data.totalCompletionRate);
    } catch (error) {
      console.error('Failed to fetch task progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

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
              strokeColor={totalCompletion < 60 ? '#ff4d4f' : '#52c41a'}
            />
          </Col>
          <Col span={12}>
            <h3>8系列任务完成度</h3>
            <p>完成所有任务以获得完整的职业规划报告</p>
            {totalCompletion < 60 && (
              <Alert 
                message="您的完成度较低，请尽快完成任务以提升竞争力" 
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
    const colorMap = { 
      completed: 'success', 
      in_progress: 'processing', 
      not_started: 'default',
      skipped: 'warning'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status) => {
    const textMap = { 
      completed: '已完成', 
      in_progress: '进行中', 
      not_started: '未开始',
      skipped: '已跳过'
    };
    return textMap[status] || status;
  };

  const getTaskRoute = (taskType) => {
    const routeMap = {
      holland_test: '/holland',
      student_profile: '/profile',
      resume_upload: '/resume',
      skill_assessment: '/profile',
      career_report: '/plan',
      interview_simulation: '/interview',
      job_matching: '/jobs',
      learning_path: '/plan',
    };
    return routeMap[taskType] || '/';
  };

  return (
    <Card
      hoverable
      extra={<Tag color={getStatusColor(task.status)}>{getStatusText(task.status)}</Tag>}
    >
      <h3>{task.taskSeriesId}. {task.taskName}</h3>
      <Progress 
        percent={Math.round(task.completionRate)} 
        size="small"
        status={task.completionRate < 60 ? 'exception' : 'normal'}
      />
      {task.score !== undefined && task.score !== null && (
        <div style={{ marginTop: 8 }}>
          <Tag color="blue">得分: {task.score}</Tag>
        </div>
      )}
      {task.status === 'not_started' && (
        <Button 
          type="primary" 
          size="small" 
          style={{ marginTop: 12 }} 
          block
          onClick={() => window.location.href = getTaskRoute(task.taskType)}
        >
          开始任务
        </Button>
      )}
    </Card>
  );
}
```

### 第二阶段验收标准

- [ ] 任务进度数据表创建成功
- [ ] 8个任务正确定义
- [ ] 任务自动初始化逻辑正常
- [ ] 完成度计算准确，各个任务计算逻辑正确
- [ ] 任务状态更新正常，完成度同步计算
- [ ] API定义正确，通过验证
- [ ] 前端任务中心页面可用，进度显示正确
- [ ] 集成测试通过
- [ ] 代码审查通过

---

## 第三阶段：预警系统（3-4天）

### 目标
实现预警检查、创建、管理和定时任务

### 技术任务清单

#### 任务3.1：预警数据表（0.5天）

**负责人**: 后端工程师A  
**验收标准**: 表创建成功，索引优化

```sql
-- 创建预警记录表
CREATE TABLE IF NOT EXISTS alert_records (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    student_id BIGINT(20) NOT NULL COMMENT '学生ID',
    school_id BIGINT(20) NOT NULL COMMENT '学校ID',
    teacher_id BIGINT(20) NOT NULL COMMENT '教师ID',
    alert_type VARCHAR(50) NOT NULL COMMENT '预警类型',
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

#### 任务3.2：预警检查逻辑（1.5天）

**负责人**: 后端工程师A  
**验收标准**: 预警创建逻辑正确，级别计算准确

```go
// internal/logic/alert/checkalertlogic.go
func (l *CheckAlertLogic) CheckAndCreateAlerts(studentId, schoolId, teacherId int64) error {
    // 1. 计算学生完成度
    completionRate, err := l.CalculateStudentCompletion(studentId, schoolId)
    if err != nil {
        logx.Errorf("Failed to calculate completion for student %d: %v", studentId, err)
        return err
    }
    
    // 2. 检查是否需要预警（完成度<60%）
    if completionRate < 60.0 {
        // 3. 检查是否已存在未解决的预警
        existingAlert, err := l.svcCtx.AlertRecordsModel.FindPendingAlert(
            l.ctx, studentId, schoolId, "low_completion")
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
        description := l.generateAlertDescription(completionRate, completedTasks)
        
        alert := &model.AlertRecords{
            StudentId:       studentId,
            SchoolId:        schoolId,
            TeacherId:       teacherId,
            AlertType:       "low_completion",
            AlertLevel:      alertLevel,
            Description:     description,
            CompletionRate:  completionRate,
            TotalTasks:      8,
            CompletedTasks:  completedTasks,
            Status:          "pending",
            CreatedAt:       time.Now().Unix(),
            UpdatedAt:       time.Now().Unix(),
        }
        
        err = l.svcCtx.AlertRecordsModel.Insert(l.ctx, alert)
        if err != nil {
            logx.Errorf("Failed to create alert for student %d: %v", studentId, err)
            return err
        }
        
        logx.Infof("Created %s alert for student %d (completion: %.2f%%)", 
            alertLevel, studentId, completionRate)
    }
    
    return nil
}

func (l *CheckAlertLogic) calculateAlertLevel(completionRate float64) string {
    if completionRate < 30 {
        return "critical" // 严重：<30%
    } else if completionRate < 45 {
        return "high"     // 高：30%-45%
    } else if completionRate < 60 {
        return "medium"   // 中：45%-60%
    }
    return "low"
}

func (l *CheckAlertLogic) generateAlertDescription(completionRate float64, completedTasks int) string {
    return fmt.Sprintf("8系列任务完成度低于60%%，当前完成度为%.2f%%，已完成%d/8个任务", 
        completionRate, completedTasks)
}

func (l *CheckAlertLogic) updateExistingAlert(alert *model.AlertRecords, completionRate float64) error {
    alert.CompletionRate = completionRate
    alert.Description = l.generateAlertDescription(completionRate, alert.CompletedTasks)
    alert.UpdatedAt = time.Now().Unix()
    
    // 重新计算已完成任务数
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

#### 任务3.3：批量预警检查（1天）

**负责人**: 后端工程师A  
**验收标准**: 批量检查逻辑正常，性能优化合理

```go
// internal/logic/alert/batchcheckalertslogic.go
func (l *BatchCheckAlertsLogic) BatchCheckAlerts(schoolId int64) error {
    // 1. 获取学校所有教师
    teachers, err := l.svcCtx.TeachersModel.FindBySchoolId(l.ctx, schoolId)
    if err != nil {
        logx.Errorf("Failed to find teachers for school %d: %v", schoolId, err)
        return err
    }
    
    if len(teachers) == 0 {
        return errors.New("no teachers found in this school")
    }
    
    // 2. 获取学校所有活跃学生
    students, err := l.svcCtx.StudentSchoolsModel.FindActiveStudentsBySchoolId(l.ctx, schoolId)
    if err != nil {
        logx.Errorf("Failed to find students for school %d: %v", schoolId, err)
        return err
    }
    
    logx.Infof("Starting batch alert check for school %d: %d students", schoolId, len(students))
    
    // 3. 为每个学生检查预警
    teacherId := teachers[0].Id // 使用第一个教师作为预警创建者
    alertCount := 0
    
    for _, studentSchool := range students {
        err := l.CheckAndCreateAlerts(studentSchool.StudentId, schoolId, teacherId)
        if err != nil {
            logx.Errorf("Failed to check alert for student %d: %v", studentSchool.StudentId, err)
        } else {
            alertCount++
        }
    }
    
    logx.Infof("Batch alert check completed for school %d: %d alerts processed", schoolId, alertCount)
    return nil
}
```

#### 任务3.4：定时任务（0.5天）

**负责人**: 后端工程师A  
**验收标准**: 定时任务正常执行，日志记录完整

```go
// internal/pkg/scheduler/alertscheduler.go
package scheduler

import (
    "context"
    "github.com/robfig/cron/v3"
    "career/internal/logic/alert"
    "career/internal/svc"
    "github.com/zeromicro/go-zero/core/logx"
)

type AlertScheduler struct {
    ctx    context.Context
    svcCtx *svc.ServiceContext
    cron   *cron.Cron
}

func NewAlertScheduler(ctx context.Context, svcCtx *svc.ServiceContext) *AlertScheduler {
    return &AlertScheduler{
        ctx:    ctx,
        svcCtx: svcCtx,
        cron:   cron.New(),
    }
}

func (s *AlertScheduler) Start() {
    // 每天凌晨2点执行预警检查
    _, err := s.cron.AddFunc("0 2 * * *", func() {
        s.checkAllSchoolsAlerts()
    })
    if err != nil {
        logx.Errorf("Failed to schedule alert check: %v", err)
        return
    }
    
    // 每周一上午9点执行预警检查（用于周报）
    _, err = s.cron.AddFunc("0 9 * * 1", func() {
        s.checkAllSchoolsAlerts()
    })
    if err != nil {
        logx.Errorf("Failed to schedule weekly alert check: %v", err)
        return
    }
    
    s.cron.Start()
    logx.Info("Alert scheduler started")
}

func (s *AlertScheduler) checkAllSchoolsAlerts() {
    logx.Info("Starting scheduled alert check for all schools")
    
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
    
    logx.Info("Scheduled alert check completed")
}

func (s *AlertScheduler) Stop() {
    s.cron.Stop()
    logx.Info("Alert scheduler stopped")
}
```

**集成到服务启动**:

```go
// internal/handler/schoolhandler.go 或 career.go
func StartAlertScheduler(svcCtx *svc.ServiceContext) {
    scheduler := scheduler.NewAlertScheduler(context.Background(), svcCtx)
    scheduler.Start()
    
    // 注册停止钩子
    // scheduler.Stop()
}
```

#### 任务3.5：预警管理API（0.5天）

**负责人**: 后端工程师A  
**验收标准**: API定义正确，功能完整

```go
// api/alert.api
type (
    // 查询预警列表
    AlertListReq {
        Page       int    `form:"page,default=1,validate:"omitempty,min=1"`
        PageSize   int    `form:"pageSize,default=10,validate:"omitempty,min=1,max=100"`
        AlertType  string `form:"alertType,optional,validate:"omitempty,oneof=low_completion no_activity deadline_warning"`
        AlertLevel string `form:"alertLevel,optional,validate:"omitempty,oneof=low medium high critical"`
        Status     string `form:"status,optional,validate:"omitempty,oneof=pending resolved ignored"`
    }
    AlertListResp {
        Total int64           `json:"total"`
        List  []AlertInfo     `json:"list"`
    }
    AlertInfo {
        Id             int64   `json:"id"`
        StudentId      int64   `json:"studentId"`
        StudentName    string  `json:"studentName"`
        ClassName      string  `json:"className"`
        AlertType      string  `json:"alertType"`
        AlertLevel     string  `json:"alertLevel"`
        Description    string  `json:"description"`
        CompletionRate float64 `json:"completionRate"`
        TotalTasks     int     `json:"totalTasks"`
        CompletedTasks int     `json:"completedTasks"`
        Status         string  `json:"status"`
        CreatedAt      int64   `json:"createdAt"`
    }

    // 解决预警
    ResolveAlertReq {}
    ResolveAlertResp {
        Id        int64 `json:"id"`
        Status    string `json:"status"`
        ResolvedAt int64 `json:"resolvedAt"`
    }

    // 忽略预警
    IgnoreAlertReq {}
    IgnoreAlertResp {
        Id        int64 `json:"id"`
        Status    string `json:"status"`
        UpdatedAt int64 `json:"updatedAt"`
    }
)

@server (
    prefix: /api/v1
    group:  alert
    middleware: AuthMiddleware
)
service career-api {
    @doc "查询预警列表"
    @handler ListAlerts
    get /teachers/alerts (AlertListReq) returns (AlertListResp)

    @doc "解决预警"
    @handler ResolveAlert
    put /teachers/alerts/:id/resolve (ResolveAlertReq) returns (ResolveAlertResp)

    @doc "忽略预警"
    @handler IgnoreAlert
    put /teachers/alerts/:id/ignore (IgnoreAlertReq) returns (IgnoreAlertResp)
}
```

#### 任务3.6：前端预警管理（1天）

**负责人**: 前端工程师A  
**验收标准**: 预警管理页面可用，操作正常

```typescript
// src/pages/Teacher/Alerts/index.tsx
import React, { useEffect, useState } from 'react';
import { 
  Table, Tag, Button, Space, Select, Card, message 
} from 'antd';
import { teacherApi } from '@/api/teacher';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await teacherApi.listAlerts({ 
        page: 1, 
        pageSize: 20,
        ...filters 
      });
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

  const columns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { 
      title: '预警类型', 
      dataIndex: 'alertType', 
      key: 'alertType',
      render: (type) => {
        const map = { 
          low_completion: '低完成度', 
          no_activity: '无活动', 
          deadline_warning: '截止预警' 
        };
        return map[type] || type;
      }
    },
    { 
      title: '预警级别', 
      dataIndex: 'alertLevel',
      key: 'alertLevel',
      render: (level) => {
        const map = { critical: '严重', high: '高', medium: '中', low: '低' };
        const colorMap = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };
        return <Tag color={colorMap[level]}>{map[level] || level}</Tag>;
      }
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { 
      title: '完成度', 
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => `${rate}%`
    },
    { 
      title: '进度', 
      key: 'progress',
      render: (_, record) => `${record.completedTasks}/${record.totalTasks}`
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const map = { pending: '待处理', resolved: '已解决', ignored: '已忽略' };
        const colorMap = { pending: 'orange', resolved: 'green', ignored: 'gray' };
        return <Tag color={colorMap[status]}>{map[status] || status}</Tag>;
      }
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (timestamp) => new Date(timestamp * 1000).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button 
                size="small" 
                type="primary" 
                onClick={() => handleResolve(record.id)}
              >
                已解决
              </Button>
              <Button 
                size="small" 
                onClick={() => handleIgnore(record.id)}
              >
                忽略
              </Button>
            </>
          )}
          <Button 
            size="small" 
            onClick={() => window.location.href = `/teacher/students/${record.studentId}`}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="alerts-page">
      <Card>
        <div className="page-header">
          <h1>预警管理</h1>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select 
              placeholder="预警类型" 
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, alertType: value })}
            >
              <Select.Option value="low_completion">低完成度</Select.Option>
              <Select.Option value="no_activity">无活动</Select.Option>
              <Select.Option value="deadline_warning">截止预警</Select.Option>
            </Select>
            <Select 
              placeholder="预警级别" 
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, alertLevel: value })}
            >
              <Select.Option value="critical">严重</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
            <Select 
              placeholder="状态" 
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
              <Select.Option value="ignored">已忽略</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          loading={loading}
          dataSource={alerts}
          columns={columns}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
```

### 第三阶段验收标准

- [ ] 预警数据表创建成功
- [ ] 预警检查逻辑正确，级别计算准确
- [ ] 批量预警检查正常，性能合理
- [ ] 定时任务正常执行，日志完整
- [ ] API定义正确，功能完整
- [ ] 前端预警管理页面可用，操作正常
- [ ] 集成测试通过
- [ ] 代码审查通过

---

## 第四阶段：高级功能（3-4天）

### 目标
实现批量导入、导出报告、教师权限管理和通知系统

### 技术任务清单

#### 任务4.1：学生管理API（1天）

**负责人**: 后端工程师A  
**验收标准**: API定义完整，功能正常

```go
// api/teacher.api（扩展）
type (
    // 查询学生列表
    StudentListReq {
        Page      int    `form:"page,default=1,validate:"omitempty,min=1"`
        PageSize  int    `form:"pageSize,default=10,validate:"omitempty,min=1,max=100"`
        ClassName string `form:"className,optional"`
        Grade     string `form:"grade,optional"`
        Status    string `form:"status,optional,validate:"omitempty,oneof=active graduated transferred"`
    }
    StudentListResp {
        Total int64           `json:"total"`
        List  []StudentInfo   `json:"list"`
    }
    StudentInfo {
        Id                int64   `json:"id"`
        Name              string  `json:"name"`
        Education         string  `json:"education"`
        Major             string  `json:"major"`
        ClassName         string  `json:"className"`
        Grade             string  `json:"grade"`
        TaskCompletionRate float64 `json:"taskCompletionRate"`
        LastActivityAt    int64   `json:"lastActivityAt"`
        JoinedAt          int64   `json:"joinedAt"`
    }

    // 查询学生详情
    StudentDetailResp {
        Id                int64                `json:"id"`
        Name              string               `json:"name"`
        Education         string               `json:"education"`
        Major             string               `json:"major"`
        ClassName         string               `json:"className"`
        Grade             string               `json:"grade"`
        TaskCompletionRate float64              `json:"taskCompletionRate"`
        LastActivityAt    int64                `json:"lastActivityAt"`
        Tasks             []TaskProgressInfo   `json:"tasks"`
    }

    // 批量导入学生
    BatchImportStudentsReq {
        Students []StudentImportInfo `json:"students,validate:"required,dive,required"`
    }
    StudentImportInfo {
        Name      string `json:"name,validate:"required,min=2,max=50"`
        Email     string `json:"email,validate:"required,email"`
        ClassName string `json:"className,validate:"required,max=50"`
        Grade     string `json:"grade,validate:"required,max=20"`
    }
    BatchImportStudentsResp {
        SuccessCount int      `json:"successCount"`
        FailedCount  int      `json:"failedCount"`
        FailedList   []string `json:"failedList"`
    }

    // 发送提醒
    SendReminderReq {
        Message string `json:"message,validate:"required,max=500"`
        Type    string `json:"type,validate:"required,oneof=task_reminder general"`
    }
    SendReminderResp {
        Success bool `json:"success"`
    }
)

@server (
    prefix: /api/v1
    group:  teacher
    middleware: AuthMiddleware
)
service career-api {
    @doc "查询学生列表"
    @handler ListStudents
    get /teachers/students (StudentListReq) returns (StudentListResp)

    @doc "查询学生详情"
    @handler GetStudentDetail
    get /teachers/students/:id returns (StudentDetailResp)

    @doc "批量导入学生"
    @handler BatchImportStudents
    post /teachers/students/batch-import (BatchImportStudentsReq) returns (BatchImportStudentsResp)

    @doc "发送提醒给学生"
    @handler SendReminder
    post /teachers/students/:id/remind (SendReminderReq) returns (SendReminderResp)
}
```

#### 任务4.2：批量导入逻辑（1天）

**负责人**: 后端工程师A  
**验收标准**: 批量导入正常，错误处理完善

```go
// internal/logic/teacher/batchimportstudentslogic.go
func (l *BatchImportStudentsLogic) BatchImportStudents(req *types.BatchImportStudentsReq) (*types.BatchImportStudentsResp, error) {
    teacherId := l.ctx.Value("teacherId").(int64)
    
    // 获取教师信息
    teacher, err := l.svcCtx.TeachersModel.FindOneByUserId(l.ctx, teacherId)
    if err != nil {
        return nil, errors.New("teacher not found")
    }
    
    successCount := 0
    failedCount := 0
    failedList := []string{}
    
    for _, studentInfo := range req.Students {
        err := l.importSingleStudent(studentInfo, teacher.SchoolId)
        if err != nil {
            failedCount++
            failedList = append(failedList, fmt.Sprintf("%s: %s", studentInfo.Name, err.Error()))
            logx.Errorf("Failed to import student %s: %v", studentInfo.Name, err)
        } else {
            successCount++
        }
    }
    
    logx.Infof("Batch import completed: %d success, %d failed", successCount, failedCount)
    
    return &types.BatchImportStudentsResp{
        SuccessCount: successCount,
        FailedCount:  failedCount,
        FailedList:   failedList,
    }, nil
}

func (l *BatchImportStudentsLogic) importSingleStudent(info types.StudentImportInfo, schoolId int64) error {
    // 1. 检查邮箱是否已存在
    _, err := l.svcCtx.UsersModel.FindOneByEmail(l.ctx, info.Email)
    if err == nil {
        return errors.New("email already exists")
    }
    
    // 2. 生成用户名（基于邮箱）
    username := strings.Split(info.Email, "@")[0]
    
    // 3. 生成随机密码
    password := generateRandomPassword(10)
    
    // 4. 密码加密
    hashedPassword, err := common.HashPassword(password)
    if err != nil {
        return err
    }
    
    // 5. 创建用户
    user := &model.Users{
        Username: username,
        Password: hashedPassword,
        Email:    info.Email,
        Role:     "student",
        SchoolId: &schoolId,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    userResult, err := l.svcCtx.UsersModel.Insert(l.ctx, user)
    if err != nil {
        return err
    }
    
    userId, _ := userResult.LastInsertId()
    user.Id = userId
    
    // 6. 创建学生记录
    student := &model.Students{
        UserId:   userId,
        Name:     info.Name,
        Education: "bachelor",
        Major:    "",
        GraduationYear: sql.NullInt64{Int64: 2024, Valid: true},
        Skills:    "{}",
        Certificates: "{}",
        SoftSkills: "{}",
        Internship: "{}",
        Projects: "{}",
        CompletenessScore: 0,
        CompetitivenessScore: 0,
        TaskCompletionRate: 0,
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    studentResult, err := l.svcCtx.StudentsModel.Insert(l.ctx, student)
    if err != nil {
        l.svcCtx.UsersModel.Delete(l.ctx, userId)
        return err
    }
    
    studentId, _ := studentResult.LastInsertId()
    student.Id = studentId
    
    // 7. 创建学生-学校关联
    studentSchool := &model.StudentSchools{
        StudentId: studentId,
        SchoolId:  schoolId,
        ClassName: info.ClassName,
        Grade:     info.Grade,
        Status:    "active",
        JoinedAt:  time.Now().Unix(),
        CreatedAt: time.Now().Unix(),
        UpdatedAt: time.Now().Unix(),
    }
    
    _, err = l.svcCtx.StudentSchoolsModel.Insert(l.ctx, studentSchool)
    if err != nil {
        l.svcCtx.StudentsModel.Delete(l.ctx, studentId)
        l.svcCtx.UsersModel.Delete(l.ctx, userId)
        return err
    }
    
    // 8. 初始化学生任务
    err = l.initializeStudentTasks(studentId, schoolId)
    if err != nil {
        logx.Errorf("Failed to initialize tasks for student %d: %v", studentId, err)
    }
    
    // 9. 发送欢迎邮件（可选）
    // l.sendWelcomeEmail(info.Email, username, password)
    
    return nil
}

func generateRandomPassword(length int) string {
    charset := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    b := make([]byte, length)
    for i := range b {
        n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
        b[i] = charset[n.Int64()]
    }
    return string(b)
}
```

#### 任务4.3：导出报告功能（1天）

**负责人**: 后端工程师A  
**验收标准**: 导出功能正常，格式正确

```go
// internal/logic/teacher/exportstudentslogic.go
func (l *ExportStudentsLogic) ExportStudents(format, className string) ([]byte, string, error) {
    teacherId := l.ctx.Value("teacherId").(int64)
    
    // 获取教师信息
    teacher, err := l.svcCtx.TeachersModel.FindOneByUserId(l.ctx, teacherId)
    if err != nil {
        return nil, "", errors.New("teacher not found")
    }
    
    // 查询学生列表
    students, err := l.svcCtx.StudentSchoolsModel.FindBySchoolIdWithFilters(
        l.ctx, teacher.SchoolId, className)
    if err != nil {
        return nil, "", err
    }
    
    // 根据格式生成报告
    switch strings.ToLower(format) {
    case "excel":
        return l.generateExcelReport(students)
    case "csv":
        return l.generateCSVReport(students)
    default:
        return nil, "", errors.New("unsupported format")
    }
}

func (l *ExportStudentsLogic) generateExcelReport(studentSchools []*model.StudentSchools) ([]byte, string, error) {
    f := excelize.NewFile()
    sheetName := "学生进度报告"
    
    // 创建工作表
    index, err := f.NewSheet(sheetName)
    if err != nil {
        return nil, "", err
    }
    f.SetActiveSheet(index)
    
    // 设置表头
    headers := []string{
        "学号", "姓名", "班级", "年级", "专业", "学历", 
        "任务完成度", "最后活动时间", "加入时间",
    }
    
    for i, header := range headers {
        cell, _ := excelize.CoordinatesToCellName(i+1, 1)
        f.SetCellValue(sheetName, cell, header)
    }
    
    // 填充数据
    for i, studentSchool := range studentSchools {
        student, _ := l.svcCtx.StudentsModel.FindOne(l.ctx, studentSchool.StudentId)
        
        data := []interface{}{
            studentSchool.StudentId,
            student.Name,
            studentSchool.ClassName,
            studentSchool.Grade,
            student.Major,
            student.Education,
            student.TaskCompletionRate,
            time.Unix(student.LastActivityAt, 0).Format("2006-01-02 15:04:05"),
            time.Unix(studentSchool.JoinedAt, 0).Format("2006-01-02 15:04:05"),
        }
        
        for j, value := range data {
            cell, _ := excelize.CoordinatesToCellName(j+1, i+2)
            f.SetCellValue(sheetName, cell, value)
        }
    }
    
    // 保存到buffer
    buffer, err := f.WriteToBuffer()
    if err != nil {
        return nil, "", err
    }
    
    filename := fmt.Sprintf("学生进度报告_%s.xlsx", time.Now().Format("20060102_150405"))
    
    return buffer.Bytes(), filename, nil
}

func (l *ExportStudentsLogic) generateCSVReport(studentSchools []*model.StudentSchools) ([]byte, string, error) {
    var buffer bytes.Buffer
    writer := csv.NewWriter(&buffer)
    
    // 写入表头
    headers := []string{
        "学号", "姓名", "班级", "年级", "专业", "学历", 
        "任务完成度", "最后活动时间", "加入时间",
    }
    writer.Write(headers)
    
    // 写入数据
    for _, studentSchool := range studentSchools {
        student, _ := l.svcCtx.StudentsModel.FindOne(l.ctx, studentSchool.StudentId)
        
        record := []string{
            fmt.Sprintf("%d", studentSchool.StudentId),
            student.Name,
            studentSchool.ClassName,
            studentSchool.Grade,
            student.Major,
            student.Education,
            fmt.Sprintf("%.2f", student.TaskCompletionRate),
            time.Unix(student.LastActivityAt, 0).Format("2006-01-02 15:04:05"),
            time.Unix(studentSchool.JoinedAt, 0).Format("2006-01-02 15:04:05"),
        }
        
        writer.Write(record)
    }
    
    writer.Flush()
    
    filename := fmt.Sprintf("学生进度报告_%s.csv", time.Now().Format("20060102_150405"))
    
    return buffer.Bytes(), filename, nil
}
```

#### 任务4.4：前端学生管理和导入（1天）

**负责人**: 前端工程师A  
**验收标准**: 学生列表页面可用，批量导入正常

```typescript
// src/pages/Teacher/Students/index.tsx
import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Space, Form, Input, Select, Card, 
  Modal, Upload, message, Progress, Row, Col 
} from 'antd';
import { UploadOutlined, ExportOutlined } from '@ant-design/icons';
import { teacherApi } from '@/api/teacher';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await teacherApi.listStudents({ 
        page: 1, 
        pageSize: 20,
        ...filters 
      });
      setStudents(response.data.list);
    } catch (error) {
      message.error('获取学生列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await teacherApi.exportStudents('excel', filters.className);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `学生进度报告_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleImport = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const response = await teacherApi.batchImportStudents({ students: data });
        
        if (response.data.failedCount === 0) {
          message.success(`成功导入${response.data.successCount}个学生`);
          setImportModalVisible(false);
          fetchStudents();
        } else {
          message.warning(`成功导入${response.data.successCount}个，失败${response.data.failedCount}个`);
        }
      } catch (error) {
        message.error('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const columns = [
    { title: '学号', dataIndex: 'id', key: 'id' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '专业', dataIndex: 'major', key: 'major' },
    { 
      title: '任务完成度', 
      dataIndex: 'taskCompletionRate',
      key: 'taskCompletionRate',
      render: (rate) => (
        <Progress 
          percent={Math.round(rate)} 
          status={rate < 60 ? 'exception' : 'success'}
          size="small"
        />
      )
    },
    { 
      title: '最后活动', 
      dataIndex: 'lastActivityAt',
      key: 'lastActivityAt',
      render: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => window.location.href = `/teacher/students/${record.id}`}>
            详情
          </Button>
          <Button size="small" onClick={() => handleRemind(record.id)}>
            提醒
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="students-page">
      <Card>
        <div className="page-header">
          <h1>学生管理</h1>
          <Space>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出报告
            </Button>
            <Button type="primary" onClick={() => setImportModalVisible(true)}>
              批量导入
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Form layout="inline">
            <Form.Item label="班级">
              <Input 
                placeholder="请输入班级" 
                onChange={(e) => setFilters({...filters, className: e.target.value})} 
              />
            </Form.Item>
            <Form.Item label="年级">
              <Select 
                placeholder="请选择年级" 
                style={{ width: 120 }}
                onChange={(value) => setFilters({...filters, grade: value})}
              >
                <Select.Option value="2021">2021级</Select.Option>
                <Select.Option value="2022">2022级</Select.Option>
                <Select.Option value="2023">2023级</Select.Option>
                <Select.Option value="2024">2024级</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={fetchStudents}>查询</Button>
            </Form.Item>
          </Form>
        </div>

        <Table
          loading={loading}
          dataSource={students}
          columns={columns}
          rowKey="id"
        />
      </Card>

      <Modal
        title="批量导入学生"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <p>请上传JSON格式的学生数据文件</p>
          <pre style={{ background: '#f5f5f5', padding: 8 }}>
{`[
  {
    "name": "张三",
    "email": "zhangsan@example.com",
    "className": "计算机1班",
    "grade": "2024"
  }
]`}
          </pre>
        </div>
        
        <Upload.Dragger
          accept=".json"
          beforeUpload={handleImport}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
}
```

### 第四阶段验收标准

- [ ] 学生管理API完整，功能正常
- [ ] 批量导入功能正常，错误处理完善
- [ ] 导出报告功能正常，格式正确
- [ ] 前端学生列表页面可用
- [ ] 前端批量导入功能正常
- [ ] 集成测试通过
- [ ] 代码审查通过

---

## 第五阶段：测试和优化（2-3天）

### 目标
全面测试功能，优化性能和用户体验

### 技术任务清单

#### 任务5.1：功能测试（1天）

**负责人**: 测试工程师 + 前端工程师A  
**验收标准**: 所有功能测试通过

**测试用例清单**:

```
教师端功能测试用例:
✓ TC-T-001: 教师注册 - 正常流程
✓ TC-T-002: 教师注册 - 学校代码无效
✓ TC-T-003: 教师注册 - 用户名重复
✓ TC-T-004: 生成邀请码 - 正常流程
✓ TC-T-005: 生成邀请码 - 碰撞重试
✓ TC-T-006: 查询邀请码列表
✓ TC-T-007: 撤销邀请码
✓ TC-T-008: 查询学生列表
✓ TC-T-009: 查询学生详情
✓ TC-T-010: 批量导入学生 - 全部成功
✓ TC-T-011: 批量导入学生 - 部分失败
✓ TC-T-012: 导出学生报告 - Excel格式
✓ TC-T-013: 导出学生报告 - CSV格式
✓ TC-T-014: 查询预警列表
✓ TC-T-015: 解决预警
✓ TC-T-016: 忽略预警

学生端功能测试用例:
✓ TC-S-001: 使用邀请码注册 - 正常流程
✓ TC-S-002: 使用邀请码注册 - 邀请码无效
✓ TC-S-003: 使用邀请码注册 - 邀请码过期
✓ TC-S-004: 使用邀请码注册 - 达到最大使用次数
✓ TC-S-005: 查询任务进度
✓ TC-S-006: 更新任务状态
✓ TC-S-007: 任务完成度计算 - 霍兰德测试
✓ TC-S-008: 任务完成度计算 - 学生资料
✓ TC-S-009: 任务完成度计算 - 简历上传

预警系统测试用例:
✓ TC-A-001: 完成度<60%创建预警
✓ TC-A-002: 完成度>=60%不创建预警
✓ TC-A-003: 预警级别计算 - Critical
✓ TC-A-004: 预警级别计算 - High
✓ TC-A-005: 预警级别计算 - Medium
✓ TC-A-006: 更新已存在预警
✓ TC-A-007: 批量预警检查
✓ TC-A-008: 定时任务执行
```

#### 任务5.2：性能测试（0.5天）

**负责人**: 后端工程师A  
**验收标准**: 性能指标达标

**性能测试场景**:

```go
// internal/test/performance_test.go
func BenchmarkGenerateInviteCode(b *testing.B) {
    // 基准测试：邀请码生成性能
    for i := 0; i < b.N; i++ {
        generateUniqueCode("TEST001")
    }
}

func BenchmarkCheckCodeExists(b *testing.B) {
    // 基准测试：代码存在性检查性能
    for i := 0; i < b.N; i++ {
        CheckCodeExists(context.Background(), "TEST-CODE-001")
    }
}

func TestPerformance_BatchCheckAlerts(t *testing.T) {
    // 批量预警检查性能测试
    schoolId := 1
    
    // 插入1000个测试学生
    // ...
    
    start := time.Now()
    err := BatchCheckAlerts(schoolId)
    duration := time.Since(start)
    
    assert.NoError(t, err)
    assert.Less(t, duration.Seconds(), float64(10)) // 10秒内完成
    
    logx.Infof("Batch check 1000 students took: %v", duration)
}

func TestPerformance_ExportStudents(t *testing.T) {
    // 导出功能性能测试
    schoolId := 1
    
    start := time.Now()
    _, _, err := ExportStudents(schoolId, "excel", "")
    duration := time.Since(start)
    
    assert.NoError(t, err)
    assert.Less(t, duration.Seconds(), float64(5)) // 5秒内完成
    
    logx.Infof("Export students took: %v", duration)
}
```

**性能指标要求**:

| 指标 | 要求 | 实际 | 状态 |
|------|------|------|------|
| 邀请码生成 | <100ms | - | 待测试 |
| 代码存在性检查 | <10ms | - | 待测试 |
| 批量预警检查(1000学生) | <10s | - | 待测试 |
| 导出学生报告(100学生) | <5s | - | 待测试 |
| API响应时间 | <500ms | - | 待测试 |

#### 任务5.3：压力测试（0.5天）

**负责人**: 后端工程师A  
**验收标准**: 系统稳定，无明显性能下降

**压力测试场景**:

```bash
# 使用wrk进行压力测试
# 测试教师注册接口
wrk -t12 -c400 -d30s --latency "http://localhost:8888/api/v1/teachers/register" \
  -H "Content-Type: application/json" \
  -s teacher_register.lua

# teacher_register.lua
wrk.method = "POST"
wrk.body   = '{"username":"test_user","password":"password123","email":"test@example.com","name":"测试","schoolCode":"TEST001"}'
wrk.headers["Content-Type"] = "application/json"
```

#### 任务5.4：代码审查和优化（1天）

**负责人**: 技术总监 + 后端工程师A  
**验收标准**: 代码审查通过，优化完成

**代码审查清单**:

```
代码质量检查:
✓ 代码格式规范
✓ 错误处理完整
✓ 日志记录合理
✓ 命名规范统一
✓ 注释清晰准确
✓ 无明显代码重复
✓ 无魔法数字

安全性检查:
✓ SQL注入防护
✓ XSS攻击防护
✓ CSRF防护
✓ 敏感数据加密
✓ 权限验证完整
✓ 输入验证充分

性能优化:
✓ 数据库查询优化
✓ 缓存策略合理
✓ 索引优化
✓ N+1查询避免
✓ 批量操作优化
✓ 连接池配置

可维护性:
✓ 代码结构清晰
✓ 模块化良好
✓ 测试覆盖充分
✓ 文档完整
✓ 配置管理规范
```

### 第五阶段验收标准

- [ ] 所有功能测试用例通过
- [ ] 性能测试指标达标
- [ ] 压力测试通过，系统稳定
- [ ] 代码审查完成，问题修复
- [ ] 优化实施完成
- [ ] 文档更新完成

---

## 质量保证

### 代码规范

#### Go代码规范
- 遵循 [Effective Go](https://golang.org/doc/effective_go)
- 使用 `gofmt` 格式化代码
- 使用 `golint` 进行静态检查
- 使用 `go vet` 检查潜在问题
- 单元测试覆盖率 >= 80%

#### TypeScript代码规范
- 使用 ESLint + Prettier
- 遵循 Airbnb JavaScript Style Guide
- 使用 TypeScript 严格模式
- 组件使用函数式 + Hooks
- 状态管理使用 Context API

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org):

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

### Code Review流程

1. 创建Pull Request
2. 自动化测试运行
3. Code Review（至少1人审核）
4. 修改反馈
5. 合并到主分支

---

## 风险管理

### 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 数据库性能问题 | 中 | 高 | 索引优化、查询优化、缓存策略 |
| 邀请码冲突 | 低 | 中 | 重试机制、UNIQUE约束 |
| 定时任务失败 | 中 | 中 | 错误处理、监控告警、手动触发 |
| 并发问题 | 低 | 高 | 事务处理、乐观锁、分布式锁 |

### 业务风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 邀请码泄露 | 中 | 中 | 使用限制、过期机制、撤销功能 |
| 预警误报 | 中 | 中 | 合理阈值、人工审核、预警级别 |
| 用户接受度 | 低 | 高 | 用户引导、帮助文档、培训 |

### 进度风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 需求变更 | 中 | 中 | 需求冻结、变更评估、优先级调整 |
| 技术难点 | 低 | 高 | 技术调研、专家咨询、备选方案 |
| 人员变动 | 低 | 中 | 知识文档、代码规范、交接流程 |

---

## 团队协作

### 角色分工

| 角色 | 职责 | 人员 |
|------|------|------|
| 技术总监 | 架构设计、技术决策、代码审查 | - |
| 后端工程师A | 数据库设计、后端开发、API实现 | - |
| 前端工程师A | 前端开发、UI实现、交互优化 | - |
| 测试工程师 | 测试用例设计、功能测试、性能测试 | - |

### 沟通机制

- **每日站会**: 15分钟，同步进度、讨论问题
- **周会**: 1小时，总结本周、规划下周
- **技术评审**: 重要技术决策前进行讨论
- **代码审查**: Pull Request机制

### 工具使用

- **项目管理**: GitHub Projects / Trello
- **文档协作**: Confluence / Notion
- **代码托管**: GitHub / GitLab
- **CI/CD**: GitHub Actions / Jenkins
- **监控告警**: Prometheus + Grafana

---

## 交付物清单

### 代码交付物

- [ ] 后端代码（Go）
- [ ] 前端代码（TypeScript + React）
- [ ] 数据库脚本（SQL）
- [ ] API文档（OpenAPI）
- [ ] 单元测试代码
- [ ] 集成测试代码

### 文档交付物

- [ ] 技术架构文档
- [ ] API接口文档
- [ ] 数据库设计文档
- [ ] 部署文档
- [ ] 用户使用手册
- [ ] 运维手册

### 配置交付物

- [ ] 配置文件模板
- [ ] 环境变量说明
- [ ] Docker配置
- [ ] Nginx配置
- [ ] 监控配置

---

## 后续支持

### 维护计划

- **bug修复**: 收集反馈，及时修复
- **功能优化**: 根据使用情况优化性能
- **新功能**: 按需迭代开发

### 监控指标

- 系统可用性
- API响应时间
- 错误率
- 用户活跃度
- 邀请码使用率

### 反馈渠道

- 用户反馈表单
- 技术支持邮箱
- 在线客服系统
- 定期用户调研

---

**文档结束**

**版本历史**:
- v1.0 (2026-04-16): 初始版本