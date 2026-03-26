package model

import "github.com/zeromicro/go-zero/core/stores/sqlx"

var _ CareerReportsModel = (*customCareerReportsModel)(nil)

type (
	// CareerReportsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customCareerReportsModel.
	CareerReportsModel interface {
		careerReportsModel
		withSession(session sqlx.Session) CareerReportsModel
	}

	customCareerReportsModel struct {
		*defaultCareerReportsModel
	}
)

// NewCareerReportsModel returns a model for the database table.
func NewCareerReportsModel(conn sqlx.SqlConn) CareerReportsModel {
	return &customCareerReportsModel{
		defaultCareerReportsModel: newCareerReportsModel(conn),
	}
}

func (m *customCareerReportsModel) withSession(session sqlx.Session) CareerReportsModel {
	return NewCareerReportsModel(sqlx.NewSqlConnFromSession(session))
}
