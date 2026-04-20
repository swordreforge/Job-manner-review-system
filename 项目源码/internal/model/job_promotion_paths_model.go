package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ JobPromotionPathsModel = (*customJobPromotionPathsModel)(nil)

type (
	// JobPromotionPathsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customJobPromotionPathsModel.
	JobPromotionPathsModel interface {
		jobPromotionPathsModel
		withSession(session sqlx.Session) JobPromotionPathsModel
		FindByFromJob(ctx context.Context, fromJobId int64) ([]*JobPromotionPaths, error)
		FindByToJob(ctx context.Context, toJobId int64) ([]*JobPromotionPaths, error)
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

// FindByFromJob 查询指定岗位的所有晋升路径
func (m *customJobPromotionPathsModel) FindByFromJob(ctx context.Context, fromJobId int64) ([]*JobPromotionPaths, error) {
	query := fmt.Sprintf("select %s from %s where `from_job_id` = ?", jobPromotionPathsRows, m.table)
	var resp []*JobPromotionPaths
	err := m.conn.QueryRowsCtx(ctx, &resp, query, fromJobId)
	switch err {
	case nil:
		return resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

// FindByToJob 查询可以转换到指定岗位的所有路径
func (m *customJobPromotionPathsModel) FindByToJob(ctx context.Context, toJobId int64) ([]*JobPromotionPaths, error) {
	query := fmt.Sprintf("select %s from %s where `to_job_id` = ?", jobPromotionPathsRows, m.table)
	var resp []*JobPromotionPaths
	err := m.conn.QueryRowsCtx(ctx, &resp, query, toJobId)
	switch err {
	case nil:
		return resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}
