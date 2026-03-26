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
		InsertWithTimestamp(ctx context.Context, data *MatchRecords) (sql.Result, error)
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

// InsertWithTimestamp 插入匹配记录，包含时间戳
func (m *customMatchRecordsModel) InsertWithTimestamp(ctx context.Context, data *MatchRecords) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`student_id`, `job_id`, `overall_score`, `skills_match`, `certs_match`, `soft_skills_match`, `experience_match`, `gap_analysis`, `created_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.StudentId, data.JobId, data.OverallScore, data.SkillsMatch, data.CertsMatch, data.SoftSkillsMatch, data.ExperienceMatch, data.GapAnalysis, data.CreatedAt)
	return ret, err
}
