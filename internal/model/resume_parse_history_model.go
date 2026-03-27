package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var (
	_ ResumeParseHistoryModel = (*customResumeParseHistoryModel)(nil)
)

type (
	// ResumeParseHistoryModel is an interface to be customized, add more methods here,
	// and implement the added methods in customResumeParseHistoryModel.
	ResumeParseHistoryModel interface {
		resumeParseHistoryModel
		FindByUserId(ctx context.Context, userId int64, page, pageSize int) ([]*ResumeParseHistory, int64, error)
		FindByStudentId(ctx context.Context, studentId int64, page, pageSize int) ([]*ResumeParseHistory, int64, error)
	}

	customResumeParseHistoryModel struct {
		*defaultResumeParseHistoryModel
	}

	resumeParseHistoryModel interface {
		Insert(ctx context.Context, data *ResumeParseHistory) (sql.Result, error)
		FindOne(ctx context.Context, id int64) (*ResumeParseHistory, error)
		Delete(ctx context.Context, id int64) error
	}

	defaultResumeParseHistoryModel struct {
		conn  sqlx.SqlConn
		table string
	}

	ResumeParseHistory struct {
		Id                   int64          `db:"id"`
		UserId               int64          `db:"user_id"`
		StudentId            sql.NullInt64  `db:"student_id"`
		ResumeFileName       sql.NullString `db:"resume_file_name"`
		ResumeContent        sql.NullString `db:"resume_content"`
		ParsedProfile        sql.NullString `db:"parsed_profile"`
		Suggestions          sql.NullString `db:"suggestions"`
		CompletenessScore    float64        `db:"completeness_score"`
		CompetitivenessScore float64        `db:"competitiveness_score"`
		CreatedAt            int64          `db:"created_at"`
	}
)

// NewResumeParseHistoryModel returns a model for the database table.
func NewResumeParseHistoryModel(conn sqlx.SqlConn) ResumeParseHistoryModel {
	return &customResumeParseHistoryModel{
		defaultResumeParseHistoryModel: &defaultResumeParseHistoryModel{
			conn:  conn,
			table: "`resume_parse_history`",
		},
	}
}

func (m *customResumeParseHistoryModel) FindByUserId(ctx context.Context, userId int64, page, pageSize int) ([]*ResumeParseHistory, int64, error) {
	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s where `user_id` = ?", m.table)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, userId)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select * from %s where `user_id` = ? order by `created_at` desc limit ? offset ?", m.table)
	var resp []*ResumeParseHistory
	err = m.conn.QueryRowsCtx(ctx, &resp, query, userId, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

func (m *customResumeParseHistoryModel) FindByStudentId(ctx context.Context, studentId int64, page, pageSize int) ([]*ResumeParseHistory, int64, error) {
	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s where `student_id` = ?", m.table)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, studentId)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select * from %s where `student_id` = ? order by `created_at` desc limit ? offset ?", m.table)
	var resp []*ResumeParseHistory
	err = m.conn.QueryRowsCtx(ctx, &resp, query, studentId, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

func (m *defaultResumeParseHistoryModel) Insert(ctx context.Context, data *ResumeParseHistory) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`user_id`, `student_id`, `resume_file_name`, `resume_content`, `parsed_profile`, `suggestions`, `completeness_score`, `competitiveness_score`, `created_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.UserId, data.StudentId, data.ResumeFileName, data.ResumeContent, data.ParsedProfile, data.Suggestions, data.CompletenessScore, data.CompetitivenessScore, data.CreatedAt)
	return ret, err
}

func (m *defaultResumeParseHistoryModel) FindOne(ctx context.Context, id int64) (*ResumeParseHistory, error) {
	query := fmt.Sprintf("select * from %s where `id` = ? limit 1", m.table)
	var resp ResumeParseHistory
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

func (m *defaultResumeParseHistoryModel) Delete(ctx context.Context, id int64) error {
	query := fmt.Sprintf("delete from %s where `id` = ?", m.table)
	_, err := m.conn.ExecCtx(ctx, query, id)
	return err
}