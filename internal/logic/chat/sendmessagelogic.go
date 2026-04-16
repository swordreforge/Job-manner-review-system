package chat

import (
	"context"
	"strings"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SendMessageLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendMessageLogic {
	return &SendMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendMessageLogic) SendMessage(groupID int64, req *types.SendChatMessageReq) (*types.ChatMessage, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}
	content := strings.TrimSpace(req.Content)
	if content == "" {
		return nil, &apperrors.CodeError{Code: apperrors.CodeInvalidParams, Msg: "content is required"}
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}

	if ok, err := groupHasMember(l.ctx, db, groupID, user.id, normalizeUserType(user.role)); err != nil {
		return nil, err
	} else if !ok {
		return nil, &apperrors.CodeError{Code: apperrors.CodeForbidden, Msg: "forbidden"}
	}

	now := time.Now().Unix()
	tx, err := db.BeginTx(l.ctx, nil)
	if err != nil {
		logx.Errorf("begin chat message tx failed: %v", err)
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	result, err := tx.ExecContext(l.ctx,
		`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		groupID, user.id, normalizeUserType(user.role), user.name, content, now)
	if err != nil {
		logx.Errorf("send message failed: %v", err)
		return nil, err
	}

	if _, err := tx.ExecContext(l.ctx,
		`UPDATE chat_groups SET updated_at = ? WHERE id = ?`,
		now, groupID); err != nil {
		logx.Errorf("update chat group failed: %v", err)
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		logx.Errorf("commit chat message tx failed: %v", err)
		return nil, err
	}

	messageID, _ := result.LastInsertId()
	message := &types.ChatMessage{
		Id:         messageID,
		GroupId:    groupID,
		SenderId:   user.id,
		SenderType: normalizeUserType(user.role),
		SenderName: user.name,
		Content:    content,
		CreatedAt:  now,
	}
	broadcastChatMessage(groupID, *message)

	return message, nil
}
