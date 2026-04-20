package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ StudentsModel = (*customStudentsModel)(nil)

type (
	// StudentsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customStudentsModel.
	StudentsModel interface {
		studentsModel
		withSession(session sqlx.Session) StudentsModel
		FindOneByUserId(ctx context.Context, userId int64) (*Students, error)
		FindAll(ctx context.Context, page, pageSize int, education, major string) ([]*Students, int64, error)
	}

	customStudentsModel struct {
		*defaultStudentsModel
	}
)

// NewStudentsModel returns a model for the database table.
func NewStudentsModel(conn sqlx.SqlConn) StudentsModel {
	return &customStudentsModel{
		defaultStudentsModel: newStudentsModel(conn),
	}
}

func (m *customStudentsModel) withSession(session sqlx.Session) StudentsModel {
	return NewStudentsModel(sqlx.NewSqlConnFromSession(session))
}

func (m *customStudentsModel) FindOneByUserId(ctx context.Context, userId int64) (*Students, error) {
	query := fmt.Sprintf("select %s from %s where `user_id` = ? limit 1", studentsRows, m.table)
	var resp Students
	err := m.conn.QueryRowCtx(ctx, &resp, query, userId)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

// FindAll 分页查询学生列表，支持按education和major过滤
func (m *customStudentsModel) FindAll(ctx context.Context, page, pageSize int, education, major string) ([]*Students, int64, error) {
	// 构建查询条件
	conditions := []string{}
	args := []interface{}{}

	if education != "" {
		conditions = append(conditions, "`education` = ?")
		args = append(args, education)
	}

	if major != "" {
		conditions = append(conditions, "`major` = ?")
		args = append(args, major)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "where " + strings.Join(conditions, " and ")
	}

	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s %s", m.table, whereClause)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", studentsRows, m.table, whereClause)
	args = append(args, pageSize, offset)

	var resp []*Students
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

// Insert 插入学生记录，自动设置时间戳
// 重写生成的Insert方法，自动设置created_at和updated_at
func (m *customStudentsModel) Insert(ctx context.Context, data *Students) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`user_id`, `name`, `education`, `major`, `graduation_year`, `skills`, `certificates`, `soft_skills`, `internship`, `projects`, `completeness_score`, `competitiveness_score`, `resume_url`, `suggestions`, `resume_content`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.UserId, data.Name, data.Education, data.Major, data.GraduationYear, data.Skills, data.Certificates, data.SoftSkills, data.Internship, data.Projects, data.CompletenessScore, data.CompetitivenessScore, data.ResumeUrl, data.Suggestions, data.ResumeContent, data.CreatedAt, data.UpdatedAt)
	return ret, err
}
