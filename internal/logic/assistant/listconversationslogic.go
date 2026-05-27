package assistant

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type ListConversationsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListConversationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListConversationsLogic {
	return &ListConversationsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListConversationsLogic) ListConversations(req *types.ListConversationsReq) (*types.ListAssistantConversationsResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ListAssistantConversationsResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	conversations, total, err := l.svcCtx.AssistantConversationsModel.FindByUserId(l.ctx, userId, req.Page, req.PageSize)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to list conversations: %v", err)
		return &types.ListAssistantConversationsResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to list conversations",
		}, nil
	}

	var list []*types.AssistantConversation
	for _, c := range conversations {
		list = append(list, &types.AssistantConversation{
			Id:        c.Id,
			UserId:    c.UserId,
			Title:     c.Title,
			Track:     c.Track,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}

	return &types.ListAssistantConversationsResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.AssistantConversationList{
			Total: total,
			List:  list,
		},
	}, nil
}