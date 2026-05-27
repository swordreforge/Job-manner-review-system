package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/builder"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"github.com/zeromicro/go-zero/core/stringx"
)

var (
	assistantConversationsFieldNames          = builder.RawFieldNames(&AssistantConversations{})
	assistantConversationsRows                = strings.Join(assistantConversationsFieldNames, ",")
	assistantConversationsRowsExpectAutoSet   = strings.Join(stringx.Remove(assistantConversationsFieldNames, "`id`", "`created_at`", "`updated_at`"), ",")
	assistantConversationsRowsWithPlaceHolder = strings.Join(stringx.Remove(assistantConversationsFieldNames, "`id`", "`created_at`", "`updated_at`"), "=?,") + "=?"
)

type (
	assistantConversationsModel interface {
		Insert(ctx context.Context, data *AssistantConversations) (sql.Result, error)
		FindOne(ctx context.Context, id int64) (*AssistantConversations, error)
		Update(ctx context.Context, data *AssistantConversations) error
		Delete(ctx context.Context, id int64) error
	}

	defaultAssistantConversationsModel struct {
		conn  sqlx.SqlConn
		table string
	}

	AssistantConversations struct {
		Id        int64  `db:"id"`
		UserId    int64  `db:"user_id"`
		Title     string `db:"title"`
		Track     string `db:"track"`
		CreatedAt int64  `db:"created_at"`
		UpdatedAt int64  `db:"updated_at"`
	}
)

func newAssistantConversationsModel(conn sqlx.SqlConn) *defaultAssistantConversationsModel {
	return &defaultAssistantConversationsModel{
		conn:  conn,
		table: "`assistant_conversations`",
	}
}

func (m *defaultAssistantConversationsModel) Insert(ctx context.Context, data *AssistantConversations) (sql.Result, error) {
	query := fmt.Sprintf("insert into %s (%s) values (?, ?, ?, ?, ?)", m.table, assistantConversationsRowsExpectAutoSet)
	ret, err := m.conn.ExecCtx(ctx, query, data.UserId, data.Title, data.Track, data.CreatedAt, data.UpdatedAt)
	return ret, err
}

func (m *defaultAssistantConversationsModel) FindOne(ctx context.Context, id int64) (*AssistantConversations, error) {
	query := fmt.Sprintf("select %s from %s where `id` = ? limit 1", assistantConversationsRows, m.table)
	var resp AssistantConversations
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	switch err {
	case nil:
		return &resp, nil
	case sqlx.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (m *defaultAssistantConversationsModel) Update(ctx context.Context, data *AssistantConversations) error {
	query := fmt.Sprintf("update %s set %s where `id` = ?", m.table, assistantConversationsRowsWithPlaceHolder)
	_, err := m.conn.ExecCtx(ctx, query, data.UserId, data.Title, data.Track, data.UpdatedAt, data.Id)
	return err
}

func (m *defaultAssistantConversationsModel) Delete(ctx context.Context, id int64) error {
	query := fmt.Sprintf("delete from %s where `id` = ?", m.table)
	_, err := m.conn.ExecCtx(ctx, query, id)
	return err
}