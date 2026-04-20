package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ InterviewReportsModel = (*customInterviewReportsModel)(nil)

type (
	// InterviewReportsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customInterviewReportsModel.
	InterviewReportsModel interface {
		interviewReportsModel
		withSession(session sqlx.Session) InterviewReportsModel
		FindBySessionId(ctx context.Context, sessionId int64) (*InterviewReports, error)
		FindByUserId(ctx context.Context, userId int64) ([]*InterviewReports, error)
		InsertWithTimestamp(ctx context.Context, data *InterviewReports) (sql.Result, error)
	}

	customInterviewReportsModel struct {
		*defaultInterviewReportsModel
	}
)

// NewInterviewReportsModel returns a model for the database table.
func NewInterviewReportsModel(conn sqlx.SqlConn) InterviewReportsModel {
	return &customInterviewReportsModel{
		defaultInterviewReportsModel: newInterviewReportsModel(conn),
	}
}

func (m *customInterviewReportsModel) withSession(session sqlx.Session) InterviewReportsModel {
	return NewInterviewReportsModel(sqlx.NewSqlConnFromSession(session))
}

// FindBySessionId finds a report by session_id
func (m *customInterviewReportsModel) FindBySessionId(ctx context.Context, sessionId int64) (*InterviewReports, error) {
	query := fmt.Sprintf("select %s from %s where `session_id` = ? limit 1", interviewReportsRows, m.table)
	var resp InterviewReports
	err := m.conn.QueryRowCtx(ctx, &resp, query, sessionId)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

// FindByUserId finds all reports for a user
func (m *customInterviewReportsModel) FindByUserId(ctx context.Context, userId int64) ([]*InterviewReports, error) {
	query := fmt.Sprintf("select %s from %s where `user_id` = ? order by `created_at` desc", interviewReportsRows, m.table)
	var resp []*InterviewReports
	err := m.conn.QueryRowsCtx(ctx, &resp, query, userId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// InsertWithTimestamp inserts a report with automatic timestamp
func (m *customInterviewReportsModel) InsertWithTimestamp(ctx context.Context, data *InterviewReports) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`session_id`, `user_id`, `overall_score`, `skill_score`, `communication_score`, `logic_score`, `confidence_score`, `strengths`, `weaknesses`, `improvement_suggestions`, `summary`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.SessionId, data.UserId, data.OverallScore, data.SkillScore, data.CommunicationScore, data.LogicScore, data.ConfidenceScore, data.Strengths, data.Weaknesses, data.ImprovementSuggestions, data.Summary, data.CreatedAt, data.UpdatedAt)
	return ret, err
}