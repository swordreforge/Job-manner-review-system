package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ InterviewMessagesModel = (*customInterviewMessagesModel)(nil)

type (
	// InterviewMessagesModel is an interface to be customized, add more methods here,
	// and implement the added methods in customInterviewMessagesModel.
	InterviewMessagesModel interface {
		interviewMessagesModel
		withSession(session sqlx.Session) InterviewMessagesModel
		FindBySessionId(ctx context.Context, sessionId int64) ([]*InterviewMessages, error)
		InsertWithTimestamp(ctx context.Context, data *InterviewMessages) (sql.Result, error)
	}

	customInterviewMessagesModel struct {
		*defaultInterviewMessagesModel
	}
)

// NewInterviewMessagesModel returns a model for the database table.
func NewInterviewMessagesModel(conn sqlx.SqlConn) InterviewMessagesModel {
	return &customInterviewMessagesModel{
		defaultInterviewMessagesModel: newInterviewMessagesModel(conn),
	}
}

func (m *customInterviewMessagesModel) withSession(session sqlx.Session) InterviewMessagesModel {
	return NewInterviewMessagesModel(sqlx.NewSqlConnFromSession(session))
}

// FindBySessionId finds all messages for a session
func (m *customInterviewMessagesModel) FindBySessionId(ctx context.Context, sessionId int64) ([]*InterviewMessages, error) {
	query := fmt.Sprintf("select %s from %s where `session_id` = ? order by `created_at` asc", interviewMessagesRows, m.table)
	var resp []*InterviewMessages
	err := m.conn.QueryRowsCtx(ctx, &resp, query, sessionId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// InsertWithTimestamp inserts a message with automatic timestamp
func (m *customInterviewMessagesModel) InsertWithTimestamp(ctx context.Context, data *InterviewMessages) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`session_id`, `role`, `content`, `question_type`, `score`, `feedback`, `created_at`) values (?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.SessionId, data.Role, data.Content, data.QuestionType, data.Score, data.Feedback, data.CreatedAt)
	return ret, err
}