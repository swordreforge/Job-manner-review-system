package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ InterviewSessionsModel = (*customInterviewSessionsModel)(nil)

type (
	// InterviewSessionsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customInterviewSessionsModel.
	InterviewSessionsModel interface {
		interviewSessionsModel
		withSession(session sqlx.Session) InterviewSessionsModel
		FindOneByUserId(ctx context.Context, userId int64, sessionId int64) (*InterviewSessions, error)
		FindByUserId(ctx context.Context, userId int64, page, pageSize int, status, mode string) ([]*InterviewSessions, int64, error)
		FindRunningByUserId(ctx context.Context, userId int64) (*InterviewSessions, error)
		UpdateStats(ctx context.Context, sessionId int64, score float64) error
		EndSession(ctx context.Context, sessionId int64, duration int, status string) error
		FindCompletedWithoutReports(ctx context.Context) ([]*InterviewSessions, error)
	}

	customInterviewSessionsModel struct {
		*defaultInterviewSessionsModel
	}
)

// NewInterviewSessionsModel returns a model for the database table.
func NewInterviewSessionsModel(conn sqlx.SqlConn) InterviewSessionsModel {
	return &customInterviewSessionsModel{
		defaultInterviewSessionsModel: newInterviewSessionsModel(conn),
	}
}

func (m *customInterviewSessionsModel) withSession(session sqlx.Session) InterviewSessionsModel {
	return NewInterviewSessionsModel(sqlx.NewSqlConnFromSession(session))
}

// FindOneByUserId finds a interview session by user_id and session_id
func (m *customInterviewSessionsModel) FindOneByUserId(ctx context.Context, userId int64, sessionId int64) (*InterviewSessions, error) {
	query := fmt.Sprintf("select %s from %s where `user_id` = ? and `id` = ? limit 1", interviewSessionsRows, m.table)
	var resp InterviewSessions
	err := m.conn.QueryRowCtx(ctx, &resp, query, userId, sessionId)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

// FindByUserId finds interview sessions by user_id with pagination
func (m *customInterviewSessionsModel) FindByUserId(ctx context.Context, userId int64, page, pageSize int, status, mode string) ([]*InterviewSessions, int64, error) {
	// 构建查询条件
	conditions := []string{"`user_id` = ?"}
	args := []interface{}{userId}

	if status != "" {
		conditions = append(conditions, "`status` = ?")
		args = append(args, status)
	}

	if mode != "" {
		conditions = append(conditions, "`mode` = ?")
		args = append(args, mode)
	}

	whereClause := "where " + strings.Join(conditions, " and ")

	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s %s", m.table, whereClause)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", interviewSessionsRows, m.table, whereClause)
	args = append(args, pageSize, offset)

	var resp []*InterviewSessions
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

// FindRunningByUserId finds the running interview session for a user
func (m *customInterviewSessionsModel) FindRunningByUserId(ctx context.Context, userId int64) (*InterviewSessions, error) {
	query := fmt.Sprintf("select %s from %s where `user_id` = ? and `status` = 'running' limit 1", interviewSessionsRows, m.table)
	var resp InterviewSessions
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

// UpdateStats updates interview statistics after a question is answered
func (m *customInterviewSessionsModel) UpdateStats(ctx context.Context, sessionId int64, score float64) error {
	query := fmt.Sprintf(`
		UPDATE %s SET
			current_question = current_question + 1,
			average_score = CASE
				WHEN average_score = 0 THEN ?
				WHEN current_question = 0 THEN ?
				ELSE ((average_score * current_question) + ?) / (current_question + 1)
			END,
			max_score = GREATEST(max_score, ?),
			min_score = CASE
				WHEN min_score = 0 THEN ?
				WHEN ? < min_score THEN ?
				ELSE min_score
			END,
			updated_at = ?
		WHERE id = ?
	`, m.table)
	now := time.Now().Unix()
	_, err := m.conn.ExecCtx(ctx, query, score, score, score, score, score, score, score, now, sessionId)
	return err
}

// EndSession ends an interview session
func (m *customInterviewSessionsModel) EndSession(ctx context.Context, sessionId int64, duration int, status string) error {
	query := fmt.Sprintf("update %s set `status` = ?, `completed_at` = ?, `duration_seconds` = ?, `average_score` = CASE WHEN ? = 'cancelled' THEN 0 ELSE average_score END, `updated_at` = ? where `id` = ?", m.table)
	now := time.Now().Unix()
	_, err := m.conn.ExecCtx(ctx, query, status, now, duration, status, now, sessionId)
	return err
}

// Insert 插入面试会话记录，自动设置时间戳
func (m *customInterviewSessionsModel) Insert(ctx context.Context, data *InterviewSessions) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`user_id`, `student_id`, `mode`, `status`, `total_questions`, `current_question`, `average_score`, `max_score`, `min_score`, `duration_seconds`, `created_at`, `updated_at`, `completed_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.UserId, data.StudentId, data.Mode, data.Status, data.TotalQuestions, data.CurrentQuestion, data.AverageScore, data.MaxScore, data.MinScore, data.DurationSeconds, data.CreatedAt, data.UpdatedAt, data.CompletedAt)
	return ret, err
}

// FindCompletedWithoutReports 查找已完成但没有报告的会话
func (m *customInterviewSessionsModel) FindCompletedWithoutReports(ctx context.Context) ([]*InterviewSessions, error) {
	query := fmt.Sprintf(`
		SELECT s.id, s.user_id, s.student_id, s.mode, s.status, s.total_questions, s.current_question, 
		       s.average_score, s.max_score, s.min_score, s.duration_seconds, s.created_at, s.updated_at, s.completed_at
		FROM %s s
		LEFT JOIN interview_reports r ON s.id = r.session_id
		WHERE s.status = 'completed' AND r.id IS NULL
		ORDER BY s.id
	`, m.table)
	
	var resp []*InterviewSessions
	err := m.conn.QueryRowsCtx(ctx, &resp, query)
	if err != nil {
		return nil, err
	}
	return resp, nil
}