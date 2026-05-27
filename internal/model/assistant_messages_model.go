package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ AssistantMessagesModel = (*customAssistantMessagesModel)(nil)

type (
	AssistantMessagesModel interface {
		assistantMessagesModel
		withSession(session sqlx.Session) AssistantMessagesModel
		FindByConversationId(ctx context.Context, conversationId int64) ([]*AssistantMessages, error)
		InsertWithTimestamp(ctx context.Context, data *AssistantMessages) (sql.Result, error)
	}

	customAssistantMessagesModel struct {
		*defaultAssistantMessagesModel
	}
)

func NewAssistantMessagesModel(conn sqlx.SqlConn) AssistantMessagesModel {
	return &customAssistantMessagesModel{
		defaultAssistantMessagesModel: newAssistantMessagesModel(conn),
	}
}

func (m *customAssistantMessagesModel) withSession(session sqlx.Session) AssistantMessagesModel {
	return NewAssistantMessagesModel(sqlx.NewSqlConnFromSession(session))
}

func (m *customAssistantMessagesModel) FindByConversationId(ctx context.Context, conversationId int64) ([]*AssistantMessages, error) {
	query := fmt.Sprintf("select %s from %s where `conversation_id` = ? order by `created_at` asc", assistantMessagesRows, m.table)
	var resp []*AssistantMessages
	err := m.conn.QueryRowsCtx(ctx, &resp, query, conversationId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *customAssistantMessagesModel) InsertWithTimestamp(ctx context.Context, data *AssistantMessages) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	query := fmt.Sprintf("insert into %s (`conversation_id`, `role`, `content`, `created_at`) values (?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.ConversationId, data.Role, data.Content, data.CreatedAt)
	return ret, err
}