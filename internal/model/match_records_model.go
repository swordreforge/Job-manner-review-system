package model

import "github.com/zeromicro/go-zero/core/stores/sqlx"

var _ MatchRecordsModel = (*customMatchRecordsModel)(nil)

type (
	// MatchRecordsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customMatchRecordsModel.
	MatchRecordsModel interface {
		matchRecordsModel
		withSession(session sqlx.Session) MatchRecordsModel
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
