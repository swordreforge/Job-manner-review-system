package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
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
		FindAll(ctx context.Context, page, pageSize int, studentId int64, status string) ([]*CareerReports, int64, error)
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

// FindAll 分页查询报告列表，支持按studentId和status过滤
func (m *customCareerReportsModel) FindAll(ctx context.Context, page, pageSize int, studentId int64, status string) ([]*CareerReports, int64, error) {
	// 构建查询条件
	conditions := []string{}
	args := []interface{}{}

	if studentId > 0 {
		conditions = append(conditions, "`student_id` = ?")
		args = append(args, studentId)
	}

	if status != "" {
		conditions = append(conditions, "`status` = ?")
		args = append(args, status)
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
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", careerReportsRows, m.table, whereClause)
	args = append(args, pageSize, offset)

	var resp []*CareerReports
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
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
