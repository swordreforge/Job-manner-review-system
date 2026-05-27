package assistant

import (
	"context"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type CreateConversationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateConversationLogic {
	return &CreateConversationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateConversationLogic) CreateConversation(req *types.CreateAssistantConversationReq) (*types.CreateAssistantConversationResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.CreateAssistantConversationResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	now := time.Now().Unix()
	conversation := &model.AssistantConversations{
		UserId:    userId,
		Title:     "新对话",
		Track:     req.Track,
		CreatedAt: now,
		UpdatedAt: now,
	}

	result, err := l.svcCtx.AssistantConversationsModel.Insert(l.ctx, conversation)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to create conversation: %v", err)
		return &types.CreateAssistantConversationResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to create conversation",
		}, nil
	}

	id, _ := result.LastInsertId()
	conversation.Id = id

	return &types.CreateAssistantConversationResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.AssistantConversation{
			Id:        conversation.Id,
			UserId:    conversation.UserId,
			Title:     conversation.Title,
			Track:     conversation.Track,
			CreatedAt: conversation.CreatedAt,
			UpdatedAt: conversation.UpdatedAt,
		},
	}, nil
}