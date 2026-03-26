# 数据库开发指南

## 待完成

本文档记录数据库层开发的待办事项和技术方案。

---

## 1. 数据库设计

### 1.1 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS career_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE career_db;
```

### 1.2 表结构设计

#### 用户表 (users)

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 岗位表 (jobs)

```sql
CREATE TABLE jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    company VARCHAR(100),
    industry VARCHAR(50),
    location VARCHAR(100),
    salary_range VARCHAR(50),
    skills JSON,
    certificates JSON,
    soft_skills JSON,
    requirements JSON,
    growth_potential VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_industry (industry),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 岗位晋升路径表 (job_promotion_paths)

```sql
CREATE TABLE job_promotion_paths (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_job_id BIGINT NOT NULL,
    to_job_id BIGINT NOT NULL,
    match_score FLOAT,
    transfer_skills JSON,
    learning_path JSON,
    FOREIGN KEY (from_job_id) REFERENCES jobs(id),
    FOREIGN KEY (to_job_id) REFERENCES jobs(id),
    INDEX idx_from_job (from_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 学生画像表 (students)

```sql
CREATE TABLE students (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    education VARCHAR(50),
    major VARCHAR(100),
    graduation_year INT,
    skills JSON,
    certificates JSON,
    soft_skills JSON,
    internship JSON,
    projects JSON,
    completeness_score FLOAT DEFAULT 0,
    competitiveness_score FLOAT DEFAULT 0,
    resume_url VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_major (major)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 职业报告表 (career_reports)

```sql
CREATE TABLE career_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    target_job_id BIGINT,
    title VARCHAR(200),
    content TEXT,
    overview JSON,
    match_analysis JSON,
    career_path JSON,
    action_plan JSON,
    status VARCHAR(20) DEFAULT 'draft',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (target_job_id) REFERENCES jobs(id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 匹配记录表 (match_records)

```sql
CREATE TABLE match_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,
    overall_score FLOAT,
    skills_match FLOAT,
    certs_match FLOAT,
    soft_skills_match FLOAT,
    experience_match FLOAT,
    gap_analysis JSON,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    INDEX idx_student (student_id),
    INDEX idx_job (job_id),
    INDEX idx_score (overall_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 2. Model 层实现

### 2.1 使用 goctl 生成

```bash
# 安装 goctl (如果未安装)
go install github.com/zeromicro/go-zero/tools/goctl@latest

# 生成 Model 层
goctl model mysql ddl -src ./sql/schema.sql -dir ./internal/model -style go_zero

# 或连接数据库自动生成
goctl model mysql datasource -url="root:password@tcp(localhost:3306)/career_db" -table="*" -dir ./internal/model
```

### 2.2 手动创建 Model 文件

创建 `internal/model/jobmodel.go`:

```go
package model

import (
    "context"
    "github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ JobModel = (*customJobModel)(nil)

type (
    JobModel interface {
        FindOne(ctx context.Context, id int64) (*Job, error)
        FindAll(ctx context.Context, page, pageSize int64) ([]*Job, error)
        FindByIndustry(ctx context.Context, industry string) ([]*Job, error)
        Insert(ctx context.Context, job *Job) (int64, error)
        Update(ctx context.Context, job *Job) error
        Delete(ctx context.Context, id int64) error
    }

    customJobModel struct {
        *defaultJobModel
    }
)

func NewJobModel(conn sqlx.SqlConn) JobModel {
    return &customJobModel{
        defaultJobModel: newDefaultJobModel(conn),
    }
}

func (m *customJobModel) FindByIndustry(ctx context.Context, industry string) ([]*Job, error) {
    query := "SELECT id, name, description, company, industry, location, salary_range, skills, certificates, soft_skills, requirements, growth_potential, created_at, updated_at FROM jobs WHERE industry = ?"
    var resp []*Job
    err := m.conn.QueryRowsCtx(ctx, &resp, query, industry)
    if err != nil {
        return nil, err
    }
    return resp, nil
}
```

---

## 3. 更新 ServiceContext

### 3.1 修改 `internal/svc/servicecontext.go`

```go
package svc

import (
    "github.com/zeromicro/go-zero/core/stores/redis"
    "github.com/zeromicro/go-zero/core/stores/sqlx"

    "career-api/internal/config"
    "career-api/internal/model"
)

type ServiceContext struct {
    Config       *config.Config
    Redis        *redis.Redis
    DB           sqlx.SqlConn
    
    // Models
    JobModel     model.JobModel
    StudentModel model.StudentModel
    UserModel    model.UserModel
    ReportModel  model.ReportModel
    MatchModel   model.MatchModel
}

func NewServiceContext(c *config.Config) *ServiceContext {
    mysqlConn := sqlx.NewMysql(c.Mysql.DataSource)

    redisClient := redis.New(c.Redis.Host)

    return &ServiceContext{
        Config:       c,
        Redis:        redisClient,
        DB:           mysqlConn,
        JobModel:     model.NewJobModel(mysqlConn),
        StudentModel: model.NewStudentModel(mysqlConn),
        UserModel:    model.NewUserModel(mysqlConn),
        ReportModel:  model.NewReportModel(mysqlConn),
        MatchModel:   model.NewMatchModel(mysqlConn),
    }
}
```

---

## 4. 更新 Logic 层

### 4.1 示例：JobLogic 使用数据库

```go
package logic

import (
    "context"

    "github.com/zeromicro/go-zero/core/logx"

    "career-api/internal/svc"
    "career-api/internal/types"
    "career-api/common/errors"
)

type GetJobLogic struct {
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewGetJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetJobLogic {
    return &GetJobLogic{
        ctx:    ctx,
        svcCtx: svcCtx,
    }
}

func (l *GetJobLogic) GetJob(id int64) (*types.JobResp, error) {
    job, err := l.svcCtx.JobModel.FindOne(l.ctx, id)
    if err != nil {
        logx.Errorf("GetJob failed: %v", err)
        return &types.JobResp{
            Code: errors.CodeNotFound,
            Msg:  "job not found",
        }, nil
    }

    return &types.JobResp{
        Code: errors.CodeSuccess,
        Msg:  "success",
        Data: &types.JobProfile{
            Id:          job.Id,
            Name:        job.Name,
            Description: job.Description,
            Industry:    job.Industry,
            Location:    job.Location,
            // ... 其他字段
        },
    }, nil
}
```

---

## 5. 事务处理

```go
func (l *CreateStudentLogic) CreateStudent(req *types.CreateStudentReq) (*types.StudentResp, error) {
    // 使用事务
    session, err := l.svcCtx.DB.Transaction(l.ctx)
    if err != nil {
        return nil, err
    }
    defer session.Rollback()

    // 创建学生记录
    studentId, err := l.svcCtx.StudentModel.TransactionInsert(l.ctx, session, &Student{
        Name:   req.Name,
        Major:  req.Major,
        // ...
    })
    if err != nil {
        return nil, err
    }

    // 提交事务
    if err := session.Commit(); err != nil {
        return nil, err
    }

    return &types.StudentResp{
        Code: errors.CodeSuccess,
        Msg:  "success",
        Data: &types.StudentProfile{
            Id: studentId,
            // ...
        },
    }, nil
}
```

---

## 6. 缓存策略

### 6.1 Redis 缓存

```go
func (l *GetJobLogic) GetJob(id int64) (*types.JobResp, error) {
    // 尝试从缓存获取
    cacheKey := fmt.Sprintf("job:%d", id)
    cached, err := l.svcCtx.Redis.Get(cacheKey)
    if err == nil && cached != "" {
        var job types.JobProfile
        json.Unmarshal([]byte(cached), &job)
        return &types.JobResp{
            Code: errors.CodeSuccess,
            Msg:  "success",
            Data: &job,
        }, nil
    }

    // 从数据库获取
    job, err := l.svcCtx.JobModel.FindOne(l.ctx, id)
    if err != nil {
        return &types.JobResp{
            Code: errors.CodeNotFound,
            Msg:  "job not found",
        }, nil
    }

    // 写入缓存 (1小时过期)
    jobBytes, _ := json.Marshal(job)
    l.svcCtx.Redis.Setex(cacheKey, string(jobBytes), 3600)

    return &types.JobResp{
        Code: errors.CodeSuccess,
        Msg:  "success",
        Data: convertToJobProfile(job),
    }, nil
}
```

### 6.2 缓存失效

```go
// 更新时删除缓存
func (l *UpdateJobLogic) UpdateJob(req *types.UpdateJobReq) (*types.JobResp, error) {
    err := l.svcCtx.JobModel.Update(l.ctx, &Job{Id: req.Id, Name: req.Name})
    if err != nil {
        return nil, err
    }

    // 删除缓存
    cacheKey := fmt.Sprintf("job:%d", req.Id)
    l.svcCtx.Redis.Del(cacheKey)

    return &types.JobResp{Code: 0, Msg: "success"}, nil
}
```

---

## 7. 数据验证

使用 go-zero 的自动验证:

```go
type CreateJobReq struct {
    Name     string `json:"name"`           // 必填
    Industry string `json:"industry"`        // 必填
    Location string `json:"location"`        // 可选
    Salary   string `json:"salary,optional"` // 可选
}

// 在 Handler 中自动验证
func createJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req types.CreateJobReq
        if err := httpx.Parse(r, &req); err != nil {
            // 自动返回验证错误
            writeJSON(w, 400, map[string]interface{}{"code": 400, "msg": err.Error()})
            return
        }
        // ...
    }
}
```

---

## 8. 错误处理

```go
var ErrNotFound = errors.New("record not found")

// Model 层
func (m *defaultJobModel) FindOne(ctx context.Context, id int64) (*Job, error) {
    query := "SELECT id, name, ... FROM jobs WHERE id = ?"
    var resp Job
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

// Logic 层
func (l *GetJobLogic) GetJob(id int64) (*types.JobResp, error) {
    job, err := l.svcCtx.JobModel.FindOne(l.ctx, id)
    if err != nil {
        if err == ErrNotFound {
            return &types.JobResp{
                Code: errors.CodeNotFound,
                Msg:  "job not found",
            }, nil
        }
        logx.Errorf("GetJob failed: %v", err)
        return &types.JobResp{
            Code: errors.CodeInternalError,
            Msg:  "internal error",
        }, nil
    }
    // ...
}
```

---

## 9. 测试

### 9.1 单元测试

```go
package model_test

import (
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/zeromicro/go-zero/core/stores/redis"
    "github.com/zeromicro/go-zero/core/stores/sqlx"
    
    "career-api/internal/model"
)

func TestJobModel(t *testing.T) {
    // 准备测试数据库
    conn := sqlx.NewMysql("root:password@tcp(localhost:3306)/career_db_test")
    defer conn.Close()
    
    m := model.NewJobModel(conn)
    
    // 测试插入
    id, err := m.Insert(context.Background(), &model.Job{
        Name:     "Test Job",
        Industry: "Technology",
    })
    assert.NoError(t, err)
    assert.True(t, id > 0)
    
    // 测试查询
    job, err := m.FindOne(context.Background(), id)
    assert.NoError(t, err)
    assert.Equal(t, "Test Job", job.Name)
    
    // 测试删除
    err = m.Delete(context.Background(), id)
    assert.NoError(t, err)
}
```

### 9.2 集成测试

```bash
# 使用 docker-compose 启动测试数据库
version: '3.8'
services:
  mysql-test:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: career_db_test
    ports:
      - "3307:3306"
```

---

## 10. 数据库迁移

使用 `goose` 进行数据库迁移:

```bash
# 安装 goose
go install github.com/pressly/goose/v3/cmd/goose@latest

# 创建迁移文件
goose -dir ./sql/migrations mysql "user:password@tcp(localhost:3306)/career_db" create init_schema sql

# 运行迁移
goose -dir ./sql/migrations mysql "user:password@tcp(localhost:3306)/career_db" up

# 回滚
goose -dir ./sql/migrations mysql "user:password@tcp(localhost:3306)/career_db" down
```

迁移文件示例 (`sql/migrations/001_init_schema.sql`):

```sql
-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- +goose Down
DROP TABLE IF EXISTS users;
```

---

## 11. 性能优化

### 11.1 索引优化

```sql
-- 复合索引
CREATE INDEX idx_student_industry ON students(major, education);

-- 全文索引 (MySQL 8.0+)
ALTER TABLE jobs ADD FULLTEXT INDEX ft_name_desc (name, description);
```

### 11.2 分页优化

```go
// 使用游标分页代替 OFFSET
func (m *defaultStudentModel) FindByCursor(ctx context.Context, lastId int64, limit int) ([]*Student, error) {
    query := "SELECT id, name, ... FROM students WHERE id > ? ORDER BY id ASC LIMIT ?"
    var resp []*Student
    err := m.conn.QueryRowsCtx(ctx, &resp, query, lastId, limit)
    return resp, err
}
```

### 11.3 连接池配置

```yaml
Mysql:
  DataSource: root:password@tcp(localhost:3306)/career_db?charset=utf8mb4&parseTime=true&loc=Local
  MaxOpenConns: 100      # 最大打开连接数
  MaxIdleConns: 10       # 最大空闲连接数
  ConnMaxLifetime: 3600  # 连接最大生命周期(秒)
```

---

## 12. 开发检查清单

- [ ] 创建数据库和表
- [ ] 生成 Model 层代码
- [ ] 更新 ServiceContext
- [ ] 更新 Logic 层使用数据库
- [ ] 添加 Redis 缓存
- [ ] 处理事务
- [ ] 添加数据验证
- [ ] 编写单元测试
- [ ] 更新 API 文档
- [ ] 性能测试

---

## 13. 相关资源

- [go-zero Model 文档](https://go-zero.dev/cn/docs/model)
- [go-zero MySQL 使用](https://go-zero.dev/cn/docs/redis)
- [MySQL 索引优化](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
