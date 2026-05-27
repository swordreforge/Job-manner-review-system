package ai

import (
	"context"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListAIMessagesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListAIMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAIMessagesLogic {
	return &ListAIMessagesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListAIMessagesLogic) ListAIMessages(conversationId int64) ([]*types.AIMessage, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := getDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		return nil, &apperrors.CodeError{Code: apperrors.CodeNotFound, Msg: "对话不存在"}
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT id, group_id, sender_id, sender_type, sender_name, content, created_at
		 FROM chat_messages
		 WHERE group_id = ?
		 ORDER BY created_at ASC, id ASC`, conversationId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*types.AIMessage
	for rows.Next() {
		var msg types.AIMessage
		if err := rows.Scan(&msg.Id, &msg.GroupId, &msg.SenderId, &msg.SenderType, &msg.SenderName, &msg.Content, &msg.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, &msg)
	}

	return messages, nil
}