package ai

import (
	"context"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type RenameAIConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRenameAIConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RenameAIConversationLogic {
	return &RenameAIConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RenameAIConversationLogic) RenameAIConversation(conversationId int64, req *types.RenameAIConversationReq) (*types.AIConversation, error) {
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

	now := nowUnix()
	_, err = db.ExecContext(l.ctx,
		`UPDATE chat_groups SET name = ?, updated_at = ? WHERE id = ?`,
		req.Name, now, conversationId)
	if err != nil {
		return nil, &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "重命名失败"}
	}

	var c types.AIConversation
	row := db.QueryRowContext(l.ctx,
		`SELECT id, school_id, name, chat_type, COALESCE(interview_session_id, 0), created_by, created_at, updated_at FROM chat_groups WHERE id = ?`,
		conversationId)
	if err := row.Scan(&c.Id, &c.SchoolId, &c.Name, &c.ChatType, &c.InterviewSessionId, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}

	return &c, nil
}