package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ MatchRecordsModel = (*customMatchRecordsModel)(nil)

type (
	// MatchRecordsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customMatchRecordsModel.
	MatchRecordsModel interface {
		matchRecordsModel
		withSession(session sqlx.Session) MatchRecordsModel
		FindByStudentId(ctx context.Context, studentId int64, limit int) ([]*MatchRecords, error)
	}

	customMatchRecordsModel struct {
		*defaultMatchRecordsModel
	}
)

// NewMatchRecordsModel returns a model for the database table.
func NewMatchRecordsModel(conn sqlx.SqlConn) MatchRecordsModel {
	return &customMatchRecordsModel{
		defaultMatchRecordsModel: newMatchRecordsModel(conn),
	}
}

func (m *customMatchRecordsModel) withSession(session sqlx.Session) MatchRecordsModel {
	return NewMatchRecordsModel(sqlx.NewSqlConnFromSession(session))
}

func (m *customMatchRecordsModel) FindByStudentId(ctx context.Context, studentId int64, limit int) ([]*MatchRecords, error) {
	query := fmt.Sprintf("select %s from %s where `student_id` = ? order by `match_score` desc limit ?", matchRecordsRows, m.table)
	var resp []*MatchRecords
	err := m.conn.QueryRowsCtx(ctx, &resp, query, studentId, limit)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// Insert 插入匹配记录，自动设置时间戳
// 重写生成的Insert方法，自动设置created_at
func (m *customMatchRecordsModel) Insert(ctx context.Context, data *MatchRecords) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`student_id`, `job_id`, `overall_score`, `skills_match`, `certs_match`, `soft_skills_match`, `experience_match`, `gap_analysis`, `created_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.StudentId, data.JobId, data.OverallScore, data.SkillsMatch, data.CertsMatch, data.SoftSkillsMatch, data.ExperienceMatch, data.GapAnalysis, data.CreatedAt)
	return ret, err
}
