package student

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteResumeHistoryLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Delete resume parse history record
func NewDeleteResumeHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteResumeHistoryLogic {
	return &DeleteResumeHistoryLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteResumeHistoryLogic) DeleteResumeHistory(id int64) (resp *types.StudentResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.StudentResp{
			Code: 401,
			Msg:  "unauthorized",
		}, nil
	}

	history, err := l.svcCtx.ResumeParseHistoryModel.FindOne(l.ctx, id)
	if err != nil {
		return &types.StudentResp{
			Code: 404,
			Msg:  "history record not found",
		}, nil
	}

	// 验证权限：只能删除自己的历史记录
	if history.UserId != userId {
		return &types.StudentResp{
			Code: 403,
			Msg:  "forbidden: you can only delete your own history",
		}, nil
	}

	if err := l.svcCtx.ResumeParseHistoryModel.Delete(l.ctx, id); err != nil {
		return &types.StudentResp{
			Code: 500,
			Msg:  "failed to delete history record",
		}, nil
	}

	return &types.StudentResp{
		Code: 0,
		Msg:  "success",
	}, nil
}