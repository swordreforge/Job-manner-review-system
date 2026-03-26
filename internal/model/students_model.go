package model

import (
	"context"
	"database/sql"
	"fmt"
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
		InsertWithTimestamp(ctx context.Context, data *Students) (sql.Result, error)
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

// InsertWithTimestamp 插入学生记录，包含时间戳
func (m *customStudentsModel) InsertWithTimestamp(ctx context.Context, data *Students) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`user_id`, `name`, `education`, `major`, `graduation_year`, `skills`, `certificates`, `soft_skills`, `internship`, `projects`, `completeness_score`, `competitiveness_score`, `resume_url`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.UserId, data.Name, data.Education, data.Major, data.GraduationYear, data.Skills, data.Certificates, data.SoftSkills, data.Internship, data.Projects, data.CompletenessScore, data.CompetitivenessScore, data.ResumeUrl, data.CreatedAt, data.UpdatedAt)
	return ret, err
}
