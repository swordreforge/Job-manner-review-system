package model

import "github.com/zeromicro/go-zero/core/stores/sqlx"

var _ StudentsModel = (*customStudentsModel)(nil)

type (
	// StudentsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customStudentsModel.
	StudentsModel interface {
		studentsModel
		withSession(session sqlx.Session) StudentsModel
	}

	customStudentsModel struct {
		*defaultStudentsModel
	}
)

// NewStudentsModel returns a model for the database table.
func NewStudentsModel(conn sqlx.SqlConn) StudentsModel {
	return &customStudentsModel{
		defaultStudentsModel: newStudentsModel(conn),
	}
}

func (m *customStudentsModel) withSession(session sqlx.Session) StudentsModel {
	return NewStudentsModel(sqlx.NewSqlConnFromSession(session))
}
