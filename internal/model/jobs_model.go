package model

import "github.com/zeromicro/go-zero/core/stores/sqlx"

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
