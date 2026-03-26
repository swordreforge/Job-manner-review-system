package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ CareerReportsModel = (*customCareerReportsModel)(nil)

type (
	// CareerReportsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customCareerReportsModel.
	CareerReportsModel interface {
		careerReportsModel
		withSession(session sqlx.Session) CareerReportsModel
	}

	customCareerReportsModel struct {
		*defaultCareerReportsModel
	}
)

// NewCareerReportsModel returns a model for the database table.
func NewCareerReportsModel(conn sqlx.SqlConn) CareerReportsModel {
	return &customCareerReportsModel{
		defaultCareerReportsModel: newCareerReportsModel(conn),
	}
}

func (m *customCareerReportsModel) withSession(session sqlx.Session) CareerReportsModel {
	return NewCareerReportsModel(sqlx.NewSqlConnFromSession(session))
}

// Insert 插入职业报告记录，自动设置时间戳
// 重写生成的Insert方法，自动设置created_at和updated_at
func (m *customCareerReportsModel) Insert(ctx context.Context, data *CareerReports) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`student_id`, `target_job_id`, `title`, `content`, `overview`, `match_analysis`, `career_path`, `action_plan`, `status`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.StudentId, data.TargetJobId, data.Title, data.Content, data.Overview, data.MatchAnalysis, data.CareerPath, data.ActionPlan, data.Status, data.CreatedAt, data.UpdatedAt)
	return ret, err
}
