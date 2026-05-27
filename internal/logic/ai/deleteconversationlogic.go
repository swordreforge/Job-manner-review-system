package ai

import (
	"context"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteAIConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteAIConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteAIConversationLogic {
	return &DeleteAIConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteAIConversationLogic) DeleteAIConversation(conversationId int64) error {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return err
	}

	db, err := getDB(l.ctx, l.svcCtx)
	if err != nil {
		return err
	}

	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		return &apperrors.CodeError{Code: apperrors.CodeNotFound, Msg: "对话不存在"}
	}

	_, _ = db.ExecContext(l.ctx, `DELETE FROM chat_messages WHERE group_id = ?`, conversationId)
	_, _ = db.ExecContext(l.ctx, `DELETE FROM chat_group_members WHERE group_id = ?`, conversationId)
	_, err = db.ExecContext(l.ctx, `DELETE FROM chat_groups WHERE id = ?`, conversationId)
	if err != nil {
		return &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "删除失败"}
	}

	return nil
}