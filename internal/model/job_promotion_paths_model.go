package model

import "github.com/zeromicro/go-zero/core/stores/sqlx"

var _ JobPromotionPathsModel = (*customJobPromotionPathsModel)(nil)

type (
	// JobPromotionPathsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customJobPromotionPathsModel.
	JobPromotionPathsModel interface {
		jobPromotionPathsModel
		withSession(session sqlx.Session) JobPromotionPathsModel
	}

	customJobPromotionPathsModel struct {
		*defaultJobPromotionPathsModel
	}
)

// NewJobPromotionPathsModel returns a model for the database table.
func NewJobPromotionPathsModel(conn sqlx.SqlConn) JobPromotionPathsModel {
	return &customJobPromotionPathsModel{
		defaultJobPromotionPathsModel: newJobPromotionPathsModel(conn),
	}
}

func (m *customJobPromotionPathsModel) withSession(session sqlx.Session) JobPromotionPathsModel {
	return NewJobPromotionPathsModel(sqlx.NewSqlConnFromSession(session))
}
