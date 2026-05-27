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
	assistantMessagesFieldNames          = builder.RawFieldNames(&AssistantMessages{})
	assistantMessagesRows                = strings.Join(assistantMessagesFieldNames, ",")
	assistantMessagesRowsExpectAutoSet   = strings.Join(stringx.Remove(assistantMessagesFieldNames, "`id`", "`created_at`"), ",")
	assistantMessagesRowsWithPlaceHolder = strings.Join(stringx.Remove(assistantMessagesFieldNames, "`id`", "`created_at`"), "=?,") + "=?"
)

type (
	assistantMessagesModel interface {
		Insert(ctx context.Context, data *AssistantMessages) (sql.Result, error)
		FindOne(ctx context.Context, id int64) (*AssistantMessages, error)
		Update(ctx context.Context, data *AssistantMessages) error
		Delete(ctx context.Context, id int64) error
	}

	defaultAssistantMessagesModel struct {
		conn  sqlx.SqlConn
		table string
	}

	AssistantMessages struct {
		Id             int64  `db:"id"`
		ConversationId int64  `db:"conversation_id"`
		Role           string `db:"role"`
		Content        string `db:"content"`
		CreatedAt      int64  `db:"created_at"`
	}
)

func newAssistantMessagesModel(conn sqlx.SqlConn) *defaultAssistantMessagesModel {
	return &defaultAssistantMessagesModel{
		conn:  conn,
		table: "`assistant_messages`",
	}
}

func (m *defaultAssistantMessagesModel) Insert(ctx context.Context, data *AssistantMessages) (sql.Result, error) {
	query := fmt.Sprintf("insert into %s (%s) values (?, ?, ?, ?)", m.table, assistantMessagesRowsExpectAutoSet)
	ret, err := m.conn.ExecCtx(ctx, query, data.ConversationId, data.Role, data.Content, data.CreatedAt)
	return ret, err
}

func (m *defaultAssistantMessagesModel) FindOne(ctx context.Context, id int64) (*AssistantMessages, error) {
	query := fmt.Sprintf("select %s from %s where `id` = ? limit 1", assistantMessagesRows, m.table)
	var resp AssistantMessages
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

func (m *defaultAssistantMessagesModel) Update(ctx context.Context, data *AssistantMessages) error {
	query := fmt.Sprintf("update %s set %s where `id` = ?", m.table, assistantMessagesRowsWithPlaceHolder)
	_, err := m.conn.ExecCtx(ctx, query, data.ConversationId, data.Role, data.Content, data.Id)
	return err
}

func (m *defaultAssistantMessagesModel) Delete(ctx context.Context, id int64) error {
	query := fmt.Sprintf("delete from %s where `id` = ?", m.table)
	_, err := m.conn.ExecCtx(ctx, query, id)
	return err
}