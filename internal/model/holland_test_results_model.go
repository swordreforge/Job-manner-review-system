package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ HollandTestResultsModel = (*customHollandTestResultsModel)(nil)

type (
	// HollandTestResultsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customHollandTestResultsModel.
	HollandTestResultsModel interface {
		hollandTestResultsModel
		withSession(session sqlx.Session) HollandTestResultsModel
		FindAllByStudentId(ctx context.Context, studentId int64, page, pageSize int) ([]*HollandTestResults, int64, error)
	}

	customHollandTestResultsModel struct {
		*defaultHollandTestResultsModel
	}
)

// NewHollandTestResultsModel returns a model for the database table.
func NewHollandTestResultsModel(conn sqlx.SqlConn) HollandTestResultsModel {
	return &customHollandTestResultsModel{
		defaultHollandTestResultsModel: newHollandTestResultsModel(conn),
	}
}

func (m *customHollandTestResultsModel) withSession(session sqlx.Session) HollandTestResultsModel {
	return NewHollandTestResultsModel(sqlx.NewSqlConnFromSession(session))
}

// FindAllByStudentId 分页查询学生的测试记录
func (m *customHollandTestResultsModel) FindAllByStudentId(ctx context.Context, studentId int64, page, pageSize int) ([]*HollandTestResults, int64, error) {
	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s where `student_id` = ?", m.table)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, studentId)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s where `student_id` = ? order by `created_at` desc limit ? offset ?", hollandTestResultsRows, m.table)
	var resp []*HollandTestResults
	err = m.conn.QueryRowsCtx(ctx, &resp, query, studentId, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

// Insert 插入测试记录，自动设置时间戳
func (m *customHollandTestResultsModel) Insert(ctx context.Context, data *HollandTestResults) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`student_id`, `career_code`, `scores`, `suitable_jobs`, `description`, `created_at`) values (?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.StudentId, data.CareerCode, data.Scores, data.SuitableJobs, data.Description, data.CreatedAt)
	return ret, err
}