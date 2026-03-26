package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ JobsModel = (*customJobsModel)(nil)

type (
	// JobsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customJobsModel.
	JobsModel interface {
		jobsModel
		withSession(session sqlx.Session) JobsModel
		FindAll(ctx context.Context, page, pageSize int, industry string) ([]*Jobs, int64, error)
	}

	customJobsModel struct {
		*defaultJobsModel
	}
)

// NewJobsModel returns a model for the database table.
func NewJobsModel(conn sqlx.SqlConn) JobsModel {
	return &customJobsModel{
		defaultJobsModel: newJobsModel(conn),
	}
}

func (m *customJobsModel) withSession(session sqlx.Session) JobsModel {
	return NewJobsModel(sqlx.NewSqlConnFromSession(session))
}

// FindAll 分页查询职位列表，支持按industry过滤
func (m *customJobsModel) FindAll(ctx context.Context, page, pageSize int, industry string) ([]*Jobs, int64, error) {
	// 构建查询条件
	conditions := []string{}
	args := []interface{}{}

	if industry != "" {
		conditions = append(conditions, "`industry` = ?")
		args = append(args, industry)
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
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", jobsRows, m.table, whereClause)
	args = append(args, pageSize, offset)

	var resp []*Jobs
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

// Insert 插入职位记录，自动设置时间戳
// 重写生成的Insert方法，自动设置created_at和updated_at
func (m *customJobsModel) Insert(ctx context.Context, data *Jobs) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`name`, `description`, `company`, `industry`, `location`, `salary_range`, `skills`, `certificates`, `soft_skills`, `requirements`, `growth_potential`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.Name, data.Description, data.Company, data.Industry, data.Location, data.SalaryRange, data.Skills, data.Certificates, data.SoftSkills, data.Requirements, data.GrowthPotential, data.CreatedAt, data.UpdatedAt)
	return ret, err
}
