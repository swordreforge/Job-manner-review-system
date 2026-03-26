package model

import (
	"context"
	"database/sql"
	"fmt"
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
