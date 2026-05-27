package model

import (
	"context"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ AssistantConversationsModel = (*customAssistantConversationsModel)(nil)

type (
	AssistantConversationsModel interface {
		assistantConversationsModel
		withSession(session sqlx.Session) AssistantConversationsModel
		FindByUserId(ctx context.Context, userId int64, page, pageSize int) ([]*AssistantConversations, int64, error)
		FindOneByUserId(ctx context.Context, userId int64, id int64) (*AssistantConversations, error)
		UpdateTitle(ctx context.Context, id int64, title string) error
	}

	customAssistantConversationsModel struct {
		*defaultAssistantConversationsModel
	}
)

func NewAssistantConversationsModel(conn sqlx.SqlConn) AssistantConversationsModel {
	return &customAssistantConversationsModel{
		defaultAssistantConversationsModel: newAssistantConversationsModel(conn),
	}
}

func (m *customAssistantConversationsModel) withSession(session sqlx.Session) AssistantConversationsModel {
	return NewAssistantConversationsModel(sqlx.NewSqlConnFromSession(session))
}

func (m *customAssistantConversationsModel) FindByUserId(ctx context.Context, userId int64, page, pageSize int) ([]*AssistantConversations, int64, error) {
	var total int64
	countQuery := fmt.Sprintf("select count(*) from %s where `user_id` = ?", m.table)
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, userId)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s where `user_id` = ? order by `updated_at` desc limit ? offset ?", assistantConversationsRows, m.table)
	var resp []*AssistantConversations
	err = m.conn.QueryRowsCtx(ctx, &resp, query, userId, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

func (m *customAssistantConversationsModel) FindOneByUserId(ctx context.Context, userId int64, id int64) (*AssistantConversations, error) {
	query := fmt.Sprintf("select %s from %s where `user_id` = ? and `id` = ? limit 1", assistantConversationsRows, m.table)
	var resp AssistantConversations
	err := m.conn.QueryRowCtx(ctx, &resp, query, userId, id)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (m *customAssistantConversationsModel) UpdateTitle(ctx context.Context, id int64, title string) error {
	query := fmt.Sprintf("update %s set `title` = ?, `updated_at` = ? where `id` = ?", m.table)
	now := time.Now().Unix()
	_, err := m.conn.ExecCtx(ctx, query, title, now, id)
	return err
}