package assistant

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type DeleteConversationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteConversationLogic {
	return &DeleteConversationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteConversationLogic) DeleteConversation(req *types.DeleteAssistantConversationReq) (*types.DeleteAssistantConversationResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.DeleteAssistantConversationResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	conversation, err := l.svcCtx.AssistantConversationsModel.FindOneByUserId(l.ctx, userId, req.Id)
	if err != nil {
		return &types.DeleteAssistantConversationResp{
			Code: errors.CodeNotFound,
			Msg:  "conversation not found",
		}, nil
	}

	if err := l.svcCtx.AssistantConversationsModel.Delete(l.ctx, conversation.Id); err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to delete conversation: %v", err)
		return &types.DeleteAssistantConversationResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to delete conversation",
		}, nil
	}

	return &types.DeleteAssistantConversationResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
	}, nil
}