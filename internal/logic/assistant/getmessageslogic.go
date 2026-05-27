package assistant

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetMessagesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMessagesLogic {
	return &GetMessagesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMessagesLogic) GetMessages(req *types.GetAssistantMessagesReq) (*types.GetAssistantMessagesResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.GetAssistantMessagesResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	conversation, err := l.svcCtx.AssistantConversationsModel.FindOneByUserId(l.ctx, userId, req.ConversationId)
	if err != nil {
		return &types.GetAssistantMessagesResp{
			Code: errors.CodeNotFound,
			Msg:  "conversation not found",
		}, nil
	}

	messages, err := l.svcCtx.AssistantMessagesModel.FindByConversationId(l.ctx, conversation.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get messages: %v", err)
		return &types.GetAssistantMessagesResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get messages",
		}, nil
	}

	var list []*types.AssistantMessage
	for _, m := range messages {
		list = append(list, &types.AssistantMessage{
			Id:             m.Id,
			ConversationId: m.ConversationId,
			Role:           m.Role,
			Content:        m.Content,
			CreatedAt:      m.CreatedAt,
		})
	}

	return &types.GetAssistantMessagesResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.AssistantMessageList{
			Total: int64(len(list)),
			List:  list,
		},
	}, nil
}