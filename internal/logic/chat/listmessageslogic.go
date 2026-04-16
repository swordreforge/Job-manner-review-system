package chat

import (
	"context"
	"database/sql"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListMessagesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListMessagesLogic {
	return &ListMessagesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListMessagesLogic) ListMessages(groupId int64) ([]types.ChatMessage, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}

	if ok, err := groupHasMember(l.ctx, db, groupId, user.id, normalizeUserType(user.role)); err != nil {
		return nil, err
	} else if !ok {
		return nil, &apperrors.CodeError{Code: apperrors.CodeForbidden, Msg: "forbidden"}
	}

	var messages []types.ChatMessage
	rows, err := db.QueryContext(l.ctx,
		`SELECT id, group_id, sender_id, sender_type, sender_name, content, created_at
		 FROM chat_messages WHERE group_id = ? ORDER BY created_at ASC, id ASC`,
		groupId)
	if err != nil {
		logx.Errorf("query messages failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m types.ChatMessage
		var senderName sql.NullString
		if err := rows.Scan(&m.Id, &m.GroupId, &m.SenderId, &m.SenderType, &senderName, &m.Content, &m.CreatedAt); err != nil {
			continue
		}
		if senderName.Valid {
			m.SenderName = senderName.String
		}
		messages = append(messages, m)
	}

	return messages, nil
}
